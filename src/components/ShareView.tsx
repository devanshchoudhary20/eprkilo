import { useDeferredValue, useMemo, useState } from 'react'
import { computeShare, defaultPeriod } from '../lib/compute'
import type { Period } from '../lib/compute'
import type { ItemsFile } from '../lib/parse'
import { validatePeriod } from '../lib/shareView'
import { CountryTable } from './CountryTable'
import { EmptyPeriod } from './EmptyPeriod'
import { NoticeBanner } from './NoticeBanner'
import { PeriodStrip } from './PeriodStrip'
import { ShareSummary } from './ShareSummary'

type Props = { fileName: string; file: ItemsFile; onFile: (file: File) => void }

export function ShareView({ fileName, file, onFile }: Props) {
  const initial = useMemo(() => defaultPeriod(file), [file])
  const [draft, setDraft] = useState<Period>(initial)
  const [applied, setApplied] = useState<Period>(initial)
  const [countUnshipped, setCountUnshipped] = useState(false)
  const settledPeriod = useDeferredValue(applied)
  const settledUnshipped = useDeferredValue(countUnshipped)
  const pending = settledPeriod !== applied || settledUnshipped !== countUnshipped
  const share = useMemo(
    () => computeShare(file, settledPeriod, settledUnshipped),
    [file, settledPeriod, settledUnshipped],
  )
  const rowsLabel = `${file.rowCount.toLocaleString('en-US')} ${file.rowCount === 1 ? 'row' : 'rows'}`
  const noSalesNote = `Read ${rowsLabel}. Item sales are missing in this file, so only orders and units are shown.`
  const error = validatePeriod(draft.from, draft.to)
  const isEmpty = share.includedRows === 0

  const changeDraft = (next: Period) => {
    setDraft(next)
    if (!validatePeriod(next.from, next.to)) setApplied(next)
  }

  return (
    <div className="share">
      <PeriodStrip
        fileName={fileName}
        rowCount={file.rowCount}
        draft={draft}
        error={error}
        countUnshipped={countUnshipped}
        onDraft={changeDraft}
        onCountUnshipped={setCountUnshipped}
        onFile={onFile}
      />
      {!file.hasSales && <p className="slip strip" role="status">{noSalesNote}</p>}
      {isEmpty ? (
        <EmptyPeriod share={share} countUnshipped={settledUnshipped} onUseRange={changeDraft} />
      ) : (
        <>
          <ShareSummary share={share} countUnshipped={settledUnshipped} pending={pending} />
          <NoticeBanner share={share} onCountUnshipped={() => setCountUnshipped(true)} />
          <CountryTable share={share} pending={pending} />
        </>
      )}
    </div>
  )
}
