import { useEffect, useMemo, useState } from 'react'
import { formatDate } from '../lib/dates'
import { columnsFor, computeKg } from '../lib/kg'
import type { Period } from '../lib/compute'
import type { ItemsFile } from '../lib/parse'
import type { SetupStore } from '../lib/setups'
import { KgTable } from './KgTable'

type Props = {
  file: ItemsFile
  isSample: boolean
  period: Period
  countUnshipped: boolean
  store: SetupStore
  onSetups: () => void
  onPeriod: () => void
  onCalculated: () => void
}

const plural = (count: number, word: string) => `${count.toLocaleString('en-US')} ${word}${count === 1 ? '' : 's'}`

export function ResultsScreen({ file, isSample, period, countUnshipped, store, onSetups, onPeriod, onCalculated }: Props) {
  const [showEmpty, setShowEmpty] = useState(false)
  const result = useMemo(() => computeKg(file, period, countUnshipped, store), [file, period, countUnshipped, store])
  const { visible, hidden } = columnsFor(result, showEmpty)
  const title = `Packaging in kilograms, ${formatDate(period.from)} to ${formatDate(period.to)}`
  const hasSetups = store.setups.length > 0
  const hasRows = result.countries.length > 0
  const used = result.usedSetups.map((setup) => (setup.isDefault ? `${setup.name} (default)` : setup.name)).join(', ')
  const usedText = used || 'none'
  const strip = [
    `Setups used: ${usedText}.`,
    `${plural(result.defaultListings, 'listing')} use the default.`,
    result.quantityAssumed > 0 && `${plural(result.quantityAssumed, 'row')} assumed quantity 1.`,
    result.totalMissing > 0 && `${plural(result.totalMissing, 'row')} with item total missing.`,
  ].filter(Boolean).join(' ')
  const toggleLabel = showEmpty ? 'Show empty materials' : `Show empty materials (${hidden} hidden)`
  const showToggle = hidden > 0 || showEmpty
  const ready = hasSetups && hasRows && result.hasWeights

  useEffect(() => {
    if (ready && !isSample) onCalculated()
  }, [ready, isSample, onCalculated])

  if (!hasSetups) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{title}</h1></header>
        <section className="slip empty-period">
          <p className="muted">Describe your packaging to see kilograms.</p>
          <button type="button" className="btn btn-primary" onClick={onSetups}>Describe your packaging</button>
        </section>
      </div>
    )
  }

  if (!hasRows) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{title}</h1></header>
        <section className="slip empty-period">
          <p className="muted">No orders to an EU country in this period, so there is nothing to weigh.</p>
          <button type="button" className="link-btn" onClick={onPeriod}>Change the period</button>
        </section>
      </div>
    )
  }

  if (!result.hasWeights) {
    return (
      <div className="screen">
        <header className="screen-head"><h1>{title}</h1></header>
        <section className="slip empty-period">
          <p className="muted">Your setups have no weight yet, so kilograms cannot be added up. Add parts with grams in packaging setups.</p>
          <button type="button" className="btn btn-primary" onClick={onSetups}>Open packaging setups</button>
        </section>
      </div>
    )
  }

  return (
    <div className="screen">
      <header className="screen-head"><h1>{title}</h1></header>
      <p className="strip-note" role="status">{strip}</p>
      <section className="slip table-card" aria-label="Kilograms by country">
        <KgTable result={result} columns={visible} />
        {showToggle && (
          <label className="check">
            <input type="checkbox" checked={showEmpty} onChange={(e) => setShowEmpty(e.target.checked)} />
            {toggleLabel}
          </label>
        )}
      </section>
      <p className="muted rule">
        How parcels are counted: one parcel per order. Parts that count per item are multiplied by quantity. Parts that count once per order come from the item with the biggest such weight; the biggest box wins, counted once.
      </p>
      <div className="screen-actions">
        <button type="button" className="link-btn" onClick={onSetups}>Edit packaging setups</button>
      </div>
    </div>
  )
}
