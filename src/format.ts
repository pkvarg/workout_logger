export const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€',
  CZK: 'Kč',
  USD: '$',
  GBP: '£',
}

const LOCALE: Record<string, string> = {
  EUR: 'sk-SK',
  CZK: 'cs-CZ',
  USD: 'en-US',
  GBP: 'en-GB',
}

export function money(value: number, currency: string, decimals = false): string {
  try {
    return new Intl.NumberFormat(LOCALE[currency] ?? 'en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals ? 2 : 0,
      maximumFractionDigits: decimals ? 2 : 0,
    }).format(value)
  } catch {
    const symbol = CURRENCY_SYMBOL[currency] ?? ''
    return `${symbol}${value.toFixed(decimals ? 2 : 0)}`
  }
}

export function hoursLabel(hours: number): string {
  return hours % 1 ? hours.toFixed(1) : String(hours)
}

const DATE_LOCALE = 'en-GB'

export function entryDate(iso: string, _currency: string): string {
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
  } catch {
    return iso
  }
}

export function longDate(iso: string, _currency: string): string {
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

export function monthKey(iso: string, _currency: string): string {
  try {
    return new Date(iso).toLocaleDateString(DATE_LOCALE, {
      month: 'long',
      year: 'numeric',
    })
  } catch {
    return iso.slice(0, 7)
  }
}

export function isSameMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export function isInPreviousMonth(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  return d.getFullYear() === prev.getFullYear() && d.getMonth() === prev.getMonth()
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export const cost = (s: { hours: number; rate: number }): number => s.hours * s.rate
