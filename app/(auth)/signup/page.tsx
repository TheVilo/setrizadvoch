'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Vytvor profil
      await supabase.from('profiles').insert({
        id: data.user.id,
        email,
        tier: 'free',
        preferences: { diet: [], allergies: [], default_persons: 2, favorite_store: 'lidl' },
        savings_total_eur: 0,
      })
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="w-full max-w-sm">
      <div className="bg-white rounded-2xl border shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Vytvoriť účet</h1>
        <p className="text-sm text-gray-500 mb-6">Free plán · Bez kreditnej karty</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              required placeholder="tvoj@email.sk"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Heslo</label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              required minLength={6} placeholder="Min. 6 znakov"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Registrujem...' : 'Vytvoriť účet'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Máš účet?{' '}
          <Link href="/login" className="text-green-700 font-medium hover:underline">Prihlásiť sa</Link>
        </p>
      </div>
    </div>
  )
}
