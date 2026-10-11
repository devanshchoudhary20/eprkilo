type Db = { prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } } }
type Env = { DB: Db; LIMITER: RateLimit }

const EVENTS = new Set(['view', 'parsed', 'calculated', 'sample', 'switch'])
const SOURCE = /^[a-z0-9-]{1,40}$/
const ANSWER_LIMIT = 200
const BODY_LIMIT = 1024
const FIELDS = new Set(['event', 'source', 'answer'])
const ORIGIN = /^(https:\/\/([a-z0-9-]+\.)?eprkilo\.pages\.dev|http:\/\/localhost:(4173|5173))$/
// oxlint-disable-next-line no-control-regex
const CONTROL_BYTES = /[\u0000-\u001f\u007f-\u009f]/g

export function validate(body: unknown): { event: string; source: string; answer: string | null } | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const record = body as Record<string, unknown>
  if (Object.keys(record).some((key) => !FIELDS.has(key))) return null
  const { event, source, answer } = record
  if (typeof event !== 'string' || !EVENTS.has(event)) return null
  if (typeof source !== 'string' || !SOURCE.test(source)) return null
  if (answer === undefined) return event === 'switch' ? null : { event, source, answer: null }
  if (event !== 'switch' || typeof answer !== 'string') return null
  // strip before the length check so the cap counts what is stored
  const cleaned = answer.replace(CONTROL_BYTES, '').trim()
  if (cleaned.length === 0 || cleaned.length > ANSWER_LIMIT) return null
  return { event, source, answer: cleaned }
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
    if (Number(request.headers.get('Content-Length') ?? 0) > BODY_LIMIT) return new Response(null, { status: 413, headers })
    // the IP is only the limiter's key: held in memory by the binding, never stored or logged
    const { success } = await env.LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') ?? 'unknown' })
    if (!success) return new Response(null, { status: 429, headers })
    const text = await request.text()
    if (text.length > BODY_LIMIT) return new Response(null, { status: 413, headers })
    let body: unknown = null
    try {
      body = JSON.parse(text)
    } catch {
      // not JSON: validate() rejects null
    }
    const row = validate(body)
    if (!row) return new Response(null, { status: 400, headers })
    await env.DB.prepare('INSERT INTO events (ts, event, source, answer) VALUES (?, ?, ?, ?)')
      .bind(new Date().toISOString(), row.event, row.source, row.answer)
      .run()
    return new Response(null, { status: 204, headers })
  },
}
