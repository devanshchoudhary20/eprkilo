import { classifyCountry, FLAGGED_ISOS } from './countries'
import type { ItemRow, ItemsFile } from './parse'
import { UNKNOWN_CURRENCY } from './parse'

export type Period = { from: string; to: string }

export type Totals = {
  orders: number
  units: number
  sales: Record<string, number>
}

export type CountryRow = Totals & { iso: string; name: string; flagged: boolean }

export type ShareResult = {
  period: Period
  currencies: string[]
  hasSales: boolean
  shop: Totals
  eu: Totals
  euCountries: CountryRow[]
  outside: Totals
  unrecognised: Totals
  noDestination: Totals
  notShipped: number
  badDate: number
  noCountry: number
  unrecognisedRows: number
  unrecognisedByName: Array<{ name: string; count: number }>
  quantityAssumed: number
  totalMissing: number
  includedRows: number
  fileRange: Period | null
  hasAnyShipped: boolean
}

type Bucket = { orders: Set<string>; units: number; sales: Record<string, number> }

const newBucket = (): Bucket => ({ orders: new Set(), units: 0, sales: {} })

function add(bucket: Bucket, row: ItemRow) {
  bucket.orders.add(row.orderId)
  bucket.units += row.quantity
  bucket.sales[row.currency] = (bucket.sales[row.currency] ?? 0) + row.cents
}

const seal = (bucket: Bucket): Totals => ({ orders: bucket.orders.size, units: bucket.units, sales: bucket.sales })

export function effectiveDate(row: ItemRow, countUnshipped: boolean): string | null {
  if (row.shipDate) return row.shipDate
  if (row.shipDateBad) return null
  return countUnshipped ? row.saleDate : null
}

export function defaultPeriod(file: ItemsFile): Period {
  const tally = new Map<string, number>()
  file.rows.forEach((row) => {
    const date = row.shipDate ?? row.saleDate
    if (!date) return
    const year = date.slice(0, 4)
    tally.set(year, (tally.get(year) ?? 0) + 1)
  })
  const [topYear] = [...tally.entries()].sort((a, b) => b[1] - a[1] || b[0].localeCompare(a[0]))[0] ?? [
    String(new Date().getFullYear()),
  ]
  return { from: `${topYear}-01-01`, to: `${topYear}-12-31` }
}

export function computeShare(file: ItemsFile, period: Period, countUnshipped: boolean): ShareResult {
  const shop = newBucket()
  const eu = newBucket()
  const outside = newBucket()
  const unrecognised = newBucket()
  const noDestination = newBucket()
  const byCountry = new Map<string, { iso: string; name: string; bucket: Bucket }>()
  const unrecognisedNames = new Map<string, { name: string; count: number }>()
  const currencies = new Set<string>()
  let notShipped = 0
  let badDate = 0
  let noCountry = 0
  let quantityAssumed = 0
  let totalMissing = 0
  let includedRows = 0
  let minDate = ''
  let maxDate = ''
  let hasAnyShipped = false

  file.rows.forEach((row) => {
    if (row.shipDate) hasAnyShipped = true
    const date = effectiveDate(row, countUnshipped)
    if (date === null) {
      if (row.shipDateBad || (countUnshipped && !row.shipDate)) badDate += 1
      else notShipped += 1
      return
    }
    if (!minDate || date < minDate) minDate = date
    if (!maxDate || date > maxDate) maxDate = date
    if (date < period.from || date > period.to) return
    includedRows += 1
    if (row.quantityAssumed) quantityAssumed += 1
    if (row.totalMissing) totalMissing += 1
    currencies.add(row.currency)
    add(shop, row)
    const place = classifyCountry(row.shipCountry)
    if (place.kind === 'eu') {
      add(eu, row)
      const entry = byCountry.get(place.iso) ?? { iso: place.iso, name: place.name, bucket: newBucket() }
      add(entry.bucket, row)
      byCountry.set(place.iso, entry)
    } else if (place.kind === 'outside') add(outside, row)
    else if (place.kind === 'none') {
      add(noDestination, row)
      noCountry += 1
    }
    else {
      add(unrecognised, row)
      const key = place.name.toLowerCase()
      const seen = unrecognisedNames.get(key) ?? { name: place.name, count: 0 }
      seen.count += 1
      unrecognisedNames.set(key, seen)
    }
  })

  const unrecognisedByName = [...unrecognisedNames.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  const euCountries = [...byCountry.values()]
    .map(({ iso, name, bucket }) => ({ iso, name, flagged: FLAGGED_ISOS.has(iso), ...seal(bucket) }))
    .sort((a, b) => b.orders - a.orders || a.name.localeCompare(b.name))
  const sortedCurrencies = [...currencies].sort((a, b) =>
    a === UNKNOWN_CURRENCY ? 1 : b === UNKNOWN_CURRENCY ? -1 : a.localeCompare(b),
  )

  return {
    period,
    currencies: sortedCurrencies,
    hasSales: file.hasSales,
    shop: seal(shop),
    eu: seal(eu),
    euCountries,
    outside: seal(outside),
    unrecognised: seal(unrecognised),
    noDestination: seal(noDestination),
    notShipped,
    badDate,
    noCountry,
    unrecognisedRows: unrecognisedByName.reduce((sum, entry) => sum + entry.count, 0),
    unrecognisedByName,
    quantityAssumed,
    totalMissing,
    includedRows,
    fileRange: minDate ? { from: minDate, to: maxDate } : null,
    hasAnyShipped,
  }
}

const percent = (part: number, whole: number) => `${((part / whole) * 100).toFixed(1)}%`

export function ordersShare(part: number, whole: number): string {
  return whole > 0 ? percent(part, whole) : 'no orders'
}

export function salesShare(part: number, whole: number): string {
  return whole > 0 && part > 0 ? percent(part, whole) : 'no sales'
}
