import { createClient } from '@/lib/supabase/server'
import { ShoppingList } from '@/components/shopping/ShoppingList'
import { aggregateShoppingList } from '@/lib/utils/shopping-list'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Recipe } from '@/types'

export default async function ShoppingListPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: plan } = await supabase.from('meal_plans').select('*').eq('id', params.id).single()
  if (!plan) return <div className="text-center py-20 text-gray-500">Plán nebol nájdený.</div>

  const { data: slots } = await supabase
    .from('plan_slots').select('recipe_id').eq('plan_id', params.id)

  const recipeIds = (slots || []).map(s => s.recipe_id)
  const { data: recipes } = await supabase
    .from('recipes').select('*, recipe_ingredients(*)').in('id', recipeIds)

  const items = aggregateShoppingList((recipes as Recipe[]) || [], plan.persons)

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/plan/${params.id}`} className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nákupný zoznam</h1>
          <p className="text-sm text-gray-500">{plan.store.toUpperCase()} · {plan.persons} osoby</p>
        </div>
      </div>

      <ShoppingList items={items} store={plan.store} planId={params.id} />
    </div>
  )
}
