'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Profile, Tier } from '@/types'
import { getTierLabel, getTierLimits } from '@/lib/tier-gates/gates'
import { formatEur } from '@/lib/utils/formatting'
import { useRouter } from 'next/navigation'
import { TrendingDown, Zap } from 'lucide-react'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) supabase.from('profiles').select('*').eq('id', user.id).single()
        .then(({ data }) => setProfile(data as Profile))
    })
  }, [])

  async function handleUpgrade(newTier: Tier) {
    if (!profile) return
    setLoading(true)
    await supabase.from('profiles').update({ tier: newTier }).eq('id', profile.id)
    setProfile(prev => prev ? { ...prev, tier: newTier } : prev)
    setLoading(false)
    router.refresh()
  }

  if (!profile) return <div className="text-center py-20 text-gray-400">Načítavam...</div>

  const limits = getTierLimits(profile.tier)

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Profil</h1>

      {/* Info */}
      <Card>
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Email</span>
            <span className="text-sm font-medium text-gray-900">{profile.email}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Plán</span>
            <Badge variant={profile.tier === 'premium' ? 'premium' : profile.tier === 'family' ? 'family' : 'secondary'}>
              {getTierLabel(profile.tier)}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-green-600" />
              Celková úspora
            </span>
            <span className="text-sm font-bold text-green-700">{formatEur(profile.savings_total_eur)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Tier management — FAKE pre prototype */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            Zmeniť plán
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-gray-400 bg-amber-50 rounded-lg px-3 py-2">
            🛠️ Prototyp — prepnutie tiers je simulované, bez reálnej platby
          </p>

          {profile.tier !== 'free' && (
            <Button variant="outline" className="w-full" onClick={() => handleUpgrade('free')} disabled={loading}>
              Prepnúť na Free (test)
            </Button>
          )}
          {profile.tier !== 'premium' && (
            <Button className="w-full gap-2" onClick={() => handleUpgrade('premium')} disabled={loading}>
              <Zap className="h-4 w-4" />
              Aktivovať Premium — 4,99 €/mes (simulované)
            </Button>
          )}
          {profile.tier !== 'family' && (
            <Button variant="outline" className="w-full gap-2" onClick={() => handleUpgrade('family')} disabled={loading}>
              Aktivovať Family — 6,99 €/mes (simulované)
            </Button>
          )}

          <div className="pt-2 border-t space-y-1.5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tvoje limity</p>
            <p className="text-xs text-gray-600">Max dní: <strong>{limits.maxDays}</strong></p>
            <p className="text-xs text-gray-600">Reroll denne: <strong>{limits.rerollsPerDay}</strong></p>
            <p className="text-xs text-gray-600">Uložené recepty: <strong>{limits.maxSavedRecipes === Infinity ? 'neobmedzene' : limits.maxSavedRecipes}</strong></p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
