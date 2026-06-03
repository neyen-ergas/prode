'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface UserOption {
  id: string
  name: string
  color: string
  has_pin: boolean
}

export default function LoginPage() {
  const router = useRouter()
  const [users, setUsers] = useState<UserOption[]>([])
  const [selected, setSelected] = useState<UserOption | null>(null)
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then(({ user }) => {
        if (user) router.replace('/predictions')
        else setChecking(false)
      })
  }, [router])

  useEffect(() => {
    if (!checking)
      fetch('/api/users')
        .then((r) => r.json())
        .then(({ users }) => setUsers(users ?? []))
  }, [checking])

  function selectUser(u: UserOption) {
    setSelected(u)
    setPin('')
    setConfirmPin('')
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selected || pin.length !== 4) return

    if (!selected.has_pin && pin !== confirmPin) {
      setError('Los PINs no coinciden')
      return
    }

    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: selected.id, pin }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Error al ingresar')
      setLoading(false)
    } else {
      router.replace('/predictions')
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isCreating = selected && !selected.has_pin
  const canSubmit = pin.length === 4 && (!isCreating || confirmPin.length === 4)

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-6xl">⚽</div>
          <h1 className="text-3xl font-bold text-white">Prode 2026</h1>
          <p className="text-gray-400 text-sm">¿Quién sos?</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => selectUser(u)}
                className={`p-3 rounded-xl border-2 text-left transition-all ${
                  selected?.id === u.id
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-gray-700 bg-gray-900 hover:border-gray-500'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-full mb-1 flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name[0].toUpperCase()}
                </div>
                <div className="text-sm font-medium text-white">{u.name}</div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="space-y-3">
              <div className="text-center text-sm text-gray-400">
                {isCreating ? (
                  <span>Primera vez, <span className="text-emerald-400 font-medium">elegí tu PIN</span></span>
                ) : (
                  <span>Hola <span className="text-white font-medium">{selected.name}</span>, ingresá tu PIN</span>
                )}
              </div>

              <input
                key={`pin-${selected.id}`}
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                placeholder={isCreating ? 'Nuevo PIN' : '• • • •'}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-emerald-500 transition"
                autoFocus
              />

              {isCreating && (
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setError('') }}
                  placeholder="Confirmar PIN"
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-center text-2xl tracking-widest focus:outline-none focus:border-emerald-500 transition"
                />
              )}

              {error && <p className="text-red-400 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={!canSubmit || loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition"
              >
                {loading ? '...' : isCreating ? 'Crear PIN y entrar' : 'Entrar'}
              </button>
            </div>
          )}
        </form>
      </div>
    </main>
  )
}
