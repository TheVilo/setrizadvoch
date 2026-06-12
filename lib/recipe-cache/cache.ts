import { Recipe, SaleItem, MealType, Tier } from '@/types'

export function scoreRecipe(
  recipe: Recipe,
  activeSaleItems: SaleItem[],
  dietTags: string[],
  recentlyShownIds: string[]
): number {
  const saleNames = activeSaleItems.map(s => s.raw_name.toLowerCase())
  const ingredients = recipe.ingredients || []

  // Koľko % ingrediencií je v akcii
  const onSaleCount = ingredients.filter(ing =>
    saleNames.some(sale => sale.includes(ing.canonical_name.toLowerCase()) ||
      ing.canonical_name.toLowerCase().includes(sale))
  ).length
  const saleOverlap = ingredients.length > 0 ? onSaleCount / ingredients.length : 0

  // Zhoda diéty
  const dietMatch = dietTags.length === 0 ? 1 :
    dietTags.every(d => recipe.dietary_tags.includes(d)) ? 1 : 0

  // Penalizácia za nedávno zobrazené
  const freshnessPenalty = recentlyShownIds.includes(recipe.id) ? -0.5 : 0

  // Popularita (malá váha)
  const popularityBonus = Math.min(recipe.popularity / 100, 0.15)

  return (saleOverlap * 0.5) + (dietMatch * 0.3) + freshnessPenalty + popularityBonus
}

export function selectBestFromCache(
  recipes: Recipe[],
  count: number,
  activeSaleItems: SaleItem[],
  dietTags: string[],
  recentlyShownIds: string[]
): Recipe[] {
  const CACHE_THRESHOLD = 0.4

  const scored = recipes
    .map(r => ({ recipe: r, score: scoreRecipe(r, activeSaleItems, dietTags, recentlyShownIds) }))
    .filter(({ score }) => score >= CACHE_THRESHOLD)
    .sort((a, b) => b.score - a.score)

  return scored.slice(0, count).map(({ recipe }) => recipe)
}
