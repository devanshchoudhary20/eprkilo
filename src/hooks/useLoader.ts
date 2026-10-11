import { useCallback, useRef, useState } from 'react'
import { parseCsvString, readCsvFile } from '../lib/parse'
import type { ItemsFile, ParseOutcome, ReadHandle } from '../lib/parse'
import { track } from '../lib/track'

export const MAX_BYTES = 50 * 1024 * 1024
export const SAMPLE_NAME = 'sample-order-items.csv'

export type Refusal = Exclude<ParseOutcome, { kind: 'items' }>

export type LoadState =
  | { phase: 'idle'; notice: string | null }
  | { phase: 'reading'; fileName: string; rows: number; fraction: number }
  | { phase: 'refused'; refusal: Refusal }
  | { phase: 'ready'; id: number; fileName: string; isSample: boolean; file: ItemsFile }

const idle = (notice: string | null = null): LoadState => ({ phase: 'idle', notice })

const sizeLabel = (bytes: number) => `${Math.round(bytes / (1024 * 1024))} MB`
const isCsv = (file: File) => /\.csv$/i.test(file.name) || file.type === 'text/csv'

export function useLoader() {
  const [state, setState] = useState<LoadState>(idle())
  const handle = useRef<ReadHandle | null>(null)
  const nextId = useRef(0)

  const finish = useCallback((outcome: ParseOutcome, fileName: string, isSample: boolean) => {
    if (outcome.kind !== 'items') {
      setState({ phase: 'refused', refusal: outcome })
      return
    }
    nextId.current += 1
    setState({ phase: 'ready', id: nextId.current, fileName, isSample, file: outcome.file })
    if (!isSample) track('parsed')
  }, [])

  const loadFile = useCallback(
    (file: File) => {
      handle.current?.cancel()
      if (file.size > MAX_BYTES) {
        setState(idle(`That file is ${sizeLabel(file.size)}. eprkilo reads files up to 50 MB. In Shop Manager, download one month or one year at a time, then drop it again.`))
        return
      }
      if (!isCsv(file)) {
        setState(idle('That is not a CSV file. In Shop Manager choose CSV as the file type, then drop it here.'))
        return
      }
      const fileName = file.name || 'your file'
      setState({ phase: 'reading', fileName, rows: 0, fraction: 0 })
      handle.current = readCsvFile(
        file,
        (rows, cursor) => setState({ phase: 'reading', fileName, rows, fraction: file.size > 0 ? cursor / file.size : 0 }),
        (outcome) => finish(outcome, fileName, false),
        () => setState(idle('Something went wrong reading this file. Nothing was sent anywhere. Choose the file again.')),
      )
    },
    [finish],
  )

  const loadSample = useCallback(async () => {
    track('sample')
    try {
      const { default: text } = await import('../../fixtures/items.csv?raw')
      finish(parseCsvString(text), SAMPLE_NAME, true)
    } catch {
      setState(idle('The sample file could not be loaded. Reload the page and try again.'))
    }
  }, [finish])

  const reset = useCallback(() => {
    handle.current?.cancel()
    setState(idle())
  }, [])

  return { state, loadFile, loadSample, reset }
}
