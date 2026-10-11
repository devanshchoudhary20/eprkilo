import { useCallback, useRef } from 'react'
import { usePeriodState } from '../hooks/usePeriodState'
import { useStep } from '../hooks/useStep'
import { useSetupStore } from '../hooks/useSetupStore'
import type { ItemsFile } from '../lib/parse'
import { goTo } from '../lib/route'
import type { Step } from '../lib/route'
import { trackOnce } from '../lib/track'
import { MappingScreen } from './MappingScreen'
import { ResultsScreen } from './ResultsScreen'
import { SetupsScreen } from './SetupsScreen'
import { ShareView } from './ShareView'

type Props = { fileName: string; file: ItemsFile; isSample: boolean; onFile: (file: File) => void; questionClosed: boolean; onQuestionClosed: () => void }

export function Workspace({ fileName, file, isSample, onFile, questionClosed, onQuestionClosed }: Props) {
  const step = useStep()
  const period = usePeriodState(file)
  const { store, unreadable, saveSetup, deleteSetup, setMapping, resetMapping } = useSetupStore()

  const calculated = useRef(false)
  const onCalculated = useCallback(() => {
    if (calculated.current) return
    calculated.current = true
    trackOnce('calculated')
  }, [])

  const go = (next: Step) => () => {
    goTo(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <>
      <div hidden={step !== 'share'}>
        <ShareView fileName={fileName} file={file} period={period} onFile={onFile} onDescribe={go('setups')} />
      </div>
      {step === 'setups' && (
        <SetupsScreen store={store} unreadable={unreadable} onSave={saveSetup} onDelete={deleteSetup} onMapping={go('mapping')} onResults={go('results')} />
      )}
      {step === 'mapping' && (
        <MappingScreen file={file} store={store} onSet={setMapping} onReset={resetMapping} onSetups={go('setups')} onResults={go('results')} />
      )}
      {step === 'results' && (
        <ResultsScreen
          file={file}
          isSample={isSample}
          period={period.applied}
          countUnshipped={period.countUnshipped}
          store={store}
          onSetups={go('setups')}
          onPeriod={go('share')}
          onCalculated={onCalculated}
          questionClosed={questionClosed}
          onQuestionClosed={onQuestionClosed}
        />
      )}
      {step !== 'share' && (
        <p className="back-link"><button type="button" className="link-btn" onClick={go('share')}>Back to the EU share</button></p>
      )}
    </>
  )
}
