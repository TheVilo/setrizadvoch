import { SaleItem, MealType, Chain } from '@/types'

export function buildRecipePrompt(params: {
  store: Chain
  saleItems: SaleItem[]
  count: number
  mealType: MealType
  persons: number
  dietTags: string[]
  allergies: string[]
  excludeTitles: string[]
}): string {
  const { store, saleItems, count, mealType, persons, dietTags, allergies, excludeTitles } = params

  const saleFormatted = saleItems
    .map(i => `${i.raw_name} | ${i.sale_price}€ | ${i.base_price}€ | ${i.unit}`)
    .join('\n')

  const mealTypeLabels: Record<MealType, string> = {
    ranajky: 'raňajky',
    obed: 'obed',
    vecera: 'večera',
    snack: 'snack / desiata'
  }

  return `Ty si slovenský AI plánovač jedál, ktorý tvorí recepty postavené na aktuálnych akciách v obchode.

OBCHOD: ${store.toUpperCase()}
AKCIOVÉ SUROVINY TENTO TÝŽDEŇ (názov | akciová cena | pôvodná cena | jednotka):
${saleFormatted}

POŽIADAVKY:
- Počet receptov na vygenerovanie: ${count}
- Typ jedla: ${mealTypeLabels[mealType]}
- Počet porcií: ${persons}
- Diétne obmedzenia: ${dietTags.length > 0 ? dietTags.join(', ') : 'žiadne'}
- Alergény na vylúčenie: ${allergies.length > 0 ? allergies.join(', ') : 'žiadne'}
- Recepty z cache (neopakuj tieto titulky): ${excludeTitles.length > 0 ? excludeTitles.join(', ') : 'žiadne'}

PRAVIDLÁ:
1. Každý recept musí využiť ASPOŇ 2 akciové suroviny
2. Doplň iba bežné lacné základné suroviny (soľ, olej, cibuľa, cesnak, korenie)
3. Recepty píš po slovensky, jednoducho, do 35 minút prípravy
4. Vygeneruj RÔZNE recepty, nepodobné jeden druhému
5. est_savings_eur = suma úspor iba z akciových surovín (rozdiel base_price - sale_price × množstvo)
6. Nutrícia je orientačná, nemusí byť presná

VRÁŤ IBA platný JSON array, bez úvodu, bez komentárov, bez markdown backticks:
[
  {
    "title": "Názov receptu",
    "meal_type": "${mealType}",
    "servings_base": ${persons},
    "instructions": ["Krok 1...", "Krok 2...", "Krok 3..."],
    "dietary_tags": [],
    "ingredients": [
      {
        "canonical_name": "kuracie prsia",
        "qty": 400,
        "unit": "g",
        "on_sale": true,
        "sale_price": 4.99,
        "base_price": 6.49
      }
    ],
    "nutrition_per_serving": {
      "kcal": 450,
      "protein_g": 35,
      "carbs_g": 40,
      "fat_g": 12
    },
    "est_cost_eur": 6.50,
    "est_savings_eur": 2.10
  }
]`
}
