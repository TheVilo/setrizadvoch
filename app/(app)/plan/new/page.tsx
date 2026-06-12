'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { PaywallModal } from '@/components/paywall/PaywallModal'
import { MealType, Tier } from '@/types'
import { getTierLimits } from '@/lib/tier-gates/gates'
import { ChefHat, Minus, Plus, Loader2 } from 'lucide-react'

const MEAL_OPTIONS: { type: MealType; label: string; emoji: string }[] = [
  { type: 'ranajky', label: 'Raňajky', emoji: '🌅' },
  { type: 'obed', label: 'Obed', emoji: '☀️' },
  { type: 'vecera', label: 'Večera', emoji: '🌙' },
  { type: 'snack', label: 'Snack', emoji: '🍎' },
]

const DIET_OPTIONS = ['vegetarianske', 'bezlepkove', 'low-carb', 'keto', 'bez-laktózy']

const LOADING_STEPS = [
  'Načítavam aktuálne akcie z Lidlu...',
  'Hľadám najlepšie kombinácie receptov...',
  'Skladám jedálniček na mieru...',
  'Počítam úspory...',
]

export default function PlanNewPage() {
  const [days, setDays] = useState(1)
  const [mealTypes, setMealTypes] = useState<MealType[]>(['obed', 'vecera'])
  const [persons, setPersons] = useState(2)
  const [diet, setDiet] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [showPaywall, setShowPaywall] = useState(false)
  const [paywallReason, setPaywallReason] = useState<'days' | 'meal_type' | 'diet'>('days')
  const [tier, setTier] = useState<Tier>('free')

  const router = useRouter()
  const supabase = createClient()
  const limits = getTierLimits(tier)

  // Načítaj tier
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('tier').eq('id', user.id).single()
        .then(({ data }) => { if (data) setTier(data.tier as Tier) })
    })
  })

  function toggleMealType(type: MealType) {
    if (!limits.mealTypes.includes(type)) {
      setPaywallReason('meal_type')
      setShowPaywall(true)
      return
    }
    setMealTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    )
  }

  function handleDaysChange(newDays: number) {
    if (newDays > limits.maxDays) {
      setPaywallReason('days')
      setShowPaywall(true)
      return
    }
    setDays(newDays)
  }

  function toggleDiet(d: string) {
    if (!limits.dietFilters.includes(d)) {
      setPaywallReason('diet')
      setShowPaywall(true)
      return
    }
    setDiet(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d])
  }

  async function handleGenerate() {
    if (mealTypes.length === 0) {
      setError('Vyber aspoň jeden typ jedla.')
      return
    }
    setLoading(true)
    setError('')

    // Animácia loading krokov
    let step = 0
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, LOADING_STEPS.length - 1)
      setLoadingStep(step)
    }, 1200)

    try {
      const res = await fetch('/api/generate-recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store: 'lidl', days, mealTypes, persons, diet }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'tier_limit') {
          setPaywallReason('days')
          setShowPaywall(true)
        } else {
          setError(data.error || 'Nastala chyba, skús znova.')
        }
        return
      }

      router.push(`/plan/${data.planId}`)
    } catch {
      setError('Nastala chyba, skús znova.')
    } finally {
      clearInterval(stepInterval)
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nový jedálniček</h1>
        <p className="text-gray-500 text-sm mt-1">Nastav preferencie a vygenerujeme ti plán</p>
      </div>

      {/* Obchod */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Obchod</p>
          <div className="grid grid-cols-2 gap-2">
            {(['lidl', 'kaufland', 'tesco', 'billa'] as const).map(store => (
              <button
                key={store}
                disabled={store !== 'lidl'}
                className={`py-2.5 px-4 rounded-lg text-sm font-medium border transition-all ${
                  store === 'lidl'
                    ? 'bg-green-50 border-green-500 text-green-700'
                    : 'border-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {store.toUpperCase()}
                {store !== 'lidl' && <span className="text-xs ml-1 opacity-60">(čoskoro)</span>}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Počet dní */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Počet dní</p>
            <span className="text-xs text-gray-400">Free: max {limits.maxDays} dni</span>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map(d => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all relative ${
                  days === d
                    ? 'bg-green-600 text-white border-green-600'
                    : d > limits.maxDays
                    ? 'border-gray-200 text-gray-400'
                    : 'border-gray-200 text-gray-700 hover:border-green-300'
                }`}
              >
                {d}
                {d > limits.maxDays && (
                  <span className="absolute -top-1 -right-1 text-xs">🔒</span>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Typy jedál */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Typy jedál</p>
          <div className="grid grid-cols-2 gap-2">
            {MEAL_OPTIONS.map(({ type, label, emoji }) => {
              const locked = !limits.mealTypes.includes(type)
              const selected = mealTypes.includes(type)
              return (
                <button
                  key={type}
                  onClick={() => toggleMealType(type)}
                  className={`flex items-center gap-2 py-2.5 px-4 rounded-lg text-sm border transition-all ${
                    selected
                      ? 'bg-green-50 border-green-500 text-green-700 font-medium'
                      : locked
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-200 text-gray-700 hover:border-green-300'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{label}</span>
                  {locked && <span className="ml-auto">🔒</span>}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Počet osôb */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Počet osôb</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPersons(p => Math.max(1, p - 1))}
              className="rounded-full border p-2 hover:bg-gray-100 transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="text-2xl font-bold text-gray-900 w-12 text-center">{persons}</span>
            <button
              onClick={() => setPersons(p => Math.min(8, p + 1))}
              className="rounded-full border p-2 hover:bg-gray-100 transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-500">osoby</span>
          </div>
        </CardContent>
      </Card>

      {/* Diéta */}
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Diéta / obmedzenia</p>
          <div className="flex flex-wrap gap-2">
            {DIET_OPTIONS.map(d => {
              const locked = !limits.dietFilters.includes(d)
              const selected = diet.includes(d)
              return (
                <button
                  key={d}
                  onClick={() => toggleDiet(d)}
                  className={`px-3 py-1.5 rounded-full text-xs border font-medium transition-all ${
                    selected
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : locked
                      ? 'border-gray-200 text-gray-400'
                      : 'border-gray-200 text-gray-600 hover:border-green-300'
                  }`}
                >
                  {locked && '🔒 '}{d}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      <Button className="w-full" size="lg" onClick={handleGenerate} disabled={loading}>
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {LOADING_STEPS[loadingStep]}
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <ChefHat className="h-4 w-4" />
            Vygenerovať jedálniček
          </span>
        )}
      </Button>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        reason={paywallReason}
      />
    </div>
  )
}
