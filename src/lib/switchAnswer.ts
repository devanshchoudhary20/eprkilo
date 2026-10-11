import { track } from './track'

export const ANSWER_LIMIT = 200

export async function sendSwitchAnswer(raw: string): Promise<boolean> {
  const answer = raw.trim().slice(0, ANSWER_LIMIT)
  if (!answer) return false
  return track('switch', { answer })
}
