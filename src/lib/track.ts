type TrackEvent = 'view' | 'parsed' | 'calculated' | 'sample' | 'switch'

const COUNTER_URL = 'https://eprkilo-counter.sesh-relay.workers.dev'
const SOURCE_KEY = 'eprkilo-source'
const SOURCE_PATTERN = /^[a-z0-9-]{1,40}$/
const FALLBACK_SOURCE = 'direct'

const REFERRER_SOURCES: Record<string, string> = {
  'news.ycombinator.com': 'hn',
  'old.reddit.com': 'reddit',
  'www.reddit.com': 'reddit',
  'bsky.app': 'bluesky',
  't.co': 'x',
  'dev.to': 'devto',
}

// hostname only: the path and query of a referrer are never read
function sourceFromReferrer(referrer: string): string {
  try {
    return REFERRER_SOURCES[new URL(referrer).hostname.toLowerCase()] ?? FALLBACK_SOURCE
  } catch {
    return FALLBACK_SOURCE
  }
}

export function sourceFrom(search: string, referrer = ''): string {
  const raw = new URLSearchParams(search).get('utm_source')?.trim().toLowerCase() ?? ''
  return SOURCE_PATTERN.test(raw) ? raw : sourceFromReferrer(referrer)
}

// sessionStorage keeps the visit's source across in-app navigation; a blocked store falls back to the URL
export function visitSource(): string {
  try {
    const stored = sessionStorage.getItem(SOURCE_KEY)
    if (stored && SOURCE_PATTERN.test(stored)) return stored
    const fresh = sourceFrom(window.location.search, document.referrer)
    sessionStorage.setItem(SOURCE_KEY, fresh)
    return fresh
  } catch {
    return sourceFrom(window.location.search, document.referrer)
  }
}

const memoryFired = new Set<string>()

// a tab session fires each of these once; a blocked store falls back to once per page load
export function firstInSession(event: TrackEvent): boolean {
  const key = `eprkilo-fired-${event}`
  try {
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
    return true
  } catch {
    if (memoryFired.has(key)) return false
    memoryFired.add(key)
    return true
  }
}

export const trackOnce = (event: TrackEvent) => (firstInSession(event) ? track(event) : Promise.resolve(true))

// Resolves false on any failure; only the switch answer shows that to the user.
export async function track(event: TrackEvent, extra?: { answer?: string }): Promise<boolean> {
  if (import.meta.env.DEV) return true
  try {
    const body = JSON.stringify({ event, source: visitSource(), ...extra })
    const response = await fetch(COUNTER_URL, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } })
    return response.ok
  } catch {
    return false
  }
}
