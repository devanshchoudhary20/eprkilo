import { useMemo, useState } from 'react'
import { defaultPeriod } from '../lib/compute'
import type { Period } from '../lib/compute'
import type { ItemsFile } from '../lib/parse'
import { validatePeriod } from '../lib/shareView'

export function usePeriodState(file: ItemsFile) {
  const initial = useMemo(() => defaultPeriod(file), [file])
  const [draft, setDraft] = useState<Period>(initial)
  const [applied, setApplied] = useState<Period>(initial)
  const [countUnshipped, setCountUnshipped] = useState(false)
  const error = validatePeriod(draft.from, draft.to)

  const changeDraft = (next: Period) => {
    setDraft(next)
    if (!validatePeriod(next.from, next.to)) setApplied(next)
  }

  return { draft, applied, countUnshipped, error, changeDraft, setCountUnshipped }
}
