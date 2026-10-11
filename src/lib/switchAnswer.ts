import { track } from './track'

export const ANSWER_LIMIT = 200

export function sendSwitchAnswer(raw: string): boolean {
  const answer = raw.trim().slice(0, ANSWER_LIMIT)
  if (!answer) return false
  track('switch', { answer })
  return true
}
