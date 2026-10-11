type Props = { onKeep: () => void; onLeave: () => void }

export function LeavePrompt({ onKeep, onLeave }: Props) {
  return (
    <section className="slip leave-prompt" aria-label="Leave this file">
      <p>Going back further drops your file and returns to the start page.</p>
      <div className="screen-actions">
        <button type="button" className="btn btn-primary" onClick={onKeep}>Keep my file</button>
        <button type="button" className="link-btn" onClick={onLeave}>Drop it and start over</button>
      </div>
    </section>
  )
}
