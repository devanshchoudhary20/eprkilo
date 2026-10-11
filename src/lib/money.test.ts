import { describe, expect, it } from 'vitest'
import { formatMoney, parseMoney } from './money'

describe('parseMoney', () => {
  it.each([
    ['$5.00', 500],
    ['£12.50', 1250],
    ['€19,90', 1990],
    ['1.234,56', 123456],
    ['$1,234.56', 123456],
    ['12.345,67', 1234567],
    ['1,234', 123400],
    ['-$3.00', -300],
    ['7', 700],
  ])('reads %s as %i cents', (raw, expected) => {
    expect(parseMoney(raw)).toBe(expected)
  })

  it.each([[''], ['   '], ['n/a'], [undefined], ['$']])('returns null for %s', (raw) => {
    expect(parseMoney(raw)).toBeNull()
  })

  it('formats with two decimals and thousands separators', () => {
    expect(formatMoney(3842050)).toBe('38,420.50')
    expect(formatMoney(0)).toBe('0.00')
  })
})
