'use client'
import { useState, useEffect, useRef } from 'react'
import { Check, Copy, Share2, Tag } from 'lucide-react'
import { ShoppingItem } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { groupBySection, formatShoppingListText, calculateTotals } from '@/lib/utils/shopping-list'
import { formatEur } from '@/lib/utils/formatting'

interface ShoppingListProps {
  items: ShoppingItem[]
  store: string
  planId: string
}

export function ShoppingList({ items, store, planId }: ShoppingListProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [copied, setCopied] = useState(false)
  const [displaySavings, setDisplaySavings] = useState(0)
  const { total, savings } = calculateTotals(items)
  const grouped = groupBySection(items)

  // Counter animácia pre úspory
  useEffect(() => {
    const duration = 800
    const steps = 30
    const increment = savings / steps
    let current = 0
    const timer = setInterval(() => {
      current += increment
      if (current >= savings) {
        setDisplaySavings(savings)
        clearInterval(timer)
      } else {
        setDisplaySavings(current)
      }
    }, duration / steps)
    return () => clearInterval(timer)
  }, [savings])

  function toggleItem(name: string) {
    setChecked(prev => ({ ...prev, [name]: !prev[name] }))
  }

  async function handleCopy() {
    const text = formatShoppingListText(items, store, total, savings)
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleShare() {
    const text = formatShoppingListText(items, store, total, savings)
    if (navigator.share) {
      await navigator.share({ title: `Nákupný zoznam ${store}`, text })
    } else {
      handleCopy()
    }
  }

  return (
    <div className="space-y-4">
      {/* Súhrnný panel */}
      <div className="rounded-xl bg-green-50 border border-green-200 p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-600">Celková cena</span>
          <span className="font-bold text-gray-900">{formatEur(total)}</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-600">Z toho v akcii</span>
          <span className="text-sm text-gray-700">{formatEur(total - savings)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-green-200">
          <span className="font-semibold text-green-800">Ušetríš celkovo 🎉</span>
          <span className="text-xl font-bold text-green-700 animate-count-up">
            {formatEur(displaySavings)}
          </span>
        </div>
      </div>

      {/* Akcie zdieľania */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={handleCopy} className="flex-1 gap-2">
          {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Skopírované!' : 'Kopírovať'}
        </Button>
        <Button variant="outline" size="sm" onClick={handleShare} className="flex-1 gap-2">
          <Share2 className="h-4 w-4" />
          Zdieľať
        </Button>
      </div>

      {/* Skupiny podľa oddelení */}
      {Object.entries(grouped).map(([section, sectionItems]) => (
        <div key={section}>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {section}
          </h3>
          <div className="space-y-1">
            {sectionItems.map((item) => (
              <button
                key={item.name}
                onClick={() => toggleItem(item.name)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all ${
                  checked[item.name] ? 'bg-gray-50 opacity-50' : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {/* Checkbox */}
                <div className={`flex-shrink-0 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                  checked[item.name] ? 'bg-green-600 border-green-600' : 'border-gray-300'
                }`}>
                  {checked[item.name] && <Check className="h-3 w-3 text-white" />}
                </div>

                {/* Názov + množstvo */}
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${checked[item.name] ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {Math.round(item.qty * 10) / 10} {item.unit}
                  </span>
                </div>

                {/* Cena a akcia badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.onSale && (
                    <Badge variant="sale" className="text-xs py-0">
                      <Tag className="h-2.5 w-2.5 mr-1" />
                      AKCIA
                    </Badge>
                  )}
                  {item.price > 0 && (
                    <div className="text-right">
                      {item.onSale && item.basePrice && (
                        <div className="text-xs text-gray-400 line-through">{formatEur(item.basePrice)}</div>
                      )}
                      <div className={`text-sm font-medium ${item.onSale ? 'text-green-700' : 'text-gray-700'}`}>
                        {formatEur(item.price)}
                      </div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
