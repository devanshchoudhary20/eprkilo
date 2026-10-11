import { describe, expect, it } from 'vitest'
import { sourceFrom } from './track'

describe('sourceFrom', () => {
  it('maps the HN referrer when the URL has no utm_source', () => {
    expect(sourceFrom('', 'https://news.ycombinator.com/item?id=1')).toBe('hn')
  })
  it('keeps direct for an unknown or missing referrer', () => {
    expect(sourceFrom('', 'https://example.com/post')).toBe('direct')
    expect(sourceFrom('', '')).toBe('direct')
  })
  it('lets utm_source win over the referrer', () => {
    expect(sourceFrom('?utm_source=newsletter', 'https://news.ycombinator.com/')).toBe('newsletter')
  })
})
