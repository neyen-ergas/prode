'use client'

import { useEffect, useState } from 'react'
import type { User } from '@/lib/types'

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [name, setName] = useState('')
  const [pin, setPin] = useState('')
  const [addError, setAddError] = useState('')
  const [addLoading, setAddLoading] = useState(false)
  const [syncLoading, setSyncLoading] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [resetUserId, setResetUserId] = useState('')
  const [newPin, setNewPin] = useState('')

  useEffect(() => {
    loadUsers()
  }, [])

  async function loadUsers() {
    const res = await fetch('/api/users')
    const data = await res.json()
    setUsers(data.users ?? [])
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || pin.length !== 4) return
    setAddLoading(true)
    setAddError('')
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), pin }),
    })
    const data = await res.json()
    if (res.ok) {
      setName('')
      setPin('')
      loadUsers()
    } else {
      setAddError(data.error ?? 'Error')
    }
    setAddLoading(false)
  }

  async function deleteUser(userId: string, userName: string) {
    if (!confirm(`¿Eliminar a ${userName}? Se borrarán todas sus predicciones.`)) return
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    loadUsers()
  }

  async function resetPin(e: React.FormEvent) {
    e.preventDefault()
    if (!resetUserId || newPin.length !== 4) return
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: resetUserId, pin: newPin }),
    })
    if (res.ok) {
      setResetUserId('')
      setNewPin('')
      alert('PIN actualizado')
    }
  }

  async function syncMatches() {
    setSyncLoading(true)
    setSyncMsg('')
    const res = await fetch('/api/admin/sync', { method: 'POST' })
    const data = await res.json()
    if (res.ok) {
      setSyncMsg(`✓ ${data.synced} partidos sincronizados, ${data.scored} puntuados`)
    } else {
      setSyncMsg(`Error: ${data.error}`)
    }
    setSyncLoading(false)
  }

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-xl font-bold text-white">Administración</h1>

      {/* Sync */}
      <section className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-white">Sincronizar Partidos</h2>
        <p className="text-xs text-gray-400">
          Actualiza los partidos desde football-data.org y recalcula los puntos de los partidos terminados.
        </p>
        <button
          onClick={syncMatches}
          disabled={syncLoading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
        >
          {syncLoading ? 'Sincronizando...' : 'Sincronizar ahora'}
        </button>
        {syncMsg && (
          <p className={`text-sm text-center ${syncMsg.startsWith('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
            {syncMsg}
          </p>
        )}
      </section>

      {/* Add user */}
      <section className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-white">Agregar Participante</h2>
        <form onSubmit={addUser} className="space-y-3">
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition"
          />
          <input
            type="number"
            placeholder="PIN (4 dígitos)"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition"
          />
          {addError && <p className="text-red-400 text-sm">{addError}</p>}
          <button
            type="submit"
            disabled={!name.trim() || pin.length !== 4 || addLoading}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition"
          >
            {addLoading ? 'Agregando...' : 'Agregar'}
          </button>
        </form>
      </section>

      {/* Users list */}
      <section className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-white">Participantes ({users.length})</h2>
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: u.color }}
              >
                {u.name[0].toUpperCase()}
              </div>
              <span className="flex-1 text-sm text-white">{u.name}</span>

              <button
                onClick={() => deleteUser(u.id, u.name)}
                className="text-xs text-red-400 hover:text-red-300 transition"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Reset PIN */}
      <section className="bg-gray-900 rounded-2xl p-4 space-y-3">
        <h2 className="font-semibold text-white">Resetear PIN</h2>
        <form onSubmit={resetPin} className="space-y-3">
          <select
            value={resetUserId}
            onChange={(e) => setResetUserId(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="">Seleccionar participante</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Nuevo PIN (4 dígitos)"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            inputMode="numeric"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={!resetUserId || newPin.length !== 4}
            className="w-full bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl transition"
          >
            Actualizar PIN
          </button>
        </form>
      </section>
    </div>
  )
}
