'use client'

import { useMusicContext } from '@/contexts/MusicContext'

export default function MusicButton() {
  const { active, muted, toggleMute } = useMusicContext()
  if (!active) return null

  return (
    <button
      onClick={toggleMute}
      className="w-full py-2.5 rounded-xl text-sm font-semibold bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition flex items-center justify-center gap-2"
    >
      {muted ? '🔊 Activar música' : '🔇 Pausar música'}
    </button>
  )
}
