import Link from 'next/link'
import { ChefHat, ShoppingCart, Euro, Clock, Check, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b px-4 py-3 flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-green-700 text-lg">
          <ChefHat className="h-5 w-5" />
          AkcioJedálniček
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">Prihlásiť sa</Link>
          <Button asChild size="sm">
            <Link href="/signup">Začať zadarmo</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-3xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          🇸🇰 Špeciálne pre slovenský trh
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight mb-5">
          Plánuj jedlá podľa<br />
          <span className="text-green-600">akcií v Lidli</span>
        </h1>
        <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto">
          Vyber obchod, povedz koľko ľudí varíš a na koľko dní — a my ti vygenerujeme jedálniček a nákupný zoznam šitý na mieru aktuálnych zliav.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/signup" className="gap-2">
              Začať zadarmo <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Mám účet</Link>
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Bez kreditnej karty · Free plán navždy</p>
      </section>

      {/* 3 kroky */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: <ShoppingCart className="h-6 w-6 text-green-600" />, step: '1', title: 'Vyber obchod', desc: 'Lidl, Kaufland, Tesco alebo Billa. Appka načíta aktuálne akcie.' },
            { icon: <ChefHat className="h-6 w-6 text-green-600" />, step: '2', title: 'Dostaneš jedálniček', desc: 'AI poskladá recepty na základe toho, čo je práve v akcii.' },
            { icon: <Euro className="h-6 w-6 text-green-600" />, step: '3', title: 'Nakúp lacnejšie', desc: 'Nákupný zoznam s cenou, úsporou a možnosťou zdieľať.' },
          ].map(({ icon, step, title, desc }) => (
            <div key={step} className="rounded-xl border bg-white p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="rounded-full bg-green-50 p-2">{icon}</div>
                <span className="text-2xl font-black text-green-600">{step}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Ceny */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center mb-8">Vyber plán</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              name: 'Free', price: '0 €', period: 'navždy',
              color: 'border-gray-200',
              features: ['1–2 dni plánovania', 'Obed + večera', '1 výmena receptu/deň', '10 uložených receptov'],
            },
            {
              name: 'Premium', price: '4,99 €', period: '/mesiac',
              color: 'border-green-500 ring-2 ring-green-500',
              badge: '⭐ Odporúčame',
              features: ['Až 5 dní plánovania', 'Všetky jedlá', '5 výmen/deň', 'Neobmedzené ukladanie', 'PDF export', 'Bez reklám'],
            },
            {
              name: 'Family', price: '6,99 €', period: '/mesiac',
              color: 'border-purple-200',
              features: ['Všetko z Premium', 'Až 5 členov rodiny', '15 výmen/deň spoločne', 'Zdieľaný nákupný zoznam'],
            },
          ].map((plan) => (
            <div key={plan.name} className={`rounded-xl border-2 ${plan.color} p-6 relative`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {plan.badge}
                </div>
              )}
              <div className="mb-4">
                <h3 className="font-bold text-gray-900">{plan.name}</h3>
                <div className="text-2xl font-black text-gray-900 mt-1">
                  {plan.price}<span className="text-sm font-normal text-gray-500">{plan.period}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-green-600 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full" variant={plan.name === 'Premium' ? 'default' : 'outline'}>
                <Link href="/signup">Začať</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-400">
        © 2025 AkcioJedálniček · Prototyp · Vyrobené na Slovensku 🇸🇰
      </footer>
    </div>
  )
}
