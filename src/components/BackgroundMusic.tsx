'use client'

import { useEffect, useRef, useState } from 'react'

export default function BackgroundMusic() {
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
    <button
      onClick={toggleMute}
      title={muted ? 'Activar música' : 'Silenciar música'}
      className="fixed bottom-5 right-4 z-50 w-9 h-9 rounded-full bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 flex items-center justify-center text-base transition hover:bg-gray-700/80 active:scale-95"
    >
      {muted ? '🔇' : '🎵'}
    </button>
  )
}
