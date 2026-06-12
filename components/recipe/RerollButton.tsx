'use client'
import { useState } from 'react'
import { Shuffle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import { Tier } from '@/types'
import { getTierLimits } from '@/lib/tier-gates/gates'

interface RerollButtonProps {
  planSlotId: string
  tier: Tier
  rerollsUsedToday: number
  onReroll: (planSlotId: string) => Promise<void>
}

export function RerollButton({ planSlotId, tier, rerollsUsedToday, onReroll }: RerollButtonProps) {
  const [loading, setLoading] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)

  const limits = getTierLimits(tier)
  const remaining = Math.max(0, limits.rerollsPerDay - rerollsUsedToday)
  const isLocked = tier === 'free' && limits.rerollsPerDay === 0
  const isExhausted = remaining === 0

  async function handleClick() {
    if (isLocked || isExhausted) {
      setShowPaywall(true)
      return
    }
    setLoading(true)
    try {
      await onReroll(planSlotId)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={loading}
          className={`gap-2 text-sm ${isLocked || isExhausted ? 'text-gray-400' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
        >
          {isLocked || isExhausted
            ? <Lock className="h-3.5 w-3.5" />
            : <Shuffle className="h-3.5 w-3.5" />
          }
          {loading ? 'Hľadám...' : 'Iný recept'}
        </Button>

        <span className="text-xs text-gray-400">
          {isLocked
            ? <button onClick={() => setShowPaywall(true)} className="text-amber-600 hover:underline">Premium: 5 výmen denne</button>
            : `${remaining} z ${limits.rerollsPerDay} výmen zostatok`
          }
        </span>
      </div>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason="reroll"
      />
    </>
  )
}
