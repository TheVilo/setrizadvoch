import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getTierLabel, getTierLimits } from '@/lib/tier-gates/gates'
import { formatEur } from '@/lib/utils/formatting'
import { CalendarDays, TrendingDown, ChefHat, ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: recentPlans } = await supabase
    .from('meal_plans').select('*').eq('user_id', user.id)
    .order('created_at', { ascending: false }).limit(3)

  const tier = profile?.tier || 'free'
  const limits = getTierLimits(tier)
  const savings = profile?.savings_total_eur || 0

  return (
    <div className="space-y-6">
      {/* Pozdrav */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ahoj 👋</h1>
          <p className="text-gray-500 text-sm mt-0.5">{user.email}</p>
        </div>
        <Badge variant={tier === 'premium' ? 'premium' : tier === 'family' ? 'family' : 'secondary'}>
          {getTierLabel(tier)}
        </Badge>
      </div>

      {/* CTA karta */}
      <Card className="bg-gradient-to-br from-green-600 to-emerald-700 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <ChefHat className="h-6 w-6" />
            <span className="font-semibold text-lg">Nový jedálniček</span>
          </div>
          <p className="text-green-100 text-sm mb-4">
            Vyber obchod a vygeneruj plán podľa aktuálnych akcií
          </p>
          <Button asChild variant="secondary" className="gap-2 bg-white text-green-700 hover:bg-green-50">
            <Link href="/plan/new">
              Začať plánovať <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Štatistiky */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <TrendingDown className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Celková úspora</p>
              <p className="text-lg font-bold text-green-700">{formatEur(savings)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-full bg-blue-100 p-2">
              <CalendarDays className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Plánov vytvorených</p>
              <p className="text-lg font-bold text-gray-900">{recentPlans?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Free tier banner */}
      {tier === 'free' && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800">Odomkni Premium</p>
            <p className="text-xs text-amber-600">Plánuj až 5 dní, viac výmen receptov, bez reklám</p>
          </div>
          <Button asChild size="sm" variant="orange">
            <Link href="/profile">Upgrade</Link>
          </Button>
        </div>
      )}

      {/* Posledné plány */}
      {recentPlans && recentPlans.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Posledné plány</h2>
          <div className="space-y-2">
            {recentPlans.map(plan => (
              <Link key={plan.id} href={`/plan/${plan.id}`}>
                <Card className="hover:border-green-300 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {plan.days} {plan.days === 1 ? 'deň' : 'dni'} · {plan.store.toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(plan.created_at).toLocaleDateString('sk-SK')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-700">-{formatEur(plan.total_savings_eur || 0)}</p>
                      <p className="text-xs text-gray-500">{formatEur(plan.total_cost_eur || 0)} celkom</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
