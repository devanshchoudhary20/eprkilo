export type Step = 'share' | 'setups' | 'mapping' | 'results'

const STEPS: Step[] = ['share', 'setups', 'mapping', 'results']
const PRIVACY = '#privacy'

export const toStep = (hash: string): Step | null => STEPS.find((step) => `#${step}` === hash) ?? null

export const goTo = (route: string) => {
  window.location.hash = route
}

// drops the hash without adding a history entry
export const clearRoute = () => window.history.replaceState(null, '', window.location.pathname + window.location.search)

let beforePrivacy = window.location.hash === PRIVACY ? '' : window.location.hash

export const leavePrivacy = () => goTo(beforePrivacy)

export function subscribeHash(onChange: () => void) {
  const handle = () => {
    if (window.location.hash !== PRIVACY) beforePrivacy = window.location.hash
    onChange()
  }
  window.addEventListener('hashchange', handle)
  return () => window.removeEventListener('hashchange', handle)
}

export const readHash = () => window.location.hash
