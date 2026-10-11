import { useState } from 'react'
import { leavePrivacy } from '../lib/route'
import { clearStore } from '../lib/setups'

const REQUESTS = [
  { body: '{"event":"view","source":"direct"}', when: 'when the page opens' },
  { body: '{"event":"parsed","source":"direct"}', when: 'when the country table appears for your file' },
  { body: '{"event":"calculated","source":"direct"}', when: 'when the kilogram results appear for your file' },
  { body: '{"event":"sample","source":"direct"}', when: 'when you press Try a sample file' },
  { body: '{"event":"switch","source":"direct","answer":"..."}', when: 'only if you press Send answer on the optional question' },
]

export function Privacy() {
  const [message, setMessage] = useState('')
  const clear = () => setMessage(clearStore() ? 'Saved setups cleared.' : 'Your browser blocks saved setups here, so there is nothing to clear.')

  return (
    <div className="centered wide">
      <h1>What this page sends</h1>
      <p>Your Etsy file is never uploaded. It is read in this tab and dropped when you close it. Nothing is stored on a server about your shop.</p>
      <h2 className="small-title">The complete list of requests this page makes:</h2>
      <ul className="request-list slip">
        {REQUESTS.map((item) => (
          <li key={item.body}>
            <code className="mono">{item.body}</code>
            <span className="muted">{item.when}</span>
          </li>
        ))}
      </ul>
      <p className="muted small">source is direct, or the utm_source in the link you arrived by. They go to eprkilo-counter.sesh-relay.workers.dev, a counter that stores the time, the event, the source, and for the optional question only the answer text. It uses your IP address in memory only to limit how fast requests arrive, and never stores it.</p>
      <p>Nothing else leaves your browser. No row counts, no countries, no money, and no IP address is stored. Your answer to the question is stored as you typed it; please do not type order details into it.</p>
      <p>You can check this: open your browser&apos;s Network panel and use the page.</p>
      <p>Setups and listing choices live in this browser&apos;s local storage on your device.</p>
      <div>
        <button type="button" className="btn btn-secondary" onClick={clear}>Clear saved setups</button>
        {message && <p className="small" role="status">{message}</p>}
      </div>
      <p className="muted">eprkilo is not affiliated with or endorsed by Etsy, Inc. Etsy is a trademark of Etsy, Inc.</p>
      <div><button type="button" className="btn btn-secondary" onClick={leavePrivacy}>Back</button></div>
    </div>
  )
}
