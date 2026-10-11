import type { ReactNode } from 'react'
import {
  ARITHMETIC_LINE,
  citeoQuote,
  FRANCE_URL,
  GERMANY_FIELDS,
  GERMANY_QUOTES,
  GERMANY_URL,
  RETRIEVED,
  SPAIN_FIELDS,
  SPAIN_QUOTES,
  SPAIN_URL,
} from '../lib/registerNotes'
import type { Quote } from '../lib/registerNotes'
import type { Shipped } from '../lib/export'
import { plural } from '../lib/shareView'
import { ExternalLink } from './ExternalLink'
import { Scroll } from './Scroll'

type Props = { germany: Shipped; france: Shipped; spain: Shipped }

const shippedLine = (title: string, shipped: Shipped) =>
  `Shipped to ${title}: ${plural(shipped.orders, 'order')}, ${plural(shipped.units, 'unit')}. Your item sales there: ${shipped.sales}.`

function Quoted({ quote }: { quote: Quote }) {
  return (
    <figure className="quote">
      <blockquote>{`“${quote.text}”`}</blockquote>
      {quote.translation && <figcaption className="muted">{`eprkilo's translation: ${quote.translation}`}</figcaption>}
    </figure>
  )
}

function FieldTable({ left, right, rows }: { left: string; right: string; rows: Array<[string, string]> }) {
  return (
    <Scroll label={`${right} mapping table`}>
      <table className="note-table">
        <thead>
          <tr>
            <th scope="col">{left}</th>
            <th scope="col">{right}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([mine, theirs]) => (
            <tr key={mine}>
              <th scope="row">{mine}</th>
              <td>{theirs}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Scroll>
  )
}

function Note({ title, shipped, source, children }: { title: string; shipped: Shipped; source: ReactNode; children: ReactNode }) {
  const line = shippedLine(title, shipped)
  return (
    <section className="slip note" aria-label={`${title} register note`}>
      <h3>{title}</h3>
      <p className="note-ship">{line}</p>
      {children}
      <p className="muted note-arith">{ARITHMETIC_LINE}</p>
      <p className="mono small note-source">{source}</p>
    </section>
  )
}

export function RegisterNotes({ germany, france, spain }: Props) {
  const franceQuote = citeoQuote(france.units)
  const retrieved = `, retrieved ${RETRIEVED}.`
  return (
    <section className="notes" aria-labelledby="notes-title">
      <h2 id="notes-title">What each register says, in its own words</h2>
      <p className="muted">
        {`Quoted sentences are copied from the sources named under each note, retrieved ${RETRIEVED}. The words outside the quotation marks are eprkilo's.`}
      </p>
      <Note title="Germany" shipped={germany} source={<>Source: <ExternalLink href={GERMANY_URL} />{retrieved}</>}>
        <p>LUCID has eight material fields. Your materials go in like this:</p>
        <FieldTable left="Your material" right="LUCID field" rows={GERMANY_FIELDS} />
        {GERMANY_QUOTES.map((quote) => (
          <Quoted key={quote.text} quote={quote} />
        ))}
      </Note>
      <Note title="France" shipped={france} source={<>Source: Citeo, Guide du tarif des emballages ménagers 2026, <ExternalLink href={FRANCE_URL} />{retrieved}</>}>
        <Quoted quote={franceQuote} />
      </Note>
      <Note title="Spain" shipped={spain} source={<>Source: MITECO, FAQ Registro de Productores de Producto, envases (RD 1055/2022), <ExternalLink href={SPAIN_URL} />{retrieved}</>}>
        <p>MITECO materials, to verify against the MITECO DAE form. Glass goes to Ecovidrio, not to the MITECO form.</p>
        <FieldTable left="Your material" right="MITECO material" rows={SPAIN_FIELDS} />
        {SPAIN_QUOTES.map((quote) => (
          <Quoted key={quote.text} quote={quote} />
        ))}
      </Note>
    </section>
  )
}
