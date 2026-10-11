import { useState } from 'react'
import { NAME_LIMIT, blankComponent, checkDraft } from '../lib/setups'
import type { ComponentDraft, Setup, SetupDraft } from '../lib/setups'
import { ComponentRow } from './ComponentRow'

type Props = {
  initial: SetupDraft
  isSaved: boolean
  current: Setup | undefined
  isDefault: boolean
  hasOthers: boolean
  onSave: (setup: Setup, makeDefault: boolean) => void
  onDelete: (id: string) => void
}

export function SetupEditor({ initial, isSaved, current, isDefault, hasOthers, onSave, onDelete }: Props) {
  const [draft, setDraft] = useState(initial)
  const [wantDefault, setWantDefault] = useState(false)
  const [attempted, setAttempted] = useState(false)
  const [baseline, setBaseline] = useState(() => JSON.stringify(current))
  const [savedNote, setSavedNote] = useState<{ text: string; draft: SetupDraft; wantDefault: boolean } | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const check = checkDraft(draft)
  const isLocked = isDefault || !hasOthers
  const switchOn = isLocked || wantDefault
  const nameError = attempted ? check.nameError : null
  const shownErrors = attempted ? check.gramsErrors : {}
  const summary = attempted && check.errorCount > 0 ? `Fix ${check.errorCount} ${check.errorCount === 1 ? 'field' : 'fields'} to save.` : null
  const nameClass = nameError ? 'field invalid' : 'field'
  const changedElsewhere = isSaved && JSON.stringify(current) !== baseline
  // any edit after saving makes the note stale, so it only shows for the exact saved draft
  const message = savedNote && savedNote.draft === draft && savedNote.wantDefault === wantDefault && !changedElsewhere ? savedNote.text : null
  const switchHelp = isDefault && hasOthers ? 'To change the default, switch it on for another setup.' : null

  const update = (key: string, next: ComponentDraft) =>
    setDraft((prev) => ({ ...prev, components: prev.components.map((item) => (item.key === key ? next : item)) }))
  const remove = (key: string) =>
    setDraft((prev) => ({ ...prev, components: prev.components.filter((item) => item.key !== key) }))
  const add = () => setDraft((prev) => ({ ...prev, components: [...prev.components, blankComponent()] }))

  const save = () => {
    setAttempted(true)
    setDeleteError(null)
    if (!check.setup) {
      setSavedNote(null)
      return
    }
    onSave(check.setup, switchOn)
    setBaseline(JSON.stringify(check.setup))
    setSavedNote({ text: switchOn ? `Saved. '${check.setup.name}' is your default setup.` : `Saved. '${check.setup.name}' is saved.`, draft, wantDefault })
  }

  const deleteThis = () => {
    if (isDefault && hasOthers) {
      setDeleteError(`Pick another default before deleting '${draft.name.trim() || 'this setup'}'.`)
      return
    }
    onDelete(draft.id)
  }

  return (
    <section className="slip editor" aria-label="Setup editor">
      {message && <p className="saved-note" role="status">{message}</p>}
      {changedElsewhere && <p className="notice-line" role="status">This setup was changed in another tab. Saving here replaces that change.</p>}
      <div className="editor-head">
        <label className={nameClass}>
          Setup name
          <input type="text" value={draft.name} maxLength={NAME_LIMIT} placeholder="Card in mailer" aria-invalid={Boolean(nameError)} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          {nameError && <span className="field-error" role="alert">{nameError}</span>}
        </label>
        <div className="switch-wrap">
          <label className="check">
            <input type="checkbox" role="switch" checked={switchOn} disabled={isLocked} onChange={(e) => setWantDefault(e.target.checked)} />
            Use for listings I have not set
          </label>
          {switchHelp && <p className="small muted">{switchHelp}</p>}
        </div>
      </div>
      {draft.components.map((item) => (
        <ComponentRow
          key={item.key}
          item={item}
          error={shownErrors[item.key]}
          canRemove={draft.components.length > 1}
          onChange={(next) => update(item.key, next)}
          onRemove={() => remove(item.key)}
        />
      ))}
      <p className="muted">Per item sold: multiplied by quantity. Once per order: counted one time for the parcel.</p>
      {summary && <p className="field-error" role="alert">{summary}</p>}
      <div className="editor-actions">
        <button type="button" className="btn btn-secondary" onClick={add}>Add a component</button>
        <button type="button" className="btn btn-primary" onClick={save}>Save setup</button>
        {isSaved && <button type="button" className="link-btn" onClick={deleteThis}>Delete setup</button>}
      </div>
      {deleteError && <p className="field-error" role="alert">{deleteError}</p>}
    </section>
  )
}
