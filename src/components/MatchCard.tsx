'use client'

import { useState, useTransition } from 'react'
import type { Match, Prediction } from '@/lib/types'
import { formatMatchDate, isMatchLocked } from '@/lib/utils'
import { POINTS } from '@/lib/scoring'

interface Props {
  match: Match
  prediction: Prediction | null
}

export default function MatchCard({ match, prediction: initialPred }: Props) {
  const locked = isMatchLocked(match.match_date, match.status)
  const [home, setHome] = useState(initialPred?.home_score?.toString() ?? '')
  const [away, setAway] = useState(initialPred?.away_score?.toString() ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  const hasResult = match.status === 'FINISHED' && match.home_score !== null

  function handleSave() {
    if (locked || home === '' || away === '') return
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId: match.id,
          homeScore: parseInt(home),
          awayScore: parseInt(away),
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      } else {
        const d = await res.json()
        setError(d.error ?? 'Error al guardar')
      }
    })
  }

  function pointsBadge() {
    if (!initialPred || initialPred.points === null || !hasResult) return null
    const p = initialPred.points
    if (p === POINTS.EXACT_SCORE) return <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">+{p} exacto</span>
    if (p === POINTS.CORRECT_RESULT) return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">+{p} resultado</span>
    return <span className="text-xs bg-gray-700 text-gray-400 px-2 py-0.5 rounded-full">0 pts</span>
  }

  return (
    <div className={`bg-gray-900 rounded-2xl p-4 space-y-3 ${locked ? 'opacity-80' : ''}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>{formatMatchDate(match.match_date)}</span>
        {pointsBadge()}
        {match.group_name && <span>{match.group_name}</span>}
      </div>

      <div className="flex items-center gap-3">
        {/* Home team */}
        <div className="flex-1 text-center">
          {match.home_team_crest && (
            <img src={match.home_team_crest} alt="" className="w-8 h-8 object-contain mx-auto mb-1" />
          )}
          <div className="text-sm font-semibold text-white leading-tight">{match.home_team}</div>
        </div>

        {/* Score area */}
        <div className="flex items-center gap-2 shrink-0">
          {hasResult ? (
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-white">{match.home_score}</span>
              <span className="text-gray-500">-</span>
              <span className="text-2xl font-bold text-white">{match.away_score}</span>
            </div>
          ) : (
            <span className="text-gray-600 text-sm font-mono">vs</span>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 text-center">
          {match.away_team_crest && (
            <img src={match.away_team_crest} alt="" className="w-8 h-8 object-contain mx-auto mb-1" />
          )}
          <div className="text-sm font-semibold text-white leading-tight">{match.away_team}</div>
        </div>
      </div>

      {/* Prediction inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1 text-center">
          <input
            type="number"
            min="0"
            max="99"
            value={home}
            onChange={(e) => setHome(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            disabled={locked}
            placeholder="–"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
        </div>
        <span className="text-gray-600 text-lg font-bold">-</span>
        <div className="flex-1 text-center">
          <input
            type="number"
            min="0"
            max="99"
            value={away}
            onChange={(e) => setAway(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
            disabled={locked}
            placeholder="–"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          />
        </div>

        {!locked && (
          <button
            onClick={handleSave}
            disabled={home === '' || away === '' || isPending}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40'
            }`}
          >
            {saved ? '✓' : isPending ? '...' : 'Guardar'}
          </button>
        )}

        {locked && !hasResult && (
          <span className="text-xs text-gray-600 px-2">Cerrado</span>
        )}
      </div>

      {error && <p className="text-red-400 text-xs text-center">{error}</p>}
    </div>
  )
}
