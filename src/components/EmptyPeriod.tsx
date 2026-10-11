import { formatDate } from '../lib/dates'
import type { Period, ShareResult } from '../lib/compute'
import { periodLabel } from '../lib/shareView'

type Props = { share: ShareResult; countUnshipped: boolean; onUseRange: (range: Period) => void }

export function EmptyPeriod({ share, countUnshipped, onUseRange }: Props) {
  const { fileRange, hasAnyShipped, period } = share
  const noShipDates = !hasAnyShipped && !countUnshipped
  const title = `No orders ${countUnshipped ? 'counted' : 'shipped'} between ${periodLabel(period.from, period.to)}.`
  const rangeText = fileRange ? `${formatDate(fileRange.from)} to ${formatDate(fileRange.to)}` : null
  const detail = rangeText
    ? `Your file has orders from ${rangeText}. Pick dates inside that range.`
    : 'Your file has no orders with a date we can read.'
  const heading = noShipDates ? 'None of these orders has a ship date yet.' : title
  const body = noShipDates ? "Tick 'Count orders without a ship date' to include them." : detail

  return (
    <section className="slip empty-period" aria-label="No orders in this period">
      <h2>{heading}</h2>
      <p className="muted">{body}</p>
      {!noShipDates && fileRange && (
        <button type="button" className="btn btn-primary" onClick={() => onUseRange(fileRange)}>Use {rangeText}</button>
      )}
    </section>
  )
}
