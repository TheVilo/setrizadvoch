import { Tier, MealType, TierLimits } from '@/types'

export function getTierLimits(tier: Tier): TierLimits {
  switch (tier) {
    case 'premium':
      return {
        maxDays: 5,
        mealTypes: ['ranajky', 'obed', 'vecera', 'snack'],
        dietFilters: ['vegetarianske', 'bezlepkove', 'low-carb', 'keto', 'bez-laktózy'],
        rerollsPerDay: 5,
        maxSavedRecipes: Infinity,
        canCompareStores: true,
        canExportPdf: true,
        hasAds: false,
      }
    case 'family':
      return {
        maxDays: 5,
        mealTypes: ['ranajky', 'obed', 'vecera', 'snack'],
        dietFilters: ['vegetarianske', 'bezlepkove', 'low-carb', 'keto', 'bez-laktózy'],
        rerollsPerDay: 15,
        maxSavedRecipes: Infinity,
        canCompareStores: true,
        canExportPdf: true,
        hasAds: false,
      }
    default: // free
      return {
        maxDays: 2,
        mealTypes: ['obed', 'vecera'],
        dietFilters: ['vegetarianske'],
        rerollsPerDay: 1,
        maxSavedRecipes: 10,
        canCompareStores: false,
        canExportPdf: false,
        hasAds: true,
      }
  }
}

export function canGeneratePlan(tier: Tier, daysRequested: number): boolean {
  return daysRequested <= getTierLimits(tier).maxDays
}

export function canUseMealType(tier: Tier, mealType: MealType): boolean {
  return getTierLimits(tier).mealTypes.includes(mealType)
}

export function getRemainingRerolls(tier: Tier, usedToday: number): number {
  return Math.max(0, getTierLimits(tier).rerollsPerDay - usedToday)
}

export function canSaveRecipe(tier: Tier, currentSavedCount: number): boolean {
  return currentSavedCount < getTierLimits(tier).maxSavedRecipes
}

export function getTierLabel(tier: Tier): string {
  switch (tier) {
    case 'premium': return 'Premium'
    case 'family': return 'Family'
    default: return 'Free'
  }
}

export function getTierColor(tier: Tier): string {
  switch (tier) {
    case 'premium': return 'bg-amber-100 text-amber-800'
    case 'family': return 'bg-purple-100 text-purple-800'
    default: return 'bg-gray-100 text-gray-700'
  }
}
