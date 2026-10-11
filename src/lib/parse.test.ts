import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parseCsvString } from './parse'
import { computeShare, defaultPeriod } from './compute'
import { datesRewritten } from './shareView'

const fixture = (name: string) => readFileSync(new URL(`../../fixtures/${name}`, import.meta.url), 'utf8')

const HEAD = 'Transaction ID,Listing ID,Quantity,Ship Country,Order ID,Item Total,Currency,Date Shipped,Sale Date,Item Name'

function items(csv: string) {
  const outcome = parseCsvString(csv)
  if (outcome.kind !== 'items') throw new Error(`expected items, got ${outcome.kind}`)
  return outcome.file
}

describe('header handling', () => {
  it('matches by name when the column order is shuffled', () => {
    const csv = 'Currency,Order ID,Listing ID,Item Total,Transaction ID,Date Shipped,Quantity,Ship Country\nUSD,7,1,$4.00,9,03/01/26,2,France'
    const [row] = items(csv).rows
    expect(row).toMatchObject({ orderId: '7', quantity: 2, cents: 400, currency: 'USD', shipCountry: 'France', shipDate: '2026-03-01' })
  })

  it('is case and space insensitive', () => {
    const csv = ' transaction id ,LISTING ID,quantity,ship country,order id,item total,currency,date shipped\n9,1,1,Spain,1,$1.00,usd,03/01/26'
    expect(items(csv).rows[0]).toMatchObject({ currency: 'USD', shipCountry: 'Spain' })
  })

  it('strips a BOM', () => {
    expect(items(`﻿${HEAD}\n9,1,1,Spain,1,$1.00,USD,03/01/26,03/01/26,Card`).rows).toHaveLength(1)
  })

  it('keeps quoted commas inside one field', () => {
    const csv = `${HEAD}\n9,1,1,Spain,1,"$1,000.50",USD,03/01/26,03/01/26,"Card, blank"`
    expect(items(csv).rows[0].cents).toBe(100050)
  })

  it('drops the # prefix on Order ID', () => {
    const csv = `${HEAD}\n9,1,1,Spain,#1001,$1.00,USD,03/01/26,03/01/26,Card`
    expect(items(csv).rows[0].orderId).toBe('1001')
  })
})

describe('file recognition', () => {
  it('recognises the Orders file', () => {
    expect(parseCsvString(fixture('orders.csv')).kind).toBe('orders')
  })

  it('refuses an unrelated CSV and lists what is missing', () => {
    const outcome = parseCsvString(fixture('not-etsy.csv'))
    expect(outcome).toMatchObject({ kind: 'not-etsy', found: ['Date', 'Product', 'Customer', 'Amount', 'Status', 'Region'] })
    if (outcome.kind === 'not-etsy') expect(outcome.missing).toHaveLength(8)
  })

  it('treats 0 bytes and headers-only as empty', () => {
    expect(parseCsvString('').kind).toBe('empty')
    expect(parseCsvString(`${HEAD}\n`).kind).toBe('empty')
  })
})

describe('falsy cases', () => {
  const csv = [
    HEAD,
    ',1,,Spain,1,,USD,03/01/26,03/01/26,Card',
    '2,1,abc,,2,$5.00,,,03/02/26,Card',
    '3,1,1,Spain,3,$5.00,USD,13/45/26,03/02/26,Card',
  ].join('\n')
  const rows = items(csv).rows

  it('assumes quantity 1 for empty or non-numeric', () => {
    expect(rows.map((r) => [r.quantity, r.quantityAssumed])).toEqual([[1, true], [1, true], [1, false]])
  })

  it('counts a missing item total as 0 and flags it', () => {
    expect(rows[0]).toMatchObject({ cents: 0, totalMissing: true })
  })

  it('moves an empty currency to Unknown currency', () => {
    expect(rows[1].currency).toBe('Unknown currency')
  })

  it('separates empty ship date from an unreadable one', () => {
    expect(rows[1]).toMatchObject({ shipDate: null, shipDateBad: false })
    expect(rows[2]).toMatchObject({ shipDate: null, shipDateBad: true })
  })

  it('falls back to the transaction id when Order ID is empty', () => {
    const csv2 = `${HEAD}\n77,1,1,Spain,,$1.00,USD,03/01/26,03/01/26,Card`
    expect(items(csv2).rows[0].orderId).toBe('77')
  })
})

describe('share view on fixtures/items.csv', () => {
  const file = items(fixture('items.csv'))
  const period = defaultPeriod(file)
  const share = computeShare(file, period, false)

  it('defaults to the calendar year most rows fall in', () => {
    expect(period).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })

  it('counts distinct orders and keeps currencies apart', () => {
    expect(share.shop.orders).toBe(22)
    expect(share.eu.orders).toBe(14)
    expect(share.currencies).toEqual(['GBP', 'USD'])
    expect(share.shop.sales).toEqual({ USD: 40090, GBP: 17750 })
    expect(share.eu.sales).toEqual({ USD: 25690, GBP: 9750 })
  })

  it('sums units and orders per EU country', () => {
    const germany = share.euCountries.find((c) => c.iso === 'DE')
    const france = share.euCountries.find((c) => c.iso === 'FR')
    expect(germany).toMatchObject({ orders: 3, units: 5, flagged: true })
    expect(france).toMatchObject({ orders: 3, units: 5, flagged: true })
    expect(share.euCountries.find((c) => c.iso === 'NL')?.flagged).toBe(false)
  })

  it('counts every excluded and guessed row', () => {
    expect(share).toMatchObject({
      notShipped: 2,
      badDate: 1,
      noCountry: 1,
      unrecognisedRows: 3,
      quantityAssumed: 1,
      totalMissing: 1,
    })
    expect(share.unrecognisedByName).toEqual([
      { name: 'Deutchland', count: 2 },
      { name: 'Lapland', count: 1 },
    ])
  })

  it('moves not-shipped rows into the table when asked', () => {
    const counted = computeShare(file, period, true)
    expect(counted.notShipped).toBe(0)
    expect(counted.shop.orders).toBe(24)
    expect(counted.eu.orders).toBe(16)
  })

  it('returns no rows for a period with none', () => {
    const empty = computeShare(file, { from: '2024-01-01', to: '2024-03-31' }, false)
    expect(empty.includedRows).toBe(0)
    expect(empty.fileRange).toEqual({ from: '2026-03-04', to: '2026-03-25' })
  })
})

describe('fixtures/sample-order-items.csv', () => {
  const file = items(fixture('sample-order-items.csv'))
  const share = computeShare(file, defaultPeriod(file), false)

  it('has no unrecognised countries and an EU order share of 15 to 20 percent', () => {
    const euShare = (share.eu.orders / share.shop.orders) * 100
    expect(share.unrecognisedRows).toBe(0)
    expect(euShare).toBeGreaterThanOrEqual(15)
    expect(euShare).toBeLessThanOrEqual(20)
    expect(share.currencies).toEqual(['USD'])
  })

  it('has exactly one imperfect row, an unshipped one', () => {
    expect(share).toMatchObject({ notShipped: 1, badDate: 0, noCountry: 0, quantityAssumed: 0, totalMissing: 0 })
  })
})

describe('defaultPeriod', () => {
  it('uses ship dates before sale dates so unshipped rows do not pick the year', () => {
    const csv = [
      HEAD,
      '1,1,1,Spain,1,$1.00,USD,,03/01/25,Card',
      '2,1,1,Spain,2,$1.00,USD,,03/02/25,Card',
      '3,1,1,Spain,3,$1.00,USD,03/03/26,03/01/25,Card',
    ].join('\n')
    expect(defaultPeriod(items(csv))).toEqual({ from: '2026-01-01', to: '2026-12-31' })
  })
})

describe('real export formats', () => {
  it('flags a file Excel re-saved: every date is bad and nothing is included', () => {
    const file = items(fixture('items-excel-de-resave.csv'))
    const share = computeShare(file, defaultPeriod(file), false)
    expect(share.includedRows).toBe(0)
    expect(datesRewritten(share)).toBe(true)
    expect(datesRewritten(computeShare(items(fixture('items-real-2025.csv')), { from: '2025-01-01', to: '2025-12-31' }, false))).toBe(false)
  })

  it('reads Date Posted as the ship date and counts every row without ticking the box', () => {
    const file = items(fixture('items-date-posted.csv'))
    const share = computeShare(file, defaultPeriod(file), false)
    expect(share.includedRows).toBe(3)
    expect(share.notShipped).toBe(0)
  })

  it('pins a real 2025 Etsy export: detected, every row read, clean countries and dates, known total', () => {
    const file = items(fixture('items-real-2025.csv'))
    const share = computeShare(file, defaultPeriod(file), false)
    expect(file.rowCount).toBe(3)
    expect(file.rows.filter((row) => row.shipDateBad)).toHaveLength(0)
    expect(share.unrecognisedRows).toBe(0)
    expect(share.includedRows).toBe(3)
    expect(file.rows.reduce((sum, row) => sum + row.cents, 0)).toBe(21487)
  })
})
