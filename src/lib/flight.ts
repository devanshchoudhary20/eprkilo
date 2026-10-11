// runs one task at a time; calls made while one is pending are dropped
export function createFlight() {
  let busy = false
  return async <T>(task: () => Promise<T>): Promise<T | undefined> => {
    if (busy) return undefined
    busy = true
    try {
      return await task()
    } finally {
      busy = false
    }
  }
}
