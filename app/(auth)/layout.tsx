import Link from 'next/link'
import { ChefHat } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="py-6 px-4 text-center">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-green-700 text-lg">
          <ChefHat className="h-5 w-5" />
          AkcioJedálniček
        </Link>
      </div>
      <div className="flex-1 flex items-center justify-center px-4 pb-12">
        {children}
      </div>
    </div>
  )
}
