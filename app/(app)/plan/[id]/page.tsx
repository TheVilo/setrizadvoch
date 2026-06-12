'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RecipeCard } from '@/components/recipe/RecipeCard'
import { RerollButton } from '@/components/recipe/RerollButton'
import { Button } from '@/components/ui/button'
import { MealPlan, PlanSlot, Recipe, Tier } from '@/types'
import { formatEur } from '@/lib/utils/formatting'
import { ShoppingCart, ArrowLeft } from 'lucide-react'

const MEAL_LABELS: Record<string, string> = {
  ranajky: 'Raňajky', obed: 'Obed', vecera: 'Večera', snack: 'Snack'
}

export default function PlanPage({ params }: { params: { id: string } }) {
  const [plan, setPlan] = useState<MealPlan | null>(null)
  const [slots, setSlots] = useState<PlanSlot[]>([])
  const [recipes, setRecipes] = useState<Record<string, Recipe>>({})
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set())
  const [rerollsUsed, setRerollsUsed] = useState(0)
  const [tier, setTier] = useState<Tier>('free')
  const [loading, setLoading] = useState(true)
  const [newRecipeIds, setNewRecipeIds] = useState<Set<string>>(new Set())

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: profile }, { data: planData }, { data: slotsData }] = await Promise.all([
        supabase.from('profiles').select('tier').eq('id', user.id).single(),
        supabase.from('meal_plans').select('*').eq('id', params.id).single(),
        supabase.from('plan_slots').select('*').eq('plan_id', params.id).order('day_number'),
      ])

      if (profile) setTier(profile.tier as Tier)
      if (planData) setPlan(planData)
      if (slotsData) {
        setSlots(slotsData)
        // Načítaj recepty pre všetky sloty
        const recipeIds = [...new Set(slotsData.map(s => s.recipe_id))]
        const { data: recipesData } = await supabase
          .from('recipes').select('*, recipe_ingredients(*)').in('id', recipeIds)
        if (recipesData) {
          const map: Record<string, Recipe> = {}
          recipesData.forEach(r => { map[r.id] = r as Recipe })
          setRecipes(map)
        }
      }

      // Reroll usage
      const today = new Date().toISOString().split('T')[0]
      const { data: usage } = await supabase
        .from('reroll_usage').select('count').eq('user_id', user.id).eq('used_date', today).single()
      if (usage) setRerollsUsed(usage.count)

      // Uložené recepty
      const { data: saved } = await supabase
        .from('saved_items').select('item_id').eq('user_id', user.id).eq('item_type', 'recipe')
      if (saved) setSavedRecipes(new Set(saved.map(s => s.item_id)))

      setLoading(false)
    }
    load()
  }, [params.id])

  async function handleReroll(slotId: string) {
    const res = await fetch('/api/reroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planSlotId: slotId, planId: params.id }),
    })
    const data = await res.json()
    if (res.ok && data.recipe) {
      const newRecipe = data.recipe as Recipe
      setRecipes(prev => ({ ...prev, [newRecipe.id]: newRecipe }))
      setSlots(prev => prev.map(s => s.id === slotId ? { ...s, recipe_id: newRecipe.id } : s))
      setRerollsUsed(prev => prev + 1)
      setNewRecipeIds(prev => new Set([...prev, newRecipe.id]))
    }
  }

  async function handleSaveRecipe(recipeId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    if (savedRecipes.has(recipeId)) {
      await supabase.from('saved_items').delete()
        .match({ user_id: user.id, item_type: 'recipe', item_id: recipeId })
      setSavedRecipes(prev => { const s = new Set(prev); s.delete(recipeId); return s })
    } else {
      await supabase.from('saved_items').insert({ user_id: user.id, item_type: 'recipe', item_id: recipeId })
      setSavedRecipes(prev => new Set([...prev, recipeId]))
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-center space-y-3">
        <div className="h-10 w-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-gray-500 text-sm">Načítavam plán...</p>
      </div>
    </div>
  )

  if (!plan) return <div className="text-center py-20 text-gray-500">Plán nebol nájdený.</div>

  const days = [...new Set(slots.map(s => s.day_number))].sort()

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Jedálniček — {plan.store.toUpperCase()}</h1>
          <p className="text-sm text-gray-500">{plan.days} {plan.days === 1 ? 'deň' : 'dni'} · {plan.persons} osoby</p>
        </div>
      </div>

      {/* Recepty po dňoch */}
      {days.map(day => {
        const daySlots = slots.filter(s => s.day_number === day)
        return (
          <div key={day}>
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
              Deň {day}
            </h2>
            <div className="space-y-3">
              {daySlots.map(slot => {
                const recipe = recipes[slot.recipe_id]
                if (!recipe) return null
                return (
                  <RecipeCard
                    key={slot.id}
                    recipe={recipe}
                    onSave={handleSaveRecipe}
                    isSaved={savedRecipes.has(recipe.id)}
                    isNew={newRecipeIds.has(recipe.id)}
                    rerollButton={
                      <RerollButton
                        planSlotId={slot.id}
                        tier={tier}
                        rerollsUsedToday={rerollsUsed}
                        onReroll={handleReroll}
                      />
                    }
                  />
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Sticky summary */}
      <div className="sticky bottom-4">
        <div className="bg-white border rounded-2xl shadow-lg p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-500">Celková cena</p>
            <p className="font-bold text-gray-900">{formatEur(plan.total_cost_eur || 0)}</p>
            <p className="text-xs text-green-700 font-medium">
              Ušetríš {formatEur(plan.total_savings_eur || 0)} 🎉
            </p>
          </div>
          <Button asChild className="gap-2 flex-shrink-0">
            <Link href={`/shopping-list/${plan.id}`}>
              <ShoppingCart className="h-4 w-4" />
              Nákupný zoznam
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
