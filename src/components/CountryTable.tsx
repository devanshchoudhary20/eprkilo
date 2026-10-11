import type { ShareResult, Totals } from '../lib/compute'
import { salesCell, salesColumns } from '../lib/shareView'
import type { SalesColumn } from '../lib/shareView'

type Line = { key: string; label: string; totals: Totals; flagged: boolean; className: string }

function buildLines(share: ShareResult): Line[] {
  const euLines = share.euCountries.map((country) => ({
    key: country.iso,
    label: country.name,
    totals: country,
    flagged: country.flagged,
    className: '',
  }))
  const unrecognisedNames = share.unrecognisedByName.map((entry) => entry.name).join(', ')
  const extra = [
    { key: 'outside', label: 'Outside the EU', totals: share.outside },
    { key: 'unrecognised', label: `Not recognised: ${unrecognisedNames}`, totals: share.unrecognised },
    { key: 'none', label: 'No destination', totals: share.noDestination },
  ]
    .filter((line) => line.totals.orders > 0)
    .map((line) => ({ ...line, flagged: false, className: 'quiet' }))
  return [...euLines, ...extra]
}

function PendingRows() {
  return (
    <div className="pending-rows" aria-hidden="true">
      {[0, 1, 2, 3, 4].map((key) => (
        <div className="pending-line" key={key} />
      ))}
    </div>
  )
}

function Cells({ line, columns }: { line: Line; columns: SalesColumn[] }) {
  return (
    <>
      <td>{line.totals.orders.toLocaleString('en-US')}</td>
      <td>{line.totals.units.toLocaleString('en-US')}</td>
      {columns.map((column) => (
        <td key={column.key}>{salesCell(line.totals, column)}</td>
      ))}
      <td className="flag-cell">{line.flagged && <span className="chip">Etsy asks for an EPR number</span>}</td>
    </>
  )
}

export function CountryTable({ share, pending }: { share: ShareResult; pending: boolean }) {
  const columns = salesColumns(share)
  const lines = buildLines(share)
  const hasEu = share.euCountries.length > 0
  return (
    <section className="slip table-card" aria-label="Orders by country">
      {pending ? (
        <PendingRows />
      ) : (
        <div className="scroll">
          <table className="num">
            <thead>
              <tr>
                <th scope="col">Country</th>
                <th scope="col">Orders</th>
                <th scope="col">Units</th>
                {columns.map((column) => (
                  <th scope="col" key={column.key}>{column.label}</th>
                ))}
                <th scope="col"><span className="sr-only">Flag</span></th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr key={line.key} className={line.className}>
                  <th scope="row">{line.label}</th>
                  <Cells line={line} columns={columns} />
                </tr>
              ))}
            </tbody>
          </table>
          {!hasEu && <p className="muted">No orders to an EU country in this period.</p>}
        </div>
      )}
      <p className="receipt-note">
        Flagged countries are the ones where Etsy asks sellers for an EPR registration number in Shop Manager. This page does not say whether you must register.
      </p>
    </section>
  )
}
