'use client'
import { useState } from 'react'
import { X, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface PaywallModalProps {
  isOpen: boolean
  onClose: () => void
  reason?: 'reroll' | 'days' | 'meal_type' | 'saved' | 'diet'
}

const REASONS: Record<string, { title: string; desc: string }> = {
  reroll: { title: 'Viac výmen receptov', desc: 'Free plán má 1 výmenu denne. Premium má 5 denne.' },
  days: { title: 'Viac dní plánovania', desc: 'Free plán má max 2 dni. Premium plánuje až 5 dní naraz.' },
  meal_type: { title: 'Raňajky a snack', desc: 'Free plán má obed + večeru. Premium má všetky jedlá.' },
  saved: { title: 'Neobmedzené ukladanie', desc: 'Free má max 10 receptov. Premium ukladá bez limitu.' },
  diet: { title: 'Viac diétnych filtrov', desc: 'Premium má bezlepkové, keto, low-carb a ďalšie.' },
}

const PREMIUM_FEATURES = [
  'Plán až na 5 dní',
  'Raňajky, obed, večera, snack',
  '5 výmen receptov denne',
  'Všetky diétne filtre',
  'Neobmedzené ukladanie',
  'PDF export zoznamu',
  'Porovnanie obchodov',
  'Bez reklám',
]

export function PaywallModal({ isOpen, onClose, reason = 'reroll' }: PaywallModalProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  if (!isOpen) return null

  // FAKE upgrade — v prototype len zmení tier v DB
  async function handleUpgrade() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('profiles').update({ tier: 'premium' }).eq('id', user.id)
      onClose()
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const reasonInfo = REASONS[reason] || REASONS.reroll

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <button onClick={onClose} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <div className="rounded-full bg-amber-100 p-2">
            <Zap className="h-5 w-5 text-amber-600" />
          </div>
          <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Premium</span>
        </div>

        <h2 className="text-xl font-bold mb-1">{reasonInfo.title}</h2>
        <p className="text-gray-500 text-sm mb-5">{reasonInfo.desc}</p>

        <ul className="space-y-2 mb-6">
          {PREMIUM_FEATURES.map(f => (
            <li key={f} className="flex items-center gap-2 text-sm text-gray-700">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>

        <div className="space-y-2">
          <Button className="w-full" size="lg" onClick={handleUpgrade} disabled={loading}>
            {loading ? 'Aktivujem...' : 'Prejsť na Premium — 4,99 €/mes'}
          </Button>
          <Button variant="ghost" className="w-full text-sm text-gray-500" onClick={onClose}>
            Zostať na Free
          </Button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-3">
          Toto je prototyp — platba je simulovaná
        </p>
      </div>
    </div>
  )
}
