import { useState } from 'react'
import { blankDraft, toDraft } from '../lib/setups'
import type { SetupDraft, SetupStore, Setup } from '../lib/setups'
import { SetupEditor } from './SetupEditor'

type Props = {
  store: SetupStore
  unreadable: boolean
  onSave: (setup: Setup, makeDefault: boolean) => void
  onDelete: (id: string) => void
  onMapping: () => void
  onResults: () => void
}

export function SetupsScreen({ store, unreadable, onSave, onDelete, onMapping, onResults }: Props) {
  const [fresh, setFresh] = useState<SetupDraft | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(store.setups[0]?.id ?? null)
  const [blank, setBlank] = useState(blankDraft)
  const saved = store.setups.find((setup) => setup.id === selectedId)
  const editing = fresh ?? (saved ? toDraft(saved) : null)
  const shown = editing ?? blank
  const isEmpty = store.setups.length === 0
  const isFresh = fresh !== null

  const startNew = () => setFresh(blankDraft())
  const select = (id: string) => {
    setFresh(null)
    setSelectedId(id)
  }
  const handleSave = (setup: Setup, makeDefault: boolean) => {
    onSave(setup, makeDefault)
    setFresh(null)
    setSelectedId(setup.id)
  }
  const handleDelete = (id: string) => {
    onDelete(id)
    setSelectedId(null)
    setBlank(blankDraft())
  }

  const items = store.setups.map((setup) => ({
    id: setup.id,
    name: setup.name,
    tag: setup.id === store.defaultId ? 'Default' : null,
    className: !isFresh && setup.id === selectedId ? 'setup-item current' : 'setup-item',
  }))

  return (
    <div className="screen">
      <header className="screen-head">
        <h1>Describe your packaging once</h1>
        <p className="muted">Weigh one packed parcel part by part. eprkilo multiplies the grams by your orders.</p>
      </header>
      {unreadable && <p className="notice-line" role="status">Saved setups could not be read, so you are starting fresh. Your file was not affected.</p>}
      <div className="setups-grid">
        <aside className="slip setup-list" aria-label="Your setups">
          <h2>Your setups</h2>
          {isEmpty && !isFresh && (
            <p className="muted">No packaging described yet. Add your first setup, for example 'Card in mailer'. You can add more later for items that ship differently.</p>
          )}
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                <button type="button" className={item.className} onClick={() => select(item.id)}>
                  <span>{item.name}</span>
                  {item.tag && <span className="tag mono">{item.tag}</span>}
                </button>
              </li>
            ))}
            {isFresh && (
              <li>
                <span className="setup-item current">
                  <span>{fresh.name.trim() || 'New setup'}</span>
                  <span className="tag mono">Not saved yet</span>
                </span>
              </li>
            )}
          </ul>
          <button type="button" className="btn btn-secondary" onClick={startNew}>Add a setup</button>
        </aside>
        <SetupEditor
          key={shown.id}
          initial={shown}
          isSaved={!isFresh && Boolean(saved)}
          isDefault={!isFresh && saved?.id === store.defaultId}
          hasOthers={isFresh ? !isEmpty : store.setups.length > 1}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      </div>
      <div className="screen-actions">
        <button type="button" className="btn btn-primary" onClick={onResults}>See kilograms</button>
        <button type="button" className="link-btn" onClick={onMapping}>Match setups to listings</button>
      </div>
    </div>
  )
}
