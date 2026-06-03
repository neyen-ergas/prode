'use client'

import { useState, useTransition } from 'react'
import type { Match, Prediction, User } from '@/lib/types'
import { formatMatchDate, isMatchLocked } from '@/lib/utils'
import { POINTS } from '@/lib/scoring'

type PredEntry = { home_score: number; away_score: number; points: number | null }

interface Props {
  match: Match
  prediction: Prediction | null
  allPreds: Record<string, PredEntry>
  users: User[]
  currentUserId: string
}

export default function MatchCard({ match, prediction: initialPred, allPreds, users, currentUserId }: Props) {
  const locked = isMatchLocked(match.match_date, match.status)
  const [home, setHome] = useState(initialPred?.home_score?.toString() ?? '')
  const [away, setAway] = useState(initialPred?.away_score?.toString() ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasResult = match.status === 'FINISHED' && match.home_score !== null

  function handleSave() {
    if (locked || home === '' || away === '') return
    setError('')
    startTransition(async () => {
      const res = await fetch('/api/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id, homeScore: parseInt(home), awayScore: parseInt(away) }),
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
    if (p === POINTS.EXACT_SCORE) return <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-medium">+{p} exacto</span>
    if (p === POINTS.CORRECT_RESULT) return <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">+{p} resultado</span>
    return <span className="text-xs bg-gray-700 text-gray-500 px-2 py-0.5 rounded-full">0 pts</span>
  }

  const usersWithPred = users.filter((u) => allPreds[u.id])
  const predCount = usersWithPred.length

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden">
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatMatchDate(match.match_date)}</span>
          <div className="flex items-center gap-2">
            {pointsBadge()}
            {match.group_name && <span>{match.group_name}</span>}
          </div>
        </div>

        {/* Teams + score */}
        <div className="flex items-center gap-3">
          <div className="flex-1 text-center">
            {match.home_team_crest && (
              <img src={match.home_team_crest} alt="" className="w-8 h-8 object-contain mx-auto mb-1" />
            )}
            <div className="text-sm font-semibold text-white leading-tight">{match.home_team}</div>
          </div>

          <div className="shrink-0">
            {hasResult ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-white">{match.home_score}</span>
                <span className="text-gray-600">-</span>
                <span className="text-2xl font-bold text-white">{match.away_score}</span>
              </div>
            ) : (
              <span className="text-gray-600 text-sm font-mono px-2">vs</span>
            )}
          </div>

          <div className="flex-1 text-center">
            {match.away_team_crest && (
              <img src={match.away_team_crest} alt="" className="w-8 h-8 object-contain mx-auto mb-1" />
            )}
            <div className="text-sm font-semibold text-white leading-tight">{match.away_team}</div>
          </div>
        </div>

        {/* My prediction inputs */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <input
              type="number" min="0" max="99" value={home}
              onChange={(e) => setHome(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              disabled={locked}
              placeholder="–"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>
          <span className="text-gray-600 font-bold">-</span>
          <div className="flex-1">
            <input
              type="number" min="0" max="99" value={away}
              onChange={(e) => setAway(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
              disabled={locked}
              placeholder="–"
              className="w-full bg-gray-800 border border-gray-700 rounded-xl py-2 text-center text-xl font-bold text-white focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
            />
          </div>

          {!locked ? (
            <button
              onClick={handleSave}
              disabled={home === '' || away === '' || isPending}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
                saved ? 'bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40'
              }`}
            >
              {saved ? '✓' : isPending ? '...' : 'Guardar'}
            </button>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-600">
              {hasResult ? '—' : 'Cerrado'}
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {/* Toggle ver pronósticos */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition flex items-center justify-center gap-1 pt-1"
        >
          {showAll ? '▲ Ocultar' : `▼ Ver pronósticos (${predCount}/${users.length})`}
        </button>
      </div>

      {/* All predictions expanded */}
      {showAll && (
        <div className="border-t border-gray-800 divide-y divide-gray-800">
          {users.map((u) => {
            const pred = allPreds[u.id]
            const isMe = u.id === currentUserId
            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-emerald-500/5' : ''}`}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name[0].toUpperCase()}
                </div>
                <span className={`text-sm flex-1 ${isMe ? 'text-white font-medium' : 'text-gray-300'}`}>
                  {u.name}
                </span>
                {pred ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white tabular-nums">
                      {pred.home_score} – {pred.away_score}
                    </span>
                    {hasResult && pred.points !== null && (
                      pred.points === POINTS.EXACT_SCORE
                        ? <span className="text-emerald-400 text-xs font-medium">+{pred.points}</span>
                        : pred.points === POINTS.CORRECT_RESULT
                        ? <span className="text-yellow-400 text-xs font-medium">+{pred.points}</span>
                        : <span className="text-gray-600 text-xs">0</span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-600 text-xs italic">sin pronóstico</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
