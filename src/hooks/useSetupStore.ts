import { useCallback, useEffect, useState } from 'react'
import { SETUPS_CLEARED, emptyStore, loadStore, saveStore } from '../lib/setups'
import type { Setup, SetupStore } from '../lib/setups'

export function useSetupStore() {
  const [initial] = useState(loadStore)
  const [store, setStore] = useState<SetupStore>(initial.store)
  const unreadable = initial.unreadable

  useEffect(() => {
    saveStore(store)
  }, [store])

  useEffect(() => {
    const reset = () => setStore(emptyStore())
    window.addEventListener(SETUPS_CLEARED, reset)
    return () => window.removeEventListener(SETUPS_CLEARED, reset)
  }, [])

  const saveSetup = useCallback((setup: Setup, makeDefault: boolean) => {
    setStore((prev) => {
      const exists = prev.setups.some((item) => item.id === setup.id)
      const setups = exists ? prev.setups.map((item) => (item.id === setup.id ? setup : item)) : [...prev.setups, setup]
      const defaultId = makeDefault || !prev.defaultId ? setup.id : prev.defaultId
      return { ...prev, setups, defaultId }
    })
  }, [])

  const deleteSetup = useCallback((id: string) => {
    setStore((prev) => {
      const setups = prev.setups.filter((item) => item.id !== id)
      const gone = prev.setups.find((item) => item.id === id)
      const removed = gone ? { ...prev.removed, [id]: gone.name } : prev.removed
      return { ...prev, setups, removed, defaultId: prev.defaultId === id ? (setups[0]?.id ?? null) : prev.defaultId }
    })
  }, [])

  const setMapping = useCallback((key: string, setupId: string) => {
    setStore((prev) => ({ ...prev, mapping: { ...prev.mapping, [key]: setupId } }))
  }, [])

  const resetMapping = useCallback((keys: string[]) => {
    setStore((prev) => ({ ...prev, mapping: Object.fromEntries(Object.entries(prev.mapping).filter(([key]) => !keys.includes(key))) }))
  }, [])

  return { store, unreadable, saveSetup, deleteSetup, setMapping, resetMapping }
}
