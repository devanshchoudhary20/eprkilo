import { useEffect, useState } from 'react'
import { Layout, SampleBanner } from './components/Chrome'
import { Landing } from './components/Landing'
import { Reading, Refused } from './components/ParseMessage'
import { Privacy } from './components/Privacy'
import { ShareView } from './components/ShareView'
import { useLoader } from './hooks/useLoader'

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

export default function App() {
  const { state, loadFile, loadSample, reset } = useLoader()
  const isPrivacy = usePrivacyRoute()
  const showSampleBanner = state.phase === 'ready' && state.isSample
  const banner = showSampleBanner ? <SampleBanner onUseOwn={reset} /> : undefined

  if (isPrivacy) {
    return (
      <Layout banner={banner}>
        <Privacy />
      </Layout>
    )
  }

  return (
    <Layout banner={banner}>
      {state.phase === 'idle' && <Landing notice={state.notice} onFile={loadFile} onSample={loadSample} />}
      {state.phase === 'reading' && <Reading fileName={state.fileName} rows={state.rows} fraction={state.fraction} onCancel={reset} />}
      {state.phase === 'refused' && <Refused refusal={state.refusal} onFile={loadFile} />}
      {state.phase === 'ready' && <ShareView key={state.id} fileName={state.fileName} file={state.file} onFile={loadFile} />}
    </Layout>
  )
}
