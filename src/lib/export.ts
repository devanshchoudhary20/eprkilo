import { FLAGGED_ISOS } from './countries'
import type { ShareResult, Totals } from './compute'
import { kgText, rowTotalMg } from './kg'
import type { KgResult } from './kg'
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
const emptyMg = () => MATERIAL_KEYS.map(() => kgText(0))

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
  const line = (country: string, iso: string, totals: Totals, flagged: boolean, kgCells: string[], total: string) => [
    country,
    iso,
    integer(totals.orders),
    integer(totals.units),
    ...currencies.map((currency) => moneyFixed(totals.sales[currency] ?? 0)),
    flagged ? 'yes' : 'no',
    ...kgCells,
    total,
  ]
  const euRows = kg.countries.map((row) => {
    const totals = share.euCountries.find((entry) => entry.iso === row.iso) ?? { orders: row.parcels, units: row.units, sales: {} }
    return line(row.name, row.iso, totals, FLAGGED_ISOS.has(row.iso), MATERIAL_KEYS.map((key) => kgText(row.mg[key])), kgText(rowTotalMg(row)))
  })
  // Packaging kilograms are only computed for EU destinations, so this row carries zeros.
  const outside = sumTotals([share.outside, share.unrecognised, share.noDestination])
  return { header, rows: [...euRows, line('non-EU', '-', outside, false, emptyMg(), kgText(0))] }
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
