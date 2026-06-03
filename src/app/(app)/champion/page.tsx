'use client'

import { useEffect, useState } from 'react'

export default function ChampionPage() {
  const [teams, setTeams] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [current, setCurrent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [locked, setLocked] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/champion').then((r) => r.json()),
      fetch('/api/matches').then((r) => r.json()),
    ]).then(([champData, matchData]) => {
      setCurrent(champData.champion?.team ?? null)
      const matches: Array<{ match_date: string; status: string }> = matchData.matches ?? []
      const first = matches.sort((a, b) => a.match_date.localeCompare(b.match_date))[0]
      if (first && (first.status === 'FINISHED' || new Date(first.match_date) <= new Date())) {
        setLocked(true)
      }
      const teamSet = new Set<string>()
      matches.forEach((m: any) => {
        if (m.home_team && m.home_team !== 'TBD') teamSet.add(m.home_team)
        if (m.away_team && m.away_team !== 'TBD') teamSet.add(m.away_team)
      })
      setTeams(Array.from(teamSet).sort())
      setLoading(false)
    })
  }, [])

  async function save(team: string) {
    setSaving(true)
    setMsg('')
    const res = await fetch('/api/champion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ team }),
    })
    const data = await res.json()
    if (res.ok) {
      setCurrent(team)
      setMsg('¡Guardado!')
      setTimeout(() => setMsg(''), 2000)
    } else {
      setMsg(data.error ?? 'Error al guardar')
    }
    setSaving(false)
  }

  const filtered = teams.filter((t) => t.toLowerCase().includes(search.toLowerCase()))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-xl font-bold text-white">Predicción de Campeón</h1>
        <p className="text-sm text-gray-400 mt-1">
          {locked ? 'El torneo ya comenzó, no se pueden modificar.' : 'Elegí quién va a ganar el Mundial 2026.'}
        </p>
      </div>

      {current && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-3xl">🌟</span>
          <div>
            <div className="text-xs text-yellow-400 font-semibold">Tu predicción actual</div>
            <div className="text-lg font-bold text-white">{current}</div>
          </div>
        </div>
      )}

      {msg && (
        <p className={`text-sm text-center ${msg.includes('Error') || msg.includes('torneo') ? 'text-red-400' : 'text-emerald-400'}`}>
          {msg}
        </p>
      )}

      {!locked && (
        <>
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition"
          />

          <div className="grid grid-cols-2 gap-2">
            {filtered.map((team) => (
              <button
                key={team}
                onClick={() => save(team)}
                disabled={saving}
                className={`p-3 rounded-xl border text-left text-sm font-medium transition ${
                  current === team
                    ? 'border-yellow-500 bg-yellow-500/10 text-yellow-300'
                    : 'border-gray-700 bg-gray-900 text-white hover:border-gray-500'
                }`}
              >
                {team}
              </button>
            ))}
          </div>

          {filtered.length === 0 && teams.length === 0 && (
            <p className="text-center text-gray-500 text-sm py-8">
              Primero se necesita sincronizar los equipos desde Admin.
            </p>
          )}
        </>
      )}
    </div>
  )
}
