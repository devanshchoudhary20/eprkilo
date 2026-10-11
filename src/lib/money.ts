// Returns integer minor units (cents) so sums never drift; null when no number can be read.
export function parseMoney(raw: string | undefined): number | null {
  const cleaned = (raw ?? '').replace(/[^\d,.-]/g, '')
  if (!/\d/.test(cleaned)) return null
  const negative = cleaned.startsWith('-')
  const body = cleaned.replace(/-/g, '')
  const lastSeparator = Math.max(body.lastIndexOf(','), body.lastIndexOf('.'))
  const decimalDigits = lastSeparator === -1 ? 0 : body.length - lastSeparator - 1
  const hasDecimals = decimalDigits === 1 || decimalDigits === 2
  const whole = hasDecimals ? body.slice(0, lastSeparator) : body
  const fraction = hasDecimals ? body.slice(lastSeparator + 1) : ''
  const digits = `${whole.replace(/[,.]/g, '') || '0'}.${fraction || '0'}`
  const cents = Math.round(Number(digits) * 100)
  if (!Number.isFinite(cents)) return null
  return negative ? -cents : cents
}

export function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
