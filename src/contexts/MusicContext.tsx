'use client'

import { createContext, useContext } from 'react'

interface MusicContextValue {
  active: boolean
  muted: boolean
  toggleMute: () => void
}

export const MusicContext = createContext<MusicContextValue>({
  active: false,
  muted: false,
  toggleMute: () => {},
})

export function useMusicContext() {
  return useContext(MusicContext)
}
