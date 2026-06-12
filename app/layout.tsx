import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AkcioJedálniček — Plánuj jedlá podľa akcií',
  description: 'Naplánuj jedálniček na základe aktuálnych akcií v Lidli a ušetri každý týždeň.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sk">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
