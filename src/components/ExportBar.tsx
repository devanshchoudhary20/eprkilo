import { useRef, useState } from 'react'
import { createFlight } from '../lib/flight'
import { exportFileName, toCsv, toTsv } from '../lib/export'
import type { ExportTable } from '../lib/export'
import { ANSWER_LIMIT, sendSwitchAnswer } from '../lib/switchAnswer'

type Status = { kind: 'idle' } | { kind: 'saved'; name: string } | { kind: 'copied'; rows: number } | { kind: 'blocked'; text: string }
type Props = {
  table: ExportTable
  from: string
  to: string
  isSample: boolean
  questionClosed: boolean
  onQuestionClosed: () => void
}

function saveFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.append(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function ExportBar({ table, from, to, isSample, questionClosed, onQuestionClosed }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'idle' })
  const [answer, setAnswer] = useState('')
  const [sent, setSent] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendFailed, setSendFailed] = useState(false)
  const fallback = useRef<HTMLTextAreaElement>(null)
  const flight = useRef(createFlight())
  const fileName = exportFileName(from, to, isSample)
  const fallbackRows = Math.min(table.rows.length + 1, 8)
  const exported = status.kind === 'saved' || status.kind === 'copied'
  const showQuestion = exported && !isSample && !questionClosed
  const sendLabel = sending ? 'Sending...' : 'Send answer'
  const prepLabel = preparing ? 'Preparing...' : null
  const canSend = answer.trim().length > 0
  const nothing = table.rows.length < 2
  const disabled = preparing || nothing

  // the buttons re-enable even if the work throws
  const prepared = async <T,>(work: () => T): Promise<T> => {
    setPreparing(true)
    // a timer, not a frame: hidden tabs never run animation frames
    await new Promise((resolve) => setTimeout(resolve, 0))
    try {
      return work()
    } finally {
      setPreparing(false)
    }
  }

  const download = async () => {
    await prepared(() => saveFile(fileName, toCsv(table)))
    setStatus({ kind: 'saved', name: fileName })
  }

  const copy = async () => {
    const text = await prepared(() => toTsv(table))
    try {
      await navigator.clipboard.writeText(text)
      setStatus({ kind: 'copied', rows: table.rows.length })
    } catch {
      setStatus({ kind: 'blocked', text })
      setTimeout(() => fallback.current?.select(), 0)
    }
  }

  const send = () =>
    flight.current(async () => {
      setSending(true)
      setSendFailed(false)
      const ok = await sendSwitchAnswer(answer)
      setSending(false)
      if (!ok) {
        setSendFailed(true)
        return
      }
      setSent(true)
      onQuestionClosed()
    })

  return (
    <div className="export">
      <div className="screen-actions">
        <button type="button" className="btn btn-primary" disabled={disabled} onClick={download}>{prepLabel ?? 'Download CSV'}</button>
        <button type="button" className="btn btn-secondary" disabled={disabled} onClick={copy}>{prepLabel ?? 'Copy table'}</button>
        {nothing && <p className="muted">Nothing to export for this period.</p>}
      </div>
      {status.kind === 'saved' && <p className="saved-note" role="status">{`Saved ${status.name} to your downloads.`}</p>}
      {status.kind === 'copied' && <p className="saved-note" role="status">{`Copied ${status.rows} rows. Paste into a spreadsheet.`}</p>}
      {status.kind === 'blocked' && (
        <div className="export-blocked">
          <p className="alert" role="alert">Your browser blocked copying. Select the text below and copy it yourself, or use Download CSV.</p>
          <label className="field">
            Rows, tab-separated (selected)
            <textarea ref={fallback} className="mono export-text" readOnly rows={fallbackRows} value={status.text} wrap="off" />
          </label>
        </div>
      )}
      {showQuestion && (
        <section className="slip question" aria-labelledby="switch-title">
          <h2 id="switch-title">One question, optional</h2>
          <label className="field" htmlFor="switch-answer">Which tool or service would this replace for you?</label>
          <textarea
            id="switch-answer"
            className="export-text"
            rows={3}
            maxLength={ANSWER_LIMIT}
            placeholder="e.g. a spreadsheet, or the name of a service"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
          />
          <div className="question-actions">
            <button type="button" className="btn btn-primary" disabled={!canSend || sending} onClick={send}>{sendLabel}</button>
            <button type="button" className="link-btn" onClick={onQuestionClosed}>Skip</button>
            <span className="mono small muted">{`${answer.length} / ${ANSWER_LIMIT}`}</span>
          </div>
          {sendFailed && <p className="alert" role="alert">Could not send. Your answer is still here. Try again or skip.</p>}
          <p className="muted small">Only your answer is sent: nothing from your file. It is the one piece of text that leaves this browser.</p>
        </section>
      )}
      {sent && <p className="saved-note" role="status">Thanks. Sent.</p>}
    </div>
  )
}
