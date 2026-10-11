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
  const settled = useDeferredValue({ applied, countUnshipped })
  const pending = settled.applied !== applied || settled.countUnshipped !== countUnshipped
  const share = useMemo(
    () => computeShare(file, settled.applied, settled.countUnshipped),
    [file, settled],
  )
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
      {isEmpty ? (
        <EmptyPeriod share={share} countUnshipped={settled.countUnshipped} onUseRange={changeDraft} />
      ) : (
        <>
          <ShareSummary share={share} countUnshipped={settled.countUnshipped} pending={pending} />
          <NoticeBanner share={share} onCountUnshipped={() => setCountUnshipped(true)} />
          <CountryTable share={share} pending={pending} />
        </>
      )}
    </div>
  )
}
