// Dates are kept as YYYY-MM-DD strings: they sort and compare as text.
export function parseEtsyDate(raw: string | undefined): string | null {
  const match = /^\s*(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})\s*$/.exec(raw ?? '')
  if (!match) return null
  const month = Number(match[1])
  const day = Number(match[2])
  const year = match[3].length === 2 ? 2000 + Number(match[3]) : Number(match[3])
  const probe = new Date(Date.UTC(year, month - 1, day))
  const valid = probe.getUTCFullYear() === year && probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day
  if (!valid) return null
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  const label = MONTHS[month - 1]
  if (!year || !label || !day) return 'an unknown date'
  return `${day} ${label} ${year}`
}
