import { useCallback, useRef, useState } from 'react'
import { usePeriodState } from '../hooks/usePeriodState'
import { useSetupStore } from '../hooks/useSetupStore'
import type { ItemsFile } from '../lib/parse'
import { track } from '../lib/track'
import { MappingScreen } from './MappingScreen'
import { ResultsScreen } from './ResultsScreen'
import { SetupsScreen } from './SetupsScreen'
import { ShareView } from './ShareView'

type Step = 'share' | 'setups' | 'mapping' | 'results'
type Props = { fileName: string; file: ItemsFile; isSample: boolean; onFile: (file: File) => void }

export function Workspace({ fileName, file, isSample, onFile }: Props) {
  const [step, setStep] = useState<Step>('share')
  const period = usePeriodState(file)
  const { store, unreadable, saveSetup, deleteSetup, setMapping, resetMapping } = useSetupStore()

  const [questionClosed, setQuestionClosed] = useState(false)
  const calculated = useRef(false)
  const onCalculated = useCallback(() => {
    if (calculated.current) return
    calculated.current = true
    track('calculated')
  }, [])

  const go = (next: Step) => () => {
    setStep(next)
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
          onQuestionClosed={() => setQuestionClosed(true)}
        />
      )}
      {step !== 'share' && (
        <p className="back-link"><button type="button" className="link-btn" onClick={go('share')}>Back to the EU share</button></p>
      )}
    </>
  )
}
