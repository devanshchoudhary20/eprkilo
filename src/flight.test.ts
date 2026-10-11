import { describe, expect, it } from 'vitest'
import { createFlight } from './lib/flight'

describe('single flight', () => {
  it('runs a task once when two calls land in the same tick', async () => {
    const flight = createFlight()
    let runs = 0
    const task = async () => {
      runs += 1
      await Promise.resolve()
    }
    await Promise.all([flight(task), flight(task)])
    expect(runs).toBe(1)
  })

  it('accepts a new call after the first settles, even when it throws', async () => {
    const flight = createFlight()
    await flight(async () => {
      throw new Error('boom')
    }).catch(() => undefined)
    expect(await flight(async () => 'ok')).toBe('ok')
  })
})
