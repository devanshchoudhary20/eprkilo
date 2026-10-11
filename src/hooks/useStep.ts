import { useState } from 'react'
import { toStep } from '../lib/route'
import type { Step } from '../lib/route'
import { useHash } from './useHash'

// privacy and the start prompt are not steps: the last real one stays underneath
export function useStep(): Step {
  const next = toStep(useHash())
  const [step, setStep] = useState<Step>(next ?? 'share')
  if (next && next !== step) setStep(next)
  return next ?? step
}
