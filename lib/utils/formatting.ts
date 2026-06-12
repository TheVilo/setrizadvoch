import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatEur(amount: number): string {
  return amount.toFixed(2).replace('.', ',') + ' €'
}

export function formatDiscount(base: number, sale: number): string {
  return Math.round(((base - sale) / base) * 100) + '%'
}
