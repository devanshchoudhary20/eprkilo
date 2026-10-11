import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { computeKg, kgText } from './lib/kg'
import { parseCsvString } from './lib/parse'
import { NAME_LIMIT, hasNoWeight, parseStore, validateGrams } from './lib/setups'
import type { Setup, SetupStore } from './lib/setups'

const fixture = (name: string) => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8')
const HEAD = 'Transaction ID,Listing ID,Quantity,Ship Country,Order ID,Item Total,Currency,Date Shipped,Sale Date,Item Name'
const YEAR = { from: '2026-01-01', to: '2026-12-31' }

function items(csv: string) {
  const outcome = parseCsvString(csv)
  if (outcome.kind !== 'items') throw new Error(`expected items, got ${outcome.kind}`)
  return outcome.file
}

const cardInMailer: Setup = {
  id: 'card',
  name: 'Card in mailer',
  components: [
    { material: 'paper', grams: 18, counts: 'unit' },
    { material: 'plastic', grams: 6, counts: 'parcel' },
  ],
}

const storeOf = (setups: Setup[], mapping: Record<string, string> = {}): SetupStore => ({ setups, defaultId: setups[0].id, mapping, removed: {} })

describe('kg per country against the hand computation', () => {
  it('matches fixtures/items.expected.json to three decimals', () => {
    const expected = JSON.parse(fixture('items.expected.json')) as {
      countries: Record<string, { parcels: number; units: number; paper_kg: string; plastic_kg: string; total_kg: string }>
    }
    const result = computeKg(items(fixture('items.csv')), YEAR, false, storeOf([cardInMailer]))
    const actual = Object.fromEntries(
      result.countries.map((row) => [
        row.name,
        {
          parcels: row.parcels,
          units: row.units,
          paper_kg: kgText(row.mg.paper),
          plastic_kg: kgText(row.mg.plastic),
          total_kg: kgText(row.mg.paper + row.mg.plastic),
        },
      ]),
    )
    expect(actual).toEqual(expected.countries)
  })
})

describe('parcel rule', () => {
  const heavyBox: Setup = {
    id: 'box',
    name: 'Box',
    components: [
      { material: 'paper', grams: 100, counts: 'unit' },
      { material: 'paper', grams: 40, counts: 'parcel' },
      { material: 'plastic', grams: 3, counts: 'parcel' },
    ],
  }
  const light: Setup = {
    id: 'light',
    name: 'Light',
    components: [
      { material: 'paper', grams: 10, counts: 'unit' },
      { material: 'plastic', grams: 8, counts: 'parcel' },
    ],
  }
  const csv = `${HEAD}\n1,111,2,Germany,500,$5.00,USD,03/01/26,03/01/26,Big\n2,222,3,Germany,500,$5.00,USD,03/01/26,03/01/26,Small`

  it('multiplies per-unit grams by quantity and counts only the larger per-parcel grams once', () => {
    const store = storeOf([heavyBox, light], { 'id:111': 'box', 'id:222': 'light' })
    const [germany] = computeKg(items(csv), YEAR, false, store).countries
    expect(germany.parcels).toBe(1)
    expect(germany.units).toBe(5)
    expect(kgText(germany.mg.paper)).toBe('0.270')
    expect(kgText(germany.mg.plastic)).toBe('0.003')
  })

  it('leaves the parcel part out when no setup has one', () => {
    const unitOnly: Setup = { id: 'u', name: 'U', components: [{ material: 'paper', grams: 5, counts: 'unit' }] }
    const [germany] = computeKg(items(csv), YEAR, false, storeOf([unitOnly])).countries
    expect(kgText(germany.mg.paper)).toBe('0.025')
  })
})

describe('rows outside the period', () => {
  const heavy: Setup = { id: 'h', name: 'H', components: [{ material: 'paper', grams: 50, counts: 'parcel' }] }
  const small: Setup = { id: 's', name: 'S', components: [{ material: 'paper', grams: 5, counts: 'parcel' }] }
  const head = `${HEAD}\n`
  const csv = `${head}1,111,1,Germany,500,$5.00,USD,03/01/26,03/01/26,Heavy\n2,222,1,Germany,500,$5.00,USD,,03/01/26,Small`

  it('does not let an unshipped heavier box set the parcel weight', () => {
    const [germany] = computeKg(items(csv), YEAR, false, storeOf([small, heavy], { 'id:111': 's', 'id:222': 'h' })).countries
    expect(kgText(germany.mg.paper)).toBe('0.005')
  })

  it('does not let a heavier box dated outside the period set the parcel weight', () => {
    const late = csv.replace('03/01/26,03/01/26,Heavy', '03/01/27,03/01/27,Heavy')
    const [germany] = computeKg(items(late), YEAR, true, storeOf([small, heavy], { 'id:111': 'h', 'id:222': 's' })).countries
    expect(kgText(germany.mg.paper)).toBe('0.005')
  })
})

describe('inputs that could produce NaN', () => {
  it('rejects empty, letters, zero and negative grams', () => {
    expect(validateGrams('')).toHaveProperty('error')
    expect(validateGrams('abc')).toHaveProperty('error')
    expect(validateGrams('0')).toHaveProperty('error')
    expect(validateGrams('-4')).toHaveProperty('error')
    expect(validateGrams('18,5')).toEqual({ grams: 18.5 })
  })

  it('drops corrupt components from storage instead of carrying NaN', () => {
    const text = JSON.stringify({ setups: [{ id: 'a', name: 'A', components: [{ material: 'paper', grams: 'x', counts: 'unit' }, { material: 'paper', grams: 5, counts: 'unit' }] }], defaultId: 'zzz', mapping: {} })
    const store = parseStore(text)
    expect(store.setups[0].components).toHaveLength(1)
    expect(store.defaultId).toBe('a')
  })

  it('lands on the safe empty store for null and the old array shape', () => {
    const empty = { setups: [], defaultId: null, mapping: {}, removed: {} }
    expect(parseStore('null')).toEqual(empty)
    expect(parseStore('[{"id":"a"}]')).toEqual(empty)
  })

  it('shows zero as 0.000 when there is no weight', () => {
    expect(kgText(0)).toBe('0.000')
  })

  it('truncates stored setup names and removed-setup names to the cap', () => {
    const long = 'x'.repeat(10_000)
    const text = JSON.stringify({ setups: [{ id: 'a', name: long, components: [] }], defaultId: 'a', mapping: {}, removed: { b: long } })
    const store = parseStore(text)
    expect(store.setups[0].name).toHaveLength(NAME_LIMIT)
    expect(store.removed.b).toHaveLength(NAME_LIMIT)
  })

  it('names a used setup that weighs 0 g while another has weight', () => {
    const text = JSON.stringify({ setups: [{ id: 'z', name: 'Zero', components: [{ material: 'paper', grams: 0, counts: 'unit' }] }, cardInMailer], defaultId: 'card', mapping: { 'id:9001': 'z' } })
    const store = parseStore(text)
    const file = items(`${HEAD}\n1,9001,1,Germany,A,$5.00,USD,03/01/26,03/01/26,Mug\n2,9002,1,Germany,B,$5.00,USD,03/01/26,03/01/26,Cup`)
    const result = computeKg(file, YEAR, false, store)
    const weightless = store.setups.filter((setup) => hasNoWeight(setup) && result.usedSetups.some((used) => used.id === setup.id))
    expect(result.hasWeights).toBe(true)
    expect(weightless.map((setup) => setup.name)).toEqual(['Zero'])
  })
})
