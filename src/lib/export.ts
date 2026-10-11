import type { ShareResult, Totals } from './compute'
import { kgText, rowTotalMg, zeros } from './kg'
import type { KgResult, KgRow } from './kg'
import { formatMoney, moneyFixed } from './money'
import { UNKNOWN_CURRENCY } from './parse'
import { MATERIAL_KEYS } from './setups'
import type { MaterialKey } from './setups'

export type ExportTable = { header: string[]; rows: string[][] }

const KG_COLUMN: Record<MaterialKey, string> = {
  paper: 'paper_cardboard_kg',
  plastic: 'plastic_kg',
  glass: 'glass_kg',
  steel: 'steel_kg',
  aluminium: 'aluminium_kg',
  wood: 'wood_kg',
  composite: 'composite_kg',
  other: 'other_kg',
}

const integer = (count: number) => String(Math.round(count))
const currencyColumn = (currency: string) => `item_sales_${currency === UNKNOWN_CURRENCY ? 'unknown' : currency}`

function sumTotals(parts: Totals[]): Totals {
  const sales: Record<string, number> = {}
  parts.forEach((part) => Object.entries(part.sales).forEach(([currency, cents]) => (sales[currency] = (sales[currency] ?? 0) + cents)))
  return { orders: parts.reduce((acc, part) => acc + part.orders, 0), units: parts.reduce((acc, part) => acc + part.units, 0), sales }
}

export function buildExport(share: ShareResult, kg: KgResult): ExportTable {
  const currencies = share.hasSales ? share.currencies : []
  const header = [
    'country',
    'iso',
    'orders',
    'units',
    ...currencies.map(currencyColumn),
    'etsy_asks_number',
    ...MATERIAL_KEYS.map((key) => KG_COLUMN[key]),
    'total_kg',
  ]
  const line = (country: string, iso: string, totals: Totals, flagged: boolean, kgRow: KgRow | undefined) => {
    const mg = kgRow?.mg ?? zeros()
    return [
      country,
      iso,
      integer(totals.orders),
      integer(totals.units),
      ...currencies.map((currency) => moneyFixed(totals.sales[currency] ?? 0)),
      flagged ? 'yes' : 'no',
      ...MATERIAL_KEYS.map((key) => kgText(mg[key])),
      kgText(kgRow ? rowTotalMg(kgRow) : 0),
    ]
  }
  const kgByIso = new Map(kg.countries.map((row) => [row.iso, row]))
  const euRows = share.euCountries.map((country) => line(country.name, country.iso, country, country.flagged, kgByIso.get(country.iso)))
  const outside = sumTotals([share.outside, share.unrecognised, share.noDestination])
  return { header, rows: [...euRows, line('non-EU', '-', outside, false, kg.outside)] }
}

const csvField = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

export function toCsv(table: ExportTable): string {
  const lines = [table.header, ...table.rows].map((cells) => cells.map(csvField).join(','))
  return `﻿${lines.join('\r\n')}\r\n`
}

export function toTsv(table: ExportTable): string {
  return [table.header, ...table.rows].map((cells) => cells.map((cell) => cell.replace(/[\t\r\n]+/g, ' ')).join('\t')).join('\n')
}

export function exportFileName(from: string, to: string, isSample: boolean): string {
  return `${isSample ? 'sample-' : ''}eprkilo-${from}-to-${to}.csv`
}

export type Shipped = { orders: number; units: number; sales: string }

export function shippedTo(share: ShareResult, iso: string): Shipped {
  const entry = share.euCountries.find((country) => country.iso === iso)
  if (!entry) return { orders: 0, units: 0, sales: 'no item sales' }
  const parts = share.hasSales ? share.currencies.filter((currency) => (entry.sales[currency] ?? 0) !== 0) : []
  const sales = parts.map((currency) => `${currency === UNKNOWN_CURRENCY ? 'unknown currency' : currency} ${formatMoney(entry.sales[currency] ?? 0)}`).join(', ')
  return { orders: entry.orders, units: entry.units, sales: sales || 'no item sales' }
}
