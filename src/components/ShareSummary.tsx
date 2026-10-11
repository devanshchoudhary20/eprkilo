import { ordersShare } from '../lib/compute'
import type { ShareResult } from '../lib/compute'
import { formatDate } from '../lib/dates'
import { Scroll } from './Scroll'
import { salesCell, salesColumns, shareCell } from '../lib/shareView'

type Props = { share: ShareResult; countUnshipped: boolean; pending: boolean }

export function ShareSummary({ share, countUnshipped, pending }: Props) {
  const columns = salesColumns(share)
  const orderShare = ordersShare(share.eu.orders, share.shop.orders)
  const figure = pending ? 'Counting...' : orderShare
  const figureClass = pending ? 'anchor-figure counting' : 'anchor-figure'
  const verb = countUnshipped ? 'counted' : 'shipped'
  const shopOrders = share.shop.orders.toLocaleString('en-US')
  const euOrders = share.eu.orders.toLocaleString('en-US')
  const sub = `${euOrders} of ${shopOrders} orders ${verb} between ${formatDate(share.period.from)} and ${formatDate(share.period.to)}.`
  const receiptClass = pending ? 'slip receipt pending-dim' : 'slip receipt'
  const dim = pending ? 'strong muted' : 'strong'

  return (
    <div className="anchor-row">
      <div>
        <p className={figureClass} aria-live="polite">{figure}</p>
        <h1 className="anchor-title">of your orders went to the EU</h1>
        <p className="anchor-sub">{pending ? 'Counting...' : sub}</p>
      </div>
      <section className={receiptClass} aria-label="Shop total and EU share">
        <Scroll label="Shop total and EU share table">
          <table className="num">
            <thead>
              <tr>
                <th scope="col"><span className="sr-only">Row</span></th>
                <th scope="col">Orders</th>
                {columns.map((column) => (
                  <th scope="col" key={column.key}>{column.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Shop total</th>
                <td>{shopOrders}</td>
                {columns.map((column) => (
                  <td key={column.key}>{salesCell(share.shop, column)}</td>
                ))}
              </tr>
              <tr>
                <th scope="row">EU</th>
                <td>{euOrders}</td>
                {columns.map((column) => (
                  <td key={column.key}>{salesCell(share.eu, column)}</td>
                ))}
              </tr>
              <tr className={dim}>
                <th scope="row">EU share</th>
                <td>{orderShare}</td>
                {columns.map((column) => (
                  <td key={column.key}>{shareCell(share, column)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </Scroll>
        <p className="receipt-note">Item sales are before discounts, shipping and tax. Currencies are never added together or converted.</p>
      </section>
    </div>
  )
}
