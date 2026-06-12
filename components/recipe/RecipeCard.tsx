'use client'
import { useState } from 'react'
import { ChevronDown, ChevronUp, Heart, Flame, Beef, Wheat, Droplets } from 'lucide-react'
import { Recipe } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatEur } from '@/lib/utils/formatting'

const MEAL_COLORS: Record<string, string> = {
  ranajky: 'from-amber-400 to-orange-500',
  obed: 'from-green-400 to-emerald-600',
  vecera: 'from-blue-400 to-indigo-600',
  snack: 'from-pink-400 to-rose-500',
}

const MEAL_LABELS: Record<string, string> = {
  ranajky: '🌅 Raňajky',
  obed: '☀️ Obed',
  vecera: '🌙 Večera',
  snack: '🍎 Snack',
}

interface RecipeCardProps {
  recipe: Recipe
  onSave?: (recipeId: string) => void
  isSaved?: boolean
  rerollButton?: React.ReactNode
  isNew?: boolean
}

export function RecipeCard({ recipe, onSave, isSaved, rerollButton, isNew }: RecipeCardProps) {
  const [expanded, setExpanded] = useState(false)

  return (
    <Card className={`overflow-hidden transition-all ${isNew ? 'animate-flip-in' : ''}`}>
      {/* Farebný header podľa typu jedla */}
      <div className={`h-2 bg-gradient-to-r ${MEAL_COLORS[recipe.meal_type] || 'from-gray-400 to-gray-600'}`} />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <span className="text-xs text-gray-500 mb-1 block">{MEAL_LABELS[recipe.meal_type]}</span>
            <CardTitle className="text-base leading-snug">{recipe.title}</CardTitle>
          </div>
          {onSave && (
            <button onClick={() => onSave(recipe.id)} className="mt-1 text-gray-400 hover:text-red-500 transition-colors">
              <Heart className={`h-5 w-5 ${isSaved ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          )}
        </div>

        {/* Nutrícia */}
        <div className="flex gap-3 mt-2 flex-wrap">
          <NutriBadge icon={<Flame className="h-3 w-3" />} label={`${recipe.nutrition?.kcal || 0} kcal`} color="text-orange-600" />
          <NutriBadge icon={<Beef className="h-3 w-3" />} label={`${recipe.nutrition?.protein_g || 0}g bielk.`} color="text-red-600" />
          <NutriBadge icon={<Wheat className="h-3 w-3" />} label={`${recipe.nutrition?.carbs_g || 0}g sachar.`} color="text-amber-600" />
          <NutriBadge icon={<Droplets className="h-3 w-3" />} label={`${recipe.nutrition?.fat_g || 0}g tuky`} color="text-blue-600" />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Cena a úspora */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-sm font-medium text-gray-700">
            Cena receptu: <span className="font-bold">{formatEur(recipe.est_cost_eur || 0)}</span>
          </span>
          {(recipe.est_savings_eur || 0) > 0 && (
            <Badge variant="sale">🏷️ Ušetríš {formatEur(recipe.est_savings_eur || 0)}</Badge>
          )}
        </div>

        {/* Ingrediencie */}
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Suroviny</p>
          <div className="flex flex-wrap gap-1.5">
            {(recipe.ingredients || []).map((ing, i) => (
              <span
                key={i}
                className={`text-xs px-2 py-1 rounded-full ${
                  ing.on_sale
                    ? 'bg-green-100 text-green-800 font-medium'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {ing.on_sale ? '✓ ' : ''}{ing.canonical_name} {ing.qty}{ing.unit}
              </span>
            ))}
          </div>
        </div>

        {/* Postup */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-green-700 font-medium mb-2 hover:underline"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          {expanded ? 'Skryť postup' : 'Zobraziť postup'}
        </button>

        {expanded && (
          <ol className="space-y-1.5 text-sm text-gray-700">
            {recipe.instructions.map((step, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0 font-bold text-green-600">{i + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}

        {/* Reroll button */}
        {rerollButton && <div className="mt-3 pt-3 border-t">{rerollButton}</div>}
      </CardContent>
    </Card>
  )
}

function NutriBadge({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) {
  return (
    <span className={`flex items-center gap-1 text-xs ${color}`}>
      {icon}{label}
    </span>
  )
}
