# AkcioJedálniček — Prototyp

Webová appka, ktorá plánuje jedálniček podľa aktuálnych akcií v Lidli.

## Rýchly štart

### 1. Nainštaluj závislosti
```bash
npm install
```

### 2. Nastav premenné prostredia
```bash
cp .env.local.example .env.local
# Vyplň hodnoty v .env.local
```

**Kde nájdeš hodnoty:**
- Supabase URL + keys → supabase.com → tvoj projekt → Settings → API
- Anthropic API key → console.anthropic.com → API Keys

### 3. Nastav databázu
1. Choď na supabase.com → SQL Editor
2. Vlož a spusti obsah `supabase/migrations/001_initial.sql`
3. Vlož a spusti obsah `supabase/seed.sql` (testovací Lidl akcie)

### 4. Spusti appku
```bash
npm run dev
```

Otvor http://localhost:3000

---

## Stack
- **Next.js 14** (App Router + TypeScript)
- **Supabase** (databáza + auth)
- **Anthropic Claude API** (generovanie receptov)
- **Tailwind CSS** + vlastné komponenty

## Štruktúra
```
app/          → Next.js stránky a API routes
components/   → UI komponenty
lib/          → Supabase, Anthropic, biznis logika
types/        → TypeScript typy
supabase/     → SQL migrácie a seed dáta
```

## Tiery (prototype)
- **Free**: 2 dni, obed+večera, 1 reroll/deň, 10 uložených receptov
- **Premium**: 5 dní, všetko, 5 rerollov/deň, neobmedzene
- **Family**: 5 dní, všetko, 15 rerollov/deň, 5 členov

Prepnutie tiers je simulované (bez platby) — na Profile stránke.
