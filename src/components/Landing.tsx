import { DropZone } from './DropZone'
import { FileXIcon, LockIcon } from './icons'

const STEPS = [
  'Open Shop Manager, then Settings > Options.',
  'Choose Download Data.',
  'Under Orders, set CSV type to Order Items and pick a month or the whole year.',
  'Select Download CSV, then drop it here.',
]

type Props = { notice: string | null; onFile: (file: File) => void; onSample: () => void }

export function Landing({ notice, onFile, onSample }: Props) {
  return (
    <div className="landing">
      <div className="landing-intro">
        <h1>See how much of your shop the EU is, and what your packaging comes to in kilograms.</h1>
        <p className="landing-sub">From the file Etsy already gives you; nothing is uploaded.</p>
        <div className="privacy-strip">
          <LockIcon />
          <p>
            <span>Your file stays in this browser tab. It is read here, never sent anywhere, and gone when you close the tab.</span>
            <a href="#privacy">See everything this page sends</a>
          </p>
        </div>
      </div>
      <p className="landing-note muted">Order Items downloads from Shop Manager, easiest on a computer. Try the sample here, or open this page on your laptop.</p>
      <div className="landing-drop">
        {notice && (
          <div className="alert landing-alert" role="alert">
            <FileXIcon />
            <p>{notice}</p>
          </div>
        )}
        <DropZone onFile={onFile} />
      </div>
      <div className="landing-sample">
        <span className="muted">No file handy?</span>
        <button type="button" className="btn btn-secondary" onClick={onSample}>Try a sample file</button>
      </div>
      <aside className="landing-steps slip steps">
        <h2>Get the file from Shop Manager</h2>
        <ol>
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <div className="steps-path">
          <span className="muted small">The same path in one line</span>
          <code>Shop Manager &gt; Settings &gt; Options &gt; Download Data &gt; Orders &gt; CSV type: Order Items</code>
        </div>
      </aside>
    </div>
  )
}
