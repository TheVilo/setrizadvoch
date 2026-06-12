import { Recipe, ShoppingItem } from '@/types'

const STORE_SECTIONS: Record<string, string[]> = {
  'Mäso a ryby': ['kuracie', 'bravčové', 'hovädzie', 'ryba', 'losos', 'tuniak', 'krkovička', 'mleté'],
  'Zelenina': ['paprika', 'cibuľa', 'cesnak', 'paradajka', 'šalát', 'brokolica', 'mrkva', 'zeler', 'cuketa', 'špinát'],
  'Ovocie': ['jablko', 'banán', 'pomaranč', 'citrón', 'limetka', 'jahoda', 'hrozno'],
  'Mliečne výrobky': ['mlieko', 'syr', 'smotana', 'maslo', 'jogurt', 'vajcia', 'tvaroh', 'eidam', 'mozzarella'],
  'Pečivo': ['chlieb', 'rožky', 'tortilla', 'bageta', 'pita'],
  'Suché potraviny': ['ryža', 'cestoviny', 'múka', 'olej', 'konzerva', 'šošovica', 'fazuľa', 'cícer', 'ovsené'],
  'Koreniny a omáčky': ['soľ', 'korenie', 'paprika korenina', 'kari', 'sójová', 'paradajkový pretlak', 'horčica'],
  'Ostatné': [],
}

function getSection(ingredientName: string): string {
  const lower = ingredientName.toLowerCase()
  for (const [section, keywords] of Object.entries(STORE_SECTIONS)) {
    if (keywords.some(k => lower.includes(k))) return section
  }
  return 'Ostatné'
}

export function aggregateShoppingList(recipes: Recipe[], persons: number): ShoppingItem[] {
  const itemMap = new Map<string, ShoppingItem>()

  for (const recipe of recipes) {
    if (!recipe.ingredients) continue
    const scale = persons / recipe.servings_base

    for (const ing of recipe.ingredients) {
      const key = ing.canonical_name.toLowerCase()
      const existing = itemMap.get(key)

      if (existing) {
        existing.qty += ing.qty * scale
      } else {
        itemMap.set(key, {
          name: ing.canonical_name,
          qty: ing.qty * scale,
          unit: ing.unit,
          price: ing.on_sale ? (ing.sale_price || 0) : 0,
          basePrice: ing.on_sale ? ing.base_price : undefined,
          onSale: ing.on_sale,
          section: getSection(ing.canonical_name),
          checked: false,
        })
      }
    }
  }

  return Array.from(itemMap.values())
    .sort((a, b) => a.section.localeCompare(b.section) || a.name.localeCompare(b.name))
}

export function groupBySection(items: ShoppingItem[]): Record<string, ShoppingItem[]> {
  return items.reduce((acc, item) => {
    if (!acc[item.section]) acc[item.section] = []
    acc[item.section].push(item)
    return acc
  }, {} as Record<string, ShoppingItem[]>)
}

export function formatShoppingListText(
  items: ShoppingItem[],
  store: string,
  totalCost: number,
  savings: number
): string {
  const grouped = groupBySection(items)
  let text = `🛒 Nákupný zoznam — ${store.toUpperCase()}\n`
  text += `💰 Celková cena: ${totalCost.toFixed(2)}€ | Ušetríš: ${savings.toFixed(2)}€\n\n`

  for (const [section, sectionItems] of Object.entries(grouped)) {
    text += `${section}:\n`
    for (const item of sectionItems) {
      const qty = Math.round(item.qty * 10) / 10
      const saleBadge = item.onSale ? ' 🏷️ AKCIA' : ''
      text += `- ${item.name} ${qty}${item.unit}${saleBadge}\n`
    }
    text += '\n'
  }
  return text
}

export function calculateTotals(items: ShoppingItem[]): { total: number; savings: number } {
  let total = 0
  let savings = 0

  for (const item of items) {
    if (item.price > 0) {
      total += item.price
      if (item.onSale && item.basePrice) {
        savings += item.basePrice - item.price
      }
    }
  }

  return { total, savings }
}
