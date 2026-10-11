import Papa from 'papaparse'
import { parseEtsyDate } from './dates'
import { parseMoney } from './money'

export const NEEDED_HEADERS = [
  'Transaction ID',
  'Listing ID',
  'Quantity',
  'Ship Country',
  'Order ID',
  'Item Total',
  'Currency',
  'Date Shipped',
] as const

export const UNKNOWN_CURRENCY = 'Unknown currency'

export type ItemRow = {
  orderId: string
  quantity: number
  quantityAssumed: boolean
  shipCountry: string
  saleDate: string | null
  shipDate: string | null
  shipDateBad: boolean
  cents: number
  totalMissing: boolean
  currency: string
}

export type ItemsFile = {
  rows: ItemRow[]
  rowCount: number
  hasSales: boolean
}

export type ParseOutcome =
  | { kind: 'items'; file: ItemsFile }
  | { kind: 'orders' }
  | { kind: 'empty' }
  | { kind: 'not-etsy'; found: string[]; missing: string[] }

type Rec = { [header: string]: string | undefined }

const stripBom = (text: string) => (text.charCodeAt(0) === 0xfeff ? text.slice(1) : text)
const headerKey = (header: string) => stripBom(header).trim().toLowerCase()

export function parseCsvText(text: string): { fields: string[]; records: Rec[] } {
  const result = Papa.parse<Rec>(stripBom(text), {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => stripBom(header).trim(),
  })
  return { fields: result.meta.fields ?? [], records: result.data }
}

function toRow(index: number, get: (name: string) => string, hasSales: boolean): ItemRow {
  const quantityText = get('quantity')
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : 0
  const quantityAssumed = quantity < 1
  const cents = hasSales ? parseMoney(get('item total')) : 0
  const shipText = get('date shipped')
  const shipDate = parseEtsyDate(shipText)
  const orderId = get('order id').replace(/^#/, '').trim() || get('transaction id') || `row-${index}`
  return {
    orderId,
    quantity: quantityAssumed ? 1 : quantity,
    quantityAssumed,
    shipCountry: get('ship country'),
    saleDate: parseEtsyDate(get('sale date')),
    shipDate,
    shipDateBad: shipText !== '' && shipDate === null,
    cents: cents ?? 0,
    totalMissing: hasSales && cents === null,
    currency: get('currency').toUpperCase() || UNKNOWN_CURRENCY,
  }
}

export function interpretCsv(fields: string[], records: Rec[]): ParseOutcome {
  const keys = new Map(fields.map((field) => [headerKey(field), field]))
  const has = (name: string) => keys.has(name.toLowerCase())
  const isItems = has('Transaction ID') && has('Listing ID')
  if (!isItems && has('Number of Items')) return { kind: 'orders' }
  if (!isItems) {
    const missing = NEEDED_HEADERS.filter((name) => !has(name))
    return { kind: 'not-etsy', found: fields.filter(Boolean), missing: [...missing] }
  }
  if (records.length === 0) return { kind: 'empty' }
  const hasSales = has('Item Total') && has('Currency')
  const get = (record: Rec) => (name: string) => (record[keys.get(name) ?? ''] ?? '').trim()
  const rows = records.map((record, index) => toRow(index, get(record), hasSales))
  return { kind: 'items', file: { rows, rowCount: rows.length, hasSales } }
}

export function parseCsvString(text: string): ParseOutcome {
  const { fields, records } = parseCsvText(text)
  if (fields.length === 0) return { kind: 'empty' }
  return interpretCsv(fields, records)
}

export type ReadHandle = { cancel: () => void }

export function readCsvFile(
  file: File,
  onProgress: (rows: number, cursor: number) => void,
  onDone: (outcome: ParseOutcome) => void,
  onFail: () => void,
): ReadHandle {
  let fields: string[] = []
  const records: Rec[] = []
  let cancelled = false
  Papa.parse<Rec>(file, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => stripBom(header).trim(),
    chunkSize: 1024 * 1024,
    chunk: (chunk, parser) => {
      if (cancelled) {
        parser.abort()
        return
      }
      fields = chunk.meta.fields ?? fields
      records.push(...chunk.data)
      onProgress(records.length, chunk.meta.cursor)
    },
    complete: () => {
      if (cancelled) return
      onDone(fields.length === 0 ? { kind: 'empty' } : interpretCsv(fields, records))
    },
    error: () => {
      if (!cancelled) onFail()
    },
  })
  return { cancel: () => { cancelled = true } }
}
