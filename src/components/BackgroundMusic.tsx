'use client'

import { useEffect, useRef, useState } from 'react'
import { MusicContext } from '@/contexts/MusicContext'

export default function BackgroundMusic({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [muted, setMuted] = useState(false)

  useEffect(() => {
    const audio = new Audio('/never-meant-to-belong.mp3')
    audio.volume = 0.35
    audioRef.current = audio

    audio.play().catch(() => {
      const onInteract = () => {
        audio.play()
        document.removeEventListener('click', onInteract)
        document.removeEventListener('touchstart', onInteract)
      }
      document.addEventListener('click', onInteract)
      document.addEventListener('touchstart', onInteract)
    })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  function toggleMute() {
    if (!audioRef.current) return
    const next = !muted
    audioRef.current.muted = next
    setMuted(next)
  }

  return (
    <MusicContext.Provider value={{ active: true, muted, toggleMute }}>
      {children}
    </MusicContext.Provider>
  )
}
