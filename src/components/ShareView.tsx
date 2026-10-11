import { useDeferredValue, useMemo } from 'react'
import { computeShare } from '../lib/compute'
import type { usePeriodState } from '../hooks/usePeriodState'
import type { ItemsFile } from '../lib/parse'
import { rows } from '../lib/shareView'
import { CountryTable } from './CountryTable'
import { EmptyPeriod } from './EmptyPeriod'
import { NoticeBanner } from './NoticeBanner'
import { PeriodStrip } from './PeriodStrip'
import { ShareSummary } from './ShareSummary'

type Props = {
  fileName: string
  file: ItemsFile
  period: ReturnType<typeof usePeriodState>
  onFile: (file: File) => void
  onDescribe: () => void
}

export function ShareView({ fileName, file, period, onFile, onDescribe }: Props) {
  const { draft, applied, countUnshipped, error, changeDraft, setCountUnshipped } = period
  const settledPeriod = useDeferredValue(applied)
  const settledUnshipped = useDeferredValue(countUnshipped)
  const pending = settledPeriod !== applied || settledUnshipped !== countUnshipped
  const share = useMemo(
    () => computeShare(file, settledPeriod, settledUnshipped),
    [file, settledPeriod, settledUnshipped],
  )
  const rowsLabel = rows(file.rowCount)
  const noSalesNote = `Read ${rowsLabel}. Item sales are missing in this file, so only orders and units are shown.`
  const isEmpty = share.includedRows === 0

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
          <div>
            <button type="button" className="btn btn-primary" disabled={pending} onClick={onDescribe}>Describe your packaging</button>
          </div>
        </>
      )}
    </div>
  )
}
