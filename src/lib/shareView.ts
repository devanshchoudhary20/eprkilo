import { formatDate } from './dates'
import { formatMoney } from './money'
import { UNKNOWN_CURRENCY } from './parse'
import { salesShare } from './compute'
import type { ShareResult, Totals } from './compute'

export type SalesColumn = { key: string; label: string }
export type NoticePart = { text: string; sep: string; action?: 'count-unshipped' }
export type Notice = { leftOut: NoticePart[]; inTotal: NoticePart[]; guessed: NoticePart[] }

export const plural = (count: number, word: string) => `${count.toLocaleString('en-US')} ${word}${count === 1 ? '' : 's'}`
export const rows = (count: number) => plural(count, 'row')

export function salesColumns(share: ShareResult): SalesColumn[] {
  if (!share.hasSales) return [{ key: 'none', label: 'Item sales' }]
  return share.currencies.map((currency) => ({
    key: currency,
    label: currency === UNKNOWN_CURRENCY ? 'Item sales, unknown currency' : `Item sales ${currency}`,
  }))
}

export function salesCell(totals: Totals, column: SalesColumn): string {
  if (column.key === 'none') return 'no data'
  return formatMoney(totals.sales[column.key] ?? 0)
}

export function shareCell(share: ShareResult, column: SalesColumn): string {
  if (column.key === 'none') return 'no data'
  return salesShare(share.eu.sales[column.key] ?? 0, share.shop.sales[column.key] ?? 0)
}

export function periodLabel(from: string, to: string): string {
  return `${formatDate(from)} and ${formatDate(to)}`
}

function withSeparators(texts: Array<Omit<NoticePart, 'sep'>>): NoticePart[] {
  return texts.map((part, index) => ({ ...part, sep: index === texts.length - 1 ? '.' : ', ' }))
}

export function buildNotice(share: ShareResult): Notice {
  const names = share.unrecognisedByName.map((entry) => `${entry.name} ${entry.count}`).join(', ')
  const leftOut = [
    share.notShipped > 0 && { text: `${rows(share.notShipped)} not shipped yet`, action: 'count-unshipped' as const },
    share.badDate > 0 && { text: `${rows(share.badDate)} with a date we cannot read` },
  ].filter((part) => part !== false)
  const inTotal = [
    share.noCountry > 0 && { text: `${rows(share.noCountry)} with no country` },
    share.unrecognisedRows > 0 && { text: `${rows(share.unrecognisedRows)} with a country we do not recognise (${names})` },
  ].filter((part) => part !== false)
  const guessed = [
    share.quantityAssumed > 0 && { text: `${rows(share.quantityAssumed)} with no quantity (counted as 1)` },
    share.totalMissing > 0 && { text: `${rows(share.totalMissing)} with no item total (counted as 0.00)` },
  ].filter((part) => part !== false)
  return { leftOut: withSeparators(leftOut), inTotal: withSeparators(inTotal), guessed: withSeparators(guessed) }
}

export function validatePeriod(from: string, to: string): string | null {
  if (!from || !to) return 'Choose both dates.'
  return from > to ? 'From must be before To.' : null
}
