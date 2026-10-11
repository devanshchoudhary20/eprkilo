import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Layout, SampleBanner } from './components/Chrome'
import { Landing } from './components/Landing'
import { Reading, Refused } from './components/ParseMessage'
import { Privacy } from './components/Privacy'
import { Workspace } from './components/Workspace'
import { useLoader } from './hooks/useLoader'
import type { LoadState } from './hooks/useLoader'

const isPrivacyHash = () => window.location.hash === '#privacy'

function usePrivacyRoute() {
  const [isPrivacy, setIsPrivacy] = useState(isPrivacyHash)
  useEffect(() => {
    const sync = () => setIsPrivacy(isPrivacyHash())
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  return isPrivacy
}

type Handlers = { onFile: (file: File) => void; onSample: () => void; onCancel: () => void; questionClosed: boolean; onQuestionClosed: () => void }

function screenFor(state: LoadState, { onFile, onSample, onCancel, questionClosed, onQuestionClosed }: Handlers): ReactNode {
  switch (state.phase) {
    case 'idle':
      return <Landing notice={state.notice} onFile={onFile} onSample={onSample} />
    case 'reading':
      return <Reading fileName={state.fileName} rows={state.rows} fraction={state.fraction} onCancel={onCancel} />
    case 'refused':
      return <Refused refusal={state.refusal} onFile={onFile} />
    case 'ready':
      return <Workspace key={state.id} fileName={state.fileName} file={state.file} isSample={state.isSample} onFile={onFile} questionClosed={questionClosed} onQuestionClosed={onQuestionClosed} />
  }
}

export default function App() {
  const { state, loadFile, loadSample, reset } = useLoader()
  const isPrivacy = usePrivacyRoute()
  const [questionClosed, setQuestionClosed] = useState(false)
  const showSampleBanner = state.phase === 'ready' && state.isSample
  const banner = showSampleBanner ? <SampleBanner onUseOwn={reset} /> : undefined
  const screen = screenFor(state, { onFile: loadFile, onSample: loadSample, onCancel: reset, questionClosed, onQuestionClosed: () => setQuestionClosed(true) })

  // the screen stays mounted under Privacy so the period and checkbox survive the round trip
  return (
    <Layout banner={banner}>
      {isPrivacy && <Privacy />}
      <div hidden={isPrivacy}>{screen}</div>
    </Layout>
  )
}
