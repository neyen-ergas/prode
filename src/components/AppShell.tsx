'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@/lib/types'
import Avatar from './Avatar'
import EmojiPicker from './EmojiPicker'
import SplashScreen from './SplashScreen'

interface Props {
  user: User
  children: React.ReactNode
}

export default function AppShell({ user, children }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [emoji, setEmoji] = useState<string | null>(user.emoji)
  const [showPicker, setShowPicker] = useState(false)

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.replace('/')
  }

  async function saveEmoji(newEmoji: string) {
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emoji: newEmoji }),
    })
    setEmoji(newEmoji || null)
    setShowPicker(false)
  }

  const navItems = [
    { href: '/predictions', label: 'Predicciones', icon: '⚽' },
    { href: '/ranking', label: 'Ranking', icon: '🏆' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      <SplashScreen name={user.name} />
      <header className="sticky top-0 z-10 bg-gray-950/90 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-2 active:opacity-70 transition"
        >
          <Avatar name={user.name} color={user.color} emoji={emoji} size="md" />
          <span className="text-sm font-medium text-white">{user.name}</span>
          <span className="text-xs text-gray-600">✏️</span>
        </button>
        <button onClick={logout} className="text-xs text-gray-500 hover:text-gray-300 transition">
          Salir
        </button>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-950/95 backdrop-blur border-t border-gray-800 flex">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center gap-0.5 py-3 text-xs transition-colors ${
                active ? 'text-emerald-400' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="text-xl leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {showPicker && (
        <EmojiPicker
          current={emoji}
          onSelect={saveEmoji}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  )
}
