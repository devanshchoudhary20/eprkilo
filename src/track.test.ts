import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => vi.unstubAllGlobals())

const fakeStorage = () => {
  const data = new Map<string, string>()
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => void data.set(key, value) }
}

describe('firstInSession', () => {
  it('fires each event once per tab session, however many files follow', async () => {
    vi.stubGlobal('sessionStorage', fakeStorage())
    const { firstInSession } = await import('./lib/track')
    expect([firstInSession('parsed'), firstInSession('parsed'), firstInSession('calculated')]).toEqual([true, false, true])
  })

  it('falls back to once per page load when storage throws', async () => {
    const blocked = () => {
      throw new Error('blocked')
    }
    vi.stubGlobal('sessionStorage', { getItem: blocked, setItem: blocked })
    vi.resetModules()
    const { firstInSession } = await import('./lib/track')
    expect([firstInSession('parsed'), firstInSession('parsed')]).toEqual([true, false])
  })
})
