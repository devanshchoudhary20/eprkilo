import { useSyncExternalStore } from 'react'
import { readHash, subscribeHash } from '../lib/route'

export const useHash = () => useSyncExternalStore(subscribeHash, readHash)
