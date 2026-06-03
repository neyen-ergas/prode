'use client'

import { useState } from 'react'

const EMOJIS = [
  '😎','🤩','🥳','😏','🤓','👻','🤖','🦸','🧙','🥷','👑','🦁',
  '🐯','🦊','🐺','🐻','🐼','🐨','🦄','🐸','🐙','🦅','🦋','🐉',
  '⚽','🏆','🎯','🚀','🌟','🔥','💎','🎪',
]

interface Props {
  current: string | null
  onSelect: (emoji: string) => Promise<void>
  onClose: () => void
}

export default function EmojiPicker({ current, onSelect, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  async function pick(emoji: string) {
    setLoading(true)
    await onSelect(emoji)
    setLoading(false)
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Bottom sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 rounded-t-2xl p-5 pb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Elegí tu avatar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">×</button>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => pick(e)}
              disabled={loading}
              className={`text-2xl h-10 rounded-xl flex items-center justify-center transition-all ${
                current === e
                  ? 'bg-emerald-600 scale-110'
                  : 'bg-gray-800 hover:bg-gray-700 active:scale-95'
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {current && (
          <button
            onClick={() => pick('')}
            disabled={loading}
            className="mt-4 w-full text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Quitar emoji (usar inicial)
          </button>
        )}
      </div>
    </>
  )
}
