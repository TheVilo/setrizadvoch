'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ShoppingCart, BookOpen, User, LogOut, ChefHat } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Profile } from '@/types'
import { Badge } from '@/components/ui/badge'
import { getTierLabel, getTierColor } from '@/lib/tier-gates/gates'

export function Header({ profile }: { profile?: Profile }) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-5xl flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-green-700">
          <ChefHat className="h-5 w-5" />
          <span>AkcioJedálniček</span>
        </Link>

        {profile && (
          <nav className="flex items-center gap-1">
            <Badge
              variant={profile.tier === 'premium' ? 'premium' : profile.tier === 'family' ? 'family' : 'secondary'}
              className="mr-2"
            >
              {getTierLabel(profile.tier)}
            </Badge>
            <Link href="/recipes" className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Recepty</span>
            </Link>
            <Link href="/profile" className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Profil</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-md px-3 py-1.5 text-sm text-gray-500 hover:bg-gray-100"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        )}
      </div>
    </header>
  )
}
