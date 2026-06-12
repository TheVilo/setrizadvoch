import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getTierLimits, canGeneratePlan } from '@/lib/tier-gates/gates'
import { buildRecipePrompt } from '@/lib/anthropic/prompts'
import { selectBestFromCache } from '@/lib/recipe-cache/cache'
import { GenerateRecipesRequest, Recipe, MealType } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Načítaj profil
    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const body: GenerateRecipesRequest = await req.json()
    const { store, days, mealTypes, persons, diet = [], allergies = [] } = body

    // Tier kontrola na serveri
    if (!canGeneratePlan(profile.tier, days)) {
      return NextResponse.json({
        error: 'tier_limit',
        message: `Free plán umožňuje max ${getTierLimits(profile.tier).maxDays} dni.`
      }, { status: 403 })
    }

    // Načítaj aktuálne akcie
    const { data: saleItems } = await supabase
      .from('sale_items')
      .select('*')
      .eq('chain', store)
      .gte('valid_to', new Date().toISOString().split('T')[0])
      .lte('valid_from', new Date().toISOString().split('T')[0])

    if (!saleItems || saleItems.length === 0) {
      return NextResponse.json({ error: 'Žiadne akcie pre tento obchod' }, { status: 400 })
    }

    // Pre každý deň a každý typ jedla vygeneruj/nájdi recept
    const allRecipes: Record<number, Record<string, Recipe>> = {}
    const adminSupabase = createAdminClient()

    for (let day = 1; day <= days; day++) {
      allRecipes[day] = {}

      for (const mealType of mealTypes) {
        // Cache lookup
        const { data: cachedRecipes } = await adminSupabase
          .from('recipes')
          .select('*, recipe_ingredients(*)')
          .eq('meal_type', mealType)
          .limit(20)

        const bestFromCache = selectBestFromCache(
          (cachedRecipes as Recipe[]) || [],
          1,
          saleItems,
          diet,
          Object.values(allRecipes).flatMap(d => Object.values(d)).map(r => r.id)
        )

        if (bestFromCache.length > 0) {
          // Použiť z cache
          allRecipes[day][mealType] = bestFromCache[0]
          await adminSupabase.from('recipes').update({ popularity: bestFromCache[0].popularity + 1 })
            .eq('id', bestFromCache[0].id)
        } else {
          // Generovať cez LLM
          const existingTitles = Object.values(allRecipes)
            .flatMap(d => Object.values(d))
            .map(r => r.title)

          const prompt = buildRecipePrompt({
            store, saleItems, count: 1,
            mealType: mealType as MealType,
            persons, dietTags: diet, allergies,
            excludeTitles: existingTitles
          })

          const message = await anthropic.messages.create({
            model: 'claude-sonnet-4-6',
            max_tokens: 2000,
            messages: [{ role: 'user', content: prompt }]
          })

          const text = message.content[0].type === 'text' ? message.content[0].text : ''
          let generated: any[]
          try {
            const clean = text.replace(/```json|```/g, '').trim()
            generated = JSON.parse(clean)
          } catch {
            continue
          }

          if (generated.length > 0) {
            const r = generated[0]
            // Ulož do cache
            const { data: savedRecipe } = await adminSupabase.from('recipes').insert({
              title: r.title,
              meal_type: mealType,
              servings_base: persons,
              instructions: r.instructions,
              dietary_tags: r.dietary_tags || [],
              est_cost_eur: r.est_cost_eur,
              est_savings_eur: r.est_savings_eur,
              nutrition: r.nutrition_per_serving,
              source: 'ai',
            }).select().single()

            if (savedRecipe) {
              // Ulož ingrediencie
              if (r.ingredients?.length > 0) {
                await adminSupabase.from('recipe_ingredients').insert(
                  r.ingredients.map((ing: any) => ({
                    recipe_id: savedRecipe.id,
                    canonical_name: ing.canonical_name,
                    qty: ing.qty,
                    unit: ing.unit,
                    on_sale: ing.on_sale,
                    sale_price: ing.sale_price,
                    base_price: ing.base_price,
                  }))
                )
              }
              allRecipes[day][mealType] = {
                ...savedRecipe,
                ingredients: r.ingredients,
                nutrition: r.nutrition_per_serving,
              }
            }
          }
        }
      }
    }

    // Vytvor meal_plan
    const totalCost = Object.values(allRecipes)
      .flatMap(d => Object.values(d))
      .reduce((s, r) => s + (r.est_cost_eur || 0), 0)
    const totalSavings = Object.values(allRecipes)
      .flatMap(d => Object.values(d))
      .reduce((s, r) => s + (r.est_savings_eur || 0), 0)

    const { data: plan } = await supabase.from('meal_plans').insert({
      user_id: user.id,
      store,
      days,
      persons,
      total_cost_eur: totalCost,
      total_savings_eur: totalSavings,
    }).select().single()

    if (!plan) return NextResponse.json({ error: 'Nepodarilo sa vytvoriť plán' }, { status: 500 })

    // Vytvor plan_slots
    const slots = []
    for (const [day, dayRecipes] of Object.entries(allRecipes)) {
      for (const [mealType, recipe] of Object.entries(dayRecipes)) {
        slots.push({
          plan_id: plan.id,
          day_number: parseInt(day),
          meal_type: mealType,
          recipe_id: recipe.id,
        })
      }
    }
    await supabase.from('plan_slots').insert(slots)

    // Aktualizuj celkové úspory používateľa
    await supabase.from('profiles')
      .update({ savings_total_eur: (profile.savings_total_eur || 0) + totalSavings })
      .eq('id', user.id)

    return NextResponse.json({
      planId: plan.id,
      days: allRecipes,
      totalCost,
      totalSavings,
    })

  } catch (error) {
    console.error('Generate recipes error:', error)
    return NextResponse.json({ error: 'Nastala chyba pri generovaní' }, { status: 500 })
  }
}
