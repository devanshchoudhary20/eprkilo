import type { Period } from '../lib/compute'
import { FilePicker } from './FilePicker'

type Props = {
  fileName: string
  rowCount: number
  draft: Period
  error: string | null
  countUnshipped: boolean
  onDraft: (next: Period) => void
  onCountUnshipped: (next: boolean) => void
  onFile: (file: File) => void
}

export function PeriodStrip({ fileName, rowCount, draft, error, countUnshipped, onDraft, onCountUnshipped, onFile }: Props) {
  const fieldClass = error ? 'field invalid' : 'field'
  const rowsLabel = `${rowCount.toLocaleString('en-US')} ${rowCount === 1 ? 'row' : 'rows'} read`
  return (
    <section className="slip strip" aria-label="File and period">
      <div className="strip-top">
        <p className="strip-file">
          <span>{fileName}</span>
          <span className="muted">{rowsLabel}</span>
        </p>
        <FilePicker label="Choose another file" variant="secondary" onFile={onFile} />
      </div>
      <div className="period">
        <label className={fieldClass}>
          From
          <input type="date" value={draft.from} aria-invalid={Boolean(error)} onChange={(e) => onDraft({ ...draft, from: e.target.value })} />
        </label>
        <label className={fieldClass}>
          To
          <input type="date" value={draft.to} aria-invalid={Boolean(error)} onChange={(e) => onDraft({ ...draft, to: e.target.value })} />
        </label>
        <span className="period-label">by ship date</span>
        <label className="check">
          <input type="checkbox" checked={countUnshipped} onChange={(e) => onCountUnshipped(e.target.checked)} />
          Count orders without a ship date
        </label>
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
    </section>
  )
}
