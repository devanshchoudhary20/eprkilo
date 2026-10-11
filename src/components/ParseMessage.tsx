import { NEEDED_HEADERS } from '../lib/parse'
import type { Refusal } from '../hooks/useLoader'
import { FilePicker } from './FilePicker'
import { FileXIcon } from './icons'

const ORDERS_MESSAGE =
  'This is the Orders file. eprkilo needs the Order Items file: Shop Manager > Settings > Options > Download Data > Orders > CSV type: Order Items.'
const EMPTY_MESSAGE = 'That file has no rows. Download it again from Shop Manager and drop the new copy.'
const MAX_FOUND = 12

type Reading = { fileName: string; rows: number; fraction: number; onCancel: () => void }

export function Reading({ fileName, rows, fraction, onCancel }: Reading) {
  return (
    <div className="centered">
      <div className="slip reading">
        <span className="muted">Reading</span>
        <span className="mono">{fileName}</span>
        <progress value={fraction} max={1} aria-label="Reading progress" />
        <p className="rows-read">{rows.toLocaleString('en-US')} {rows === 1 ? 'row' : 'rows'} read</p>
        <p className="muted">This stays in your browser.</p>
        <div><button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button></div>
      </div>
    </div>
  )
}

function MessageAlert({ title }: { title: string }) {
  return (
    <div className="alert" role="alert">
      <FileXIcon />
      <p className="alert-title">{title}</p>
    </div>
  )
}

function NotEtsy({ found, missing }: { found: string[]; missing: string[] }) {
  const shown = found.slice(0, MAX_FOUND)
  const extra = found.length - shown.length
  const extraLabel = extra > 0 ? `and ${extra} more` : null
  const noneLabel = found.length === 0 ? 'no headers found' : null
  const needed = NEEDED_HEADERS.map((name) => ({ name, status: missing.includes(name) ? 'missing' : 'found' }))
  return (
    <>
      <MessageAlert title="This does not look like an Order Items file." />
      <div className="found-grid">
        <div className="slip found-card">
          <h2>Headers we found</h2>
          <ul>
            {shown.map((name) => (
              <li key={name}>{name}</li>
            ))}
            {extraLabel && <li className="muted">{extraLabel}</li>}
            {noneLabel && <li className="muted">{noneLabel}</li>}
          </ul>
        </div>
        <div className="slip found-card">
          <h2>Headers we need</h2>
          <ul>
            {needed.map(({ name, status }) => (
              <li key={name}>
                <span>{name}</span>
                <span className={`status-${status}`}>{status}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p>Download the file again: Shop Manager &gt; Settings &gt; Options &gt; Download Data &gt; Orders &gt; CSV type: Order Items.</p>
    </>
  )
}

export function Refused({ refusal, onFile }: { refusal: Refusal; onFile: (file: File) => void }) {
  const isNotEtsy = refusal.kind === 'not-etsy'
  const title = refusal.kind === 'orders' ? ORDERS_MESSAGE : EMPTY_MESSAGE
  return (
    <div className={isNotEtsy ? 'centered wide' : 'centered'}>
      {refusal.kind === 'not-etsy' ? <NotEtsy found={refusal.found} missing={refusal.missing} /> : <MessageAlert title={title} />}
      <div><FilePicker label="Choose another file" variant="primary" onFile={onFile} /></div>
    </div>
  )
}
