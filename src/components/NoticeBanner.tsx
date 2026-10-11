import { buildNotice } from '../lib/shareView'
import type { NoticePart } from '../lib/shareView'
import type { ShareResult } from '../lib/compute'
import { AlertIcon } from './icons'

function Parts({ parts, onCountUnshipped }: { parts: NoticePart[]; onCountUnshipped: () => void }) {
  return (
    <>
      {parts.map((part) => (
        <span key={part.text}>
          {part.text}
          {part.action && (
            <>
              {' ('}
              <button type="button" className="link-btn" onClick={onCountUnshipped}>Count them</button>
              {')'}
            </>
          )}
          {part.sep}
        </span>
      ))}
    </>
  )
}

export function NoticeBanner({ share, onCountUnshipped }: { share: ShareResult; onCountUnshipped: () => void }) {
  const notice = buildNotice(share)
  const sections = [
    { key: 'left', label: 'Left out of every total: ', parts: notice.leftOut },
    { key: 'total', label: 'In your shop total but not in any country: ', parts: notice.inTotal },
    { key: 'guess', label: 'Counted with a guess: ', parts: notice.guessed },
  ].filter((section) => section.parts.length > 0)
  if (sections.length === 0) return null
  return (
    <section className="notice" aria-label="Rows left out or guessed">
      <h2><AlertIcon /> Some rows were left out or guessed</h2>
      {sections.map((section) => (
        <p key={section.key}>
          <strong>{section.label}</strong>
          <Parts parts={section.parts} onCountUnshipped={onCountUnshipped} />
        </p>
      ))}
    </section>
  )
}
