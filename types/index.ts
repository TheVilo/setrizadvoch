export type Tier = 'free' | 'premium' | 'family'
export type MealType = 'ranajky' | 'obed' | 'vecera' | 'snack'
export type Chain = 'lidl' | 'kaufland' | 'tesco' | 'billa'

export interface Profile {
  id: string
  email: string
  tier: Tier
  family_id?: string
  preferences: {
    diet: string[]
    allergies: string[]
    default_persons: number
    favorite_store: Chain
  }
  savings_total_eur: number
  created_at: string
}

export interface SaleItem {
  id: string
  chain: Chain
  raw_name: string
  ingredient_id?: string
  sale_price: number
  base_price: number
  discount_pct?: number
  unit: string
  valid_from: string
  valid_to: string
  scraped_at: string
}

export interface Ingredient {
  id: string
  canonical_name: string
  category?: string
  unit?: string
  kcal_per_100g?: number
  protein_g_per_100g?: number
  carbs_g_per_100g?: number
  fat_g_per_100g?: number
  avg_price_eur?: number
  aliases?: string[]
}

export interface RecipeIngredient {
  recipe_id: string
  ingredient_id?: string
  canonical_name: string
  qty: number
  unit: string
  on_sale: boolean
  sale_price?: number
  base_price?: number
}

export interface NutritionInfo {
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface Recipe {
  id: string
  title: string
  meal_type: MealType
  servings_base: number
  instructions: string[]
  dietary_tags: string[]
  est_cost_eur: number
  est_savings_eur: number
  nutrition: NutritionInfo
  source: string
  used_sale_items?: string[]
  popularity: number
  rating_sum: number
  rating_count: number
  created_at: string
  ingredients?: RecipeIngredient[]
}

export interface MealPlan {
  id: string
  user_id: string
  store: Chain
  days: number
  persons: number
  total_cost_eur: number
  total_savings_eur: number
  status: string
  created_at: string
  slots?: PlanSlot[]
}

export interface PlanSlot {
  id: string
  plan_id: string
  day_number: number
  meal_type: MealType
  recipe_id: string
  recipe?: Recipe
}

export interface SavedItem {
  id: string
  user_id: string
  item_type: 'recipe' | 'plan'
  item_id: string
  saved_at: string
}

export interface RerollUsage {
  id: string
  user_id: string
  family_id?: string
  used_date: string
  count: number
}

export interface TierLimits {
  maxDays: number
  mealTypes: MealType[]
  dietFilters: string[]
  rerollsPerDay: number
  maxSavedRecipes: number
  canCompareStores: boolean
  canExportPdf: boolean
  hasAds: boolean
}

export interface PlanContext {
  store: Chain
  days: number
  mealTypes: MealType[]
  persons: number
  diet: string[]
  allergies: string[]
  activeSaleItems: SaleItem[]
  recentlyShownIds: string[]
  userId: string
  tier: Tier
}

export interface ShoppingItem {
  name: string
  qty: number
  unit: string
  price: number
  basePrice?: number
  onSale: boolean
  section: string
  checked: boolean
}

export interface GenerateRecipesRequest {
  store: Chain
  days: number
  mealTypes: MealType[]
  persons: number
  diet?: string[]
  allergies?: string[]
}

export interface RerollRequest {
  planSlotId: string
  planId: string
}
