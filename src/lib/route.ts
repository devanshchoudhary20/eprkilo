export type Step = 'share' | 'setups' | 'mapping' | 'results'

const STEPS: Step[] = ['share', 'setups', 'mapping', 'results']
const PRIVACY = '#privacy'

export const toStep = (hash: string): Step | null => STEPS.find((step) => `#${step}` === hash) ?? null

export const goTo = (route: string) => {
  window.location.hash = route
}

// drops the hash without adding a history entry
export const clearRoute = () => {
  cameFromApp = false
  window.history.replaceState(null, '', window.location.pathname + window.location.search)
}

// a hashchange into privacy means the entry before it is this app's
let cameFromApp = false

export function leavePrivacy() {
  if (cameFromApp) {
    cameFromApp = false
    window.history.back()
    return
  }
  goTo('')
}

export function subscribeHash(onChange: () => void) {
  const handle = () => {
    if (window.location.hash === PRIVACY) cameFromApp = true
    onChange()
  }
  window.addEventListener('hashchange', handle)
  return () => window.removeEventListener('hashchange', handle)
}

export const readHash = () => window.location.hash
