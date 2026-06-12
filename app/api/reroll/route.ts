import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getTierLimits } from '@/lib/tier-gates/gates'
import { buildRecipePrompt } from '@/lib/anthropic/prompts'
import { selectBestFromCache } from '@/lib/recipe-cache/cache'
import { RerollRequest, Recipe, MealType } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('id', user.id).single()
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 })

    const limits = getTierLimits(profile.tier)

    // Skontroluj dnešné použitie
    const today = new Date().toISOString().split('T')[0]
    const { data: usage } = await supabase
      .from('reroll_usage')
      .select('count')
      .eq('user_id', user.id)
      .eq('used_date', today)
      .single()

    const usedToday = usage?.count || 0

    if (usedToday >= limits.rerollsPerDay) {
      return NextResponse.json({
        error: 'reroll_limit',
        message: `Dnešný limit výmen je ${limits.rerollsPerDay}.`
      }, { status: 403 })
    }

    const { planSlotId, planId }: RerollRequest = await req.json()

    // Načítaj aktuálny slot
    const { data: slot } = await supabase
      .from('plan_slots').select('*').eq('id', planSlotId).single()
    if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 })

    // Načítaj plán pre kontext
    const { data: plan } = await supabase
      .from('meal_plans').select('*').eq('id', planId).single()
    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

    // Aktuálne akcie
    const { data: saleItems } = await supabase
      .from('sale_items').select('*').eq('chain', plan.store)
      .gte('valid_to', today).lte('valid_from', today)

    // Nájdi iný recept z cache (vylúč súčasný)
    const adminSupabase = createAdminClient()
    const { data: cachedRecipes } = await adminSupabase
      .from('recipes')
      .select('*, recipe_ingredients(*)')
      .eq('meal_type', slot.meal_type)
      .neq('id', slot.recipe_id)
      .limit(20)

    let newRecipe: Recipe | null = null
    const bestFromCache = selectBestFromCache(
      (cachedRecipes as Recipe[]) || [],
      1,
      saleItems || [],
      profile.preferences?.diet || [],
      [slot.recipe_id]
    )

    if (bestFromCache.length > 0) {
      newRecipe = bestFromCache[0]
    } else {
      // Generovať nový cez LLM
      const prompt = buildRecipePrompt({
        store: plan.store,
        saleItems: saleItems || [],
        count: 1,
        mealType: slot.meal_type as MealType,
        persons: plan.persons,
        dietTags: profile.preferences?.diet || [],
        allergies: profile.preferences?.allergies || [],
        excludeTitles: [],
      })

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      })

      const text = message.content[0].type === 'text' ? message.content[0].text : ''
      try {
        const clean = text.replace(/```json|```/g, '').trim()
        const [r] = JSON.parse(clean)
        const { data: saved } = await adminSupabase.from('recipes').insert({
          title: r.title, meal_type: slot.meal_type,
          servings_base: plan.persons, instructions: r.instructions,
          dietary_tags: r.dietary_tags || [], est_cost_eur: r.est_cost_eur,
          est_savings_eur: r.est_savings_eur, nutrition: r.nutrition_per_serving,
          source: 'ai',
        }).select().single()

        if (saved && r.ingredients?.length > 0) {
          await adminSupabase.from('recipe_ingredients').insert(
            r.ingredients.map((ing: any) => ({
              recipe_id: saved.id, canonical_name: ing.canonical_name,
              qty: ing.qty, unit: ing.unit, on_sale: ing.on_sale,
              sale_price: ing.sale_price, base_price: ing.base_price,
            }))
          )
          newRecipe = { ...saved, ingredients: r.ingredients, nutrition: r.nutrition_per_serving }
        }
      } catch (e) {
        return NextResponse.json({ error: 'Nepodarilo sa vygenerovať recept' }, { status: 500 })
      }
    }

    if (!newRecipe) return NextResponse.json({ error: 'No recipe found' }, { status: 500 })

    // Aktualizuj slot
    await supabase.from('plan_slots').update({ recipe_id: newRecipe.id }).eq('id', planSlotId)

    // Zaznamenaj použitie rerollu
    await supabase.from('reroll_usage').upsert({
      user_id: user.id,
      used_date: today,
      count: usedToday + 1,
    }, { onConflict: 'user_id,used_date' })

    return NextResponse.json({ recipe: newRecipe, rerollsRemaining: limits.rerollsPerDay - usedToday - 1 })

  } catch (error) {
    console.error('Reroll error:', error)
    return NextResponse.json({ error: 'Nastala chyba' }, { status: 500 })
  }
}
