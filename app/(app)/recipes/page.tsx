import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Recipe } from '@/types'
import { formatEur } from '@/lib/utils/formatting'
import { ChefHat, Flame } from 'lucide-react'

const MEAL_COLORS: Record<string, string> = {
  ranajky: 'from-amber-400 to-orange-500',
  obed: 'from-green-400 to-emerald-600',
  vecera: 'from-blue-400 to-indigo-600',
  snack: 'from-pink-400 to-rose-500',
}

export default async function RecipesPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: savedItems } = await supabase
    .from('saved_items').select('item_id').eq('user_id', user.id).eq('item_type', 'recipe')

  const recipeIds = (savedItems || []).map(s => s.item_id)
  const recipes: Recipe[] = []

  if (recipeIds.length > 0) {
    const { data } = await supabase
      .from('recipes').select('*').in('id', recipeIds)
    if (data) recipes.push(...(data as Recipe[]))
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="rounded-full bg-green-100 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <ChefHat className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Zatiaľ žiadne uložené recepty</h2>
        <p className="text-gray-500 text-sm mb-6">Vytvor prvý plán a klikni na srdiečko pri receptoch</p>
        <Button asChild>
          <Link href="/plan/new">Vytvoriť plán</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Moje recepty</h1>
        <span className="text-sm text-gray-500">{recipes.length} uložených</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {recipes.map(recipe => (
          <Card key={recipe.id} className="overflow-hidden">
            <div className={`h-20 bg-gradient-to-br ${MEAL_COLORS[recipe.meal_type] || 'from-gray-400 to-gray-600'} flex items-center justify-center`}>
              <span className="text-white text-3xl">
                {recipe.meal_type === 'ranajky' ? '🌅' : recipe.meal_type === 'obed' ? '☀️' : recipe.meal_type === 'vecera' ? '🌙' : '🍎'}
              </span>
            </div>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2">{recipe.title}</h3>
              <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Flame className="h-3 w-3 text-orange-500" />
                  {recipe.nutrition?.kcal || 0} kcal
                </span>
                {(recipe.est_savings_eur || 0) > 0 && (
                  <Badge variant="sale" className="text-xs py-0">
                    -{formatEur(recipe.est_savings_eur || 0)}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-500">Cena: {formatEur(recipe.est_cost_eur || 0)}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
