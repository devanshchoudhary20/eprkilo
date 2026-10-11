import { useMemo, useState } from 'react'
import { listListings } from '../lib/kg'
import type { ItemsFile } from '../lib/parse'
import type { SetupStore } from '../lib/setups'
import { plural } from '../lib/shareView'
import { Scroll } from './Scroll'

type Props = {
  file: ItemsFile
  store: SetupStore
  onSet: (key: string, setupId: string) => void
  onReset: (keys: string[]) => void
  onSetups: () => void
  onResults: () => void
}

const BY_NOTE = { id: '', sku: 'matched by SKU', name: 'matched by item name' } as const

export function MappingScreen({ file, store, onSet, onReset, onSetups, onResults }: Props) {
  const { listings, noKeyRows } = useMemo(() => listListings(file), [file])
  const [confirmed, setConfirmed] = useState(false)
  const fallback = store.setups.find((setup) => setup.id === store.defaultId)
  const known = new Set(store.setups.map((setup) => setup.id))
  const defaultName = fallback?.name ?? 'your default setup'
  const rows = listings.map((listing) => {
    const chosen = store.mapping[listing.key]
    const valid = chosen !== undefined && known.has(chosen)
    const wasDeleted = chosen !== undefined && !valid
    const deletedNote = `Was '${store.removed[chosen ?? ''] ?? 'a deleted setup'}', now ${defaultName}`
    const note = wasDeleted ? deletedNote : BY_NOTE[listing.by]
    return { ...listing, value: valid ? chosen : (store.defaultId ?? ''), note, idText: listing.listingId || 'none' }
  })
  const movedCount = rows.filter((row) => row.note.startsWith('Was ')).length
  const usingDefault = rows.filter((row) => row.value === store.defaultId).length
  const noIdNote = noKeyRows > 0 ? ` ${plural(noKeyRows, 'row')} had no Listing ID, SKU or item name and ${noKeyRows === 1 ? 'uses' : 'use'} the default.` : ''
  const movedNote = movedCount > 0 ? ` ${plural(movedCount, 'listing')} moved to your default because ${movedCount === 1 ? 'its' : 'their'} setup was deleted.` : ''
  const sub = `${plural(rows.length, 'listing')} in your file. ${usingDefault.toLocaleString('en-US')} use '${defaultName}'.${noIdNote}${movedNote}`
  const confirmText = `All ${rows.length.toLocaleString('en-US')} listings use '${defaultName}'.`
  const hasSetups = store.setups.length > 0

  const reset = () => {
    onReset(listings.map((listing) => listing.key))
    setConfirmed(true)
  }
  const choose = (key: string, id: string) => {
    setConfirmed(false)
    onSet(key, id)
  }

  if (!hasSetups) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>Which packaging does each listing use?</h1></header>
        <section className="slip empty-period">
          <p className="muted">Add a setup first so there is something to match.</p>
          <button type="button" className="btn btn-primary" onClick={onSetups}>Describe your packaging</button>
        </section>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="screen-head screen-head-row">
        <div>
          <h1>Which packaging does each listing use?</h1>
          <p className="muted" aria-live="polite">{sub}</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={reset}>All to default</button>
      </header>
      {confirmed && <p className="saved-note" role="status">{confirmText}</p>}
      <section className="slip table-card" aria-label="Listings">
        <Scroll className="scroll map-scroll" label="Listings table">
          <table className="num map-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">Listing ID</th>
                <th scope="col">Units sold</th>
                <th scope="col">Setup</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key}>
                  <th scope="row">
                    {row.name}
                    {row.note && <span className="small muted map-note">{row.note}</span>}
                  </th>
                  <td>{row.idText}</td>
                  <td>{row.units.toLocaleString('en-US')}</td>
                  <td>
                    <select aria-label={`Setup for ${row.name}`} value={row.value} onChange={(e) => choose(row.key, e.target.value)}>
                      {store.setups.map((setup) => (
                        <option key={setup.id} value={setup.id}>{setup.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Scroll>
      </section>
      <div className="screen-actions">
        <button type="button" className="btn btn-primary" onClick={onResults}>See kilograms</button>
      </div>
    </div>
  )
}
