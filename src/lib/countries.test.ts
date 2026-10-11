import { describe, expect, it } from 'vitest'
import { classifyCountry, EU_COUNTRIES, FLAGGED_ISOS } from './countries'

describe('classifyCountry', () => {
  it('covers 27 EU states', () => {
    expect(EU_COUNTRIES).toHaveLength(27)
  })

  it.each(EU_COUNTRIES.flatMap((c) => [c.name, ...c.variants].map((name) => [name, c.iso, c.name])))(
    'maps %s to %s',
    (name, iso, english) => {
      expect(classifyCountry(name)).toEqual({ kind: 'eu', iso, name: english })
    },
  )

  it('ignores case, accents and spacing', () => {
    expect(classifyCountry('  GERMANY ')).toMatchObject({ iso: 'DE' })
    expect(classifyCountry('osterreich')).toMatchObject({ iso: 'AT' })
  })

  it.each(['Schweiz', 'United Kingdom', 'Norway', 'United States'])('sends %s outside the EU', (name) => {
    expect(classifyCountry(name)).toEqual({ kind: 'outside' })
  })

  it('reports empty and unknown names', () => {
    expect(classifyCountry('')).toEqual({ kind: 'none' })
    expect(classifyCountry(undefined)).toEqual({ kind: 'none' })
    expect(classifyCountry('Lapland')).toEqual({ kind: 'unrecognised', name: 'Lapland' })
  })

  it('flags Germany, France and Spain only', () => {
    expect([...FLAGGED_ISOS].sort()).toEqual(['DE', 'ES', 'FR'])
  })
})
