'use client'

import { useState, useTransition } from 'react'
import type { Match, Prediction, User } from '@/lib/types'
import { formatMatchDate, isMatchLocked } from '@/lib/utils'
import Avatar from './Avatar'
import { POINTS } from '@/lib/scoring'
import { getFlagUrl } from '@/lib/flags'
import { getTeamName } from '@/lib/translations'

type PredEntry = { home_score: number; away_score: number; points: number | null }

interface Props {
  match: Match
  prediction: Prediction | null
  allPreds: Record<string, PredEntry>
  users: User[]
  currentUserId: string
  onSaved: (matchId: string, home: number, away: number) => void
  language?: string
}

const SPARKLE_POSITIONS = ['8%', '24%', '44%', '64%', '82%']

export default function MatchCard({ match, prediction: initialPred, allPreds, users, currentUserId, onSaved, language = 'en' }: Props) {
  const locked = isMatchLocked(match.match_date, match.status)
  const [home, setHome] = useState(initialPred?.home_score?.toString() ?? '')
  const [away, setAway] = useState(initialPred?.away_score?.toString() ?? '')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [showAll, setShowAll] = useState(false)
  const [isPending, startTransition] = useTransition()

  const hasResult = match.status === 'FINISHED' && match.home_score !== null
  const isExact = hasResult && initialPred?.points === POINTS.EXACT_SCORE
  const homeFlagUrl = getFlagUrl(match.home_team)
  const awayFlagUrl = getFlagUrl(match.away_team)
  const homeName = getTeamName(match.home_team, language)
  const awayName = getTeamName(match.away_team, language)

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
        onSaved(match.id, parseInt(home), parseInt(away))
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

  const allPredsArr = Object.values(allPreds)
  const predCount = allPredsArr.length

  const cardRing = hasResult && initialPred
    ? initialPred.points === POINTS.EXACT_SCORE
      ? 'ring-1 ring-emerald-500/40'
      : initialPred.points === POINTS.CORRECT_RESULT
      ? 'ring-1 ring-yellow-500/30'
      : 'ring-1 ring-red-800/25'
    : ''

  return (
    <div className={`bg-gray-900 rounded-2xl overflow-hidden relative ${cardRing}`}>
      {/* Sparkles para resultado exacto */}
      {isExact && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {SPARKLE_POSITIONS.map((left, i) => (
            <span
              key={i}
              className="absolute text-base"
              style={{
                left,
                bottom: '35%',
                animation: `sparkle-up 1.3s ease-out ${i * 0.12}s forwards`,
              }}
            >
              ✨
            </span>
          ))}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{formatMatchDate(match.match_date)}</span>
          <div className="flex items-center gap-2">
            {pointsBadge()}
            {match.group_name && <span>{match.group_name}</span>}
          </div>
        </div>

        {/* Equipos + marcador/inputs en el mismo row */}
        <div className="flex items-center gap-2">
          <div className="flex-1 text-center">
            {homeFlagUrl && <img src={homeFlagUrl} alt="" className="w-9 h-6 object-cover mx-auto mb-1 rounded-sm" />}
            <div className="text-xs font-semibold text-white leading-tight">{homeName}</div>
          </div>

          <div className="shrink-0">
            {hasResult ? (
              <div className="flex items-center gap-2 px-1">
                <span className="text-3xl font-bold text-white tabular-nums">{match.home_score}</span>
                <span className="text-gray-600 text-xl">—</span>
                <span className="text-3xl font-bold text-white tabular-nums">{match.away_score}</span>
              </div>
            ) : locked ? (
              <span className="text-gray-600 text-xs px-2">🔒</span>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number" min="0" max="99" value={home}
                  onChange={(e) => { setHome(e.target.value.replace(/[^0-9]/g, '').slice(0, 2)); setError('') }}
                  placeholder="–"
                  className="w-14 h-12 bg-gray-800 border border-gray-700 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                />
                <span className="text-gray-500 font-bold">—</span>
                <input
                  type="number" min="0" max="99" value={away}
                  onChange={(e) => { setAway(e.target.value.replace(/[^0-9]/g, '').slice(0, 2)); setError('') }}
                  placeholder="–"
                  className="w-14 h-12 bg-gray-800 border border-gray-700 rounded-xl text-center text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 transition"
                />
              </div>
            )}
          </div>

          <div className="flex-1 text-center">
            {awayFlagUrl && <img src={awayFlagUrl} alt="" className="w-9 h-6 object-cover mx-auto mb-1 rounded-sm" />}
            <div className="text-xs font-semibold text-white leading-tight">{awayName}</div>
          </div>
        </div>

        {/* Botón guardar */}
        {!hasResult && !locked && (
          <button
            onClick={handleSave}
            disabled={home === '' || away === '' || isPending}
            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${
              saved
                ? 'bg-emerald-600 text-white animate-[check-pop_0.35s_ease]'
                : 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-40'
            }`}
          >
            {saved ? '✓ Guardado' : isPending ? '...' : 'Guardar'}
          </button>
        )}

        {error && <p className="text-red-400 text-xs text-center">{error}</p>}

        {/* Toggle ver pronósticos */}
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-xs text-gray-500 hover:text-gray-300 transition flex items-center justify-center gap-1 pt-1"
        >
          {showAll ? '▲ Ocultar' : `▼ Ver pronósticos (${predCount}/${users.length})`}
        </button>
      </div>

      {/* Pronósticos expandidos */}
      {showAll && (
        <div className="border-t border-gray-800 divide-y divide-gray-800">
          {users.map((u) => {
            const pred = allPreds[u.id]
            const isMe = u.id === currentUserId
            const showScore = locked || isMe

            return (
              <div
                key={u.id}
                className={`flex items-center gap-3 px-4 py-2.5 ${isMe ? 'bg-emerald-500/5' : ''}`}
              >
                <Avatar name={u.name} color={u.color} emoji={u.emoji} size="sm" />
                <span className={`text-sm flex-1 ${isMe ? 'text-white font-medium' : 'text-gray-300'}`}>
                  {u.name}
                </span>
                {pred ? (
                  showScore ? (
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
                    <span className="text-emerald-500 text-base" title="Ya cargó su pronóstico">✓</span>
                  )
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
