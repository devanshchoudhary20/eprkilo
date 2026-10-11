type Db = { prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } } }
type Env = { DB: Db }

const EVENTS = new Set(['view', 'parsed', 'calculated', 'sample', 'switch'])
const SOURCE = /^[a-z0-9-]{1,40}$/
const ANSWER_LIMIT = 200
const FIELDS = new Set(['event', 'source', 'answer'])
const ORIGIN = /^(https:\/\/([a-z0-9-]+\.)?eprkilo\.pages\.dev|http:\/\/localhost:(4173|5173))$/

export function validate(body: unknown): { event: string; source: string; answer: string | null } | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const record = body as Record<string, unknown>
  if (Object.keys(record).some((key) => !FIELDS.has(key))) return null
  const { event, source, answer } = record
  if (typeof event !== 'string' || !EVENTS.has(event)) return null
  if (typeof source !== 'string' || !SOURCE.test(source)) return null
  if (answer === undefined) return event === 'switch' ? null : { event, source, answer: null }
  if (event !== 'switch' || typeof answer !== 'string') return null
  const trimmed = answer.trim()
  if (trimmed.length === 0 || trimmed.length > ANSWER_LIMIT) return null
  return { event, source, answer: trimmed }
}

const cors = (origin: string) => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  Vary: 'Origin',
})

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    if (!ORIGIN.test(origin)) return new Response(null, { status: 403 })
    const headers = cors(origin)
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return new Response(null, { status: 405, headers })
    const body = await request.json().catch(() => null)
    const row = validate(body)
    if (!row) return new Response(null, { status: 400, headers })
    await env.DB.prepare('INSERT INTO events (ts, event, source, answer) VALUES (?, ?, ?, ?)')
      .bind(new Date().toISOString(), row.event, row.source, row.answer)
      .run()
    return new Response(null, { status: 204, headers })
  },
}
