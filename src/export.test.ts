import { readFileSync } from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computeShare } from './lib/compute'
import { buildExport, exportFileName, toCsv, toTsv } from './lib/export'
import { computeKg, kgText, rowTotalMg } from './lib/kg'
import { citeoQuote } from './lib/registerNotes'
import { parseCsvString } from './lib/parse'
import { sendSwitchAnswer } from './lib/switchAnswer'
import { track } from './lib/track'
import type { SetupStore } from './lib/setups'

vi.mock('./lib/track', () => ({ track: vi.fn() }))

const outcome = parseCsvString(readFileSync(new URL('../fixtures/items.csv', import.meta.url), 'utf8'))
if (outcome.kind !== 'items') throw new Error('fixture must be an items file')
const file = outcome.file
const period = { from: '2026-01-01', to: '2026-12-31' }
const store: SetupStore = {
  setups: [{ id: 'card', name: 'Card in mailer', components: [{ material: 'paper', grams: 18, counts: 'unit' }, { material: 'plastic', grams: 6, counts: 'parcel' }] }],
  defaultId: 'card',
  mapping: {},
  removed: {},
}
const table = buildExport(computeShare(file, period, false), computeKg(file, period, false, store))

describe('export table', () => {
  it('has the contract columns in order', () => {
    const tail = ['etsy_asks_number', 'paper_cardboard_kg', 'plastic_kg', 'glass_kg', 'steel_kg', 'aluminium_kg', 'wood_kg', 'composite_kg', 'other_kg', 'total_kg']
    expect(table.header.slice(0, 4)).toEqual(['country', 'iso', 'orders', 'units'])
    expect(table.header.slice(-tail.length)).toEqual(tail)
    expect(table.header.filter((name) => name.startsWith('item_sales_')).length).toBeGreaterThan(0)
  })

  it('formats counts as integers, money with two decimals and kg with three, one non-EU row last', () => {
    const sales = table.header.map((name, index) => (name.startsWith('item_sales_') ? index : -1)).filter((index) => index >= 0)
    const kgs = table.header.map((name, index) => (name.endsWith('_kg') ? index : -1)).filter((index) => index >= 0)
    table.rows.forEach((row) => {
      expect(row).toHaveLength(table.header.length)
      expect(row[2]).toMatch(/^\d+$/)
      expect(row[3]).toMatch(/^\d+$/)
      sales.forEach((index) => expect(row[index]).toMatch(/^-?\d+\.\d{2}$/))
      kgs.forEach((index) => expect(row[index]).toMatch(/^\d+\.\d{3}$/))
    })
    expect(table.rows.at(-1)?.[0]).toBe('non-EU')
    expect(table.rows.filter((row) => row[0] === 'non-EU')).toHaveLength(1)
  })

  it('writes CSV with a BOM, quoting commas, and TSV with tabs', () => {
    const csv = toCsv({ header: ['a', 'b'], rows: [['x,y', 'say "hi"']] })
    expect(csv).toBe('﻿a,b\r\n"x,y","say ""hi"""\r\n')
    expect(toTsv({ header: ['a', 'b'], rows: [['1', '2']] })).toBe('a\tb\n1\t2')
  })

  it('names the file with ISO dates and a sample prefix', () => {
    expect(exportFileName('2026-01-01', '2026-12-31', false)).toBe('eprkilo-2026-01-01-to-2026-12-31.csv')
    expect(exportFileName('2026-01-01', '2026-12-31', true)).toBe('sample-eprkilo-2026-01-01-to-2026-12-31.csv')
  })
})

describe('switch answer', () => {
  beforeEach(() => vi.mocked(track).mockClear())

  it('passes only the answer to track, trimmed and capped at 200 characters', () => {
    expect(sendSwitchAnswer(`  Lizenzero${'x'.repeat(300)}  `)).toBe(true)
    expect(track).toHaveBeenCalledTimes(1)
    const [event, extra] = vi.mocked(track).mock.calls[0]
    expect(event).toBe('switch')
    expect(Object.keys(extra ?? {})).toEqual(['answer'])
    expect(extra?.answer).toHaveLength(200)
  })

  it('sends nothing for an empty answer', () => {
    expect(sendSwitchAnswer('   ')).toBe(false)
    expect(track).not.toHaveBeenCalled()
  })
})

describe('non-EU kilograms and the Citeo line', () => {
  const head = 'Transaction ID,Listing ID,Quantity,Ship Country,Order ID,Item Total,Currency,Date Shipped,Sale Date,Item Name'
  const mixed = parseCsvString(`${head}\n1,L1,2,Germany,A1,$10.00,USD,3/1/26,3/1/26,Card\n2,L1,3,United States,A2,$10.00,USD,3/1/26,3/1/26,Card\n`)
  if (mixed.kind !== 'items') throw new Error('expected items')

  it('puts a non-EU order in outside and not in the EU total', () => {
    const kg = computeKg(mixed.file, period, false, store)
    expect(kg.outside.parcels).toBe(1)
    expect(kgText(rowTotalMg(kg.outside))).toBe('0.060')
    expect(kgText(rowTotalMg(kg.total))).toBe('0.042')
    expect(buildExport(computeShare(mixed.file, period, false), kg).rows.at(-1)?.at(-1)).toBe('0.060')
  })

  it('switches from the forfait sentence to the UVC heading at 10,000 units', () => {
    expect(citeoQuote(9_999).text).toContain('vous payez le forfait de 110 €')
    expect(citeoQuote(10_000).text).toContain('ENTRE 10 000 et 500 000 UVC')
  })
})
