'use client'

import { useState } from 'react'
import type { Match, User } from '@/lib/types'
import { POINTS } from '@/lib/scoring'
import { formatMatchDate } from '@/lib/utils'

type PredRow = { home_score: number; away_score: number; points: number | null }

interface RankingEntry {
  user: User
  total_points: number
  exact_scores: number
  correct_results: number
  predictions_count: number
}

interface Props {
  ranking: RankingEntry[]
  currentUserId: string
  userPredMap: Record<string, Record<string, PredRow>>  // userId -> matchId -> pred
  matches: Match[]
}

export default function RankingList({ ranking, currentUserId, userPredMap, matches }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const medals = ['🥇', '🥈', '🥉']

  const matchMap = new Map(matches.map((m) => [m.id, m]))
  const finishedMatches = matches.filter((m) => m.status === 'FINISHED')

  function toggleUser(userId: string) {
    setExpanded((prev) => (prev === userId ? null : userId))
  }

  return (
    <div className="space-y-2">
      {ranking.map((entry, i) => {
        const isMe = entry.user.id === currentUserId
        const isExpanded = expanded === entry.user.id
        const preds = userPredMap[entry.user.id] ?? {}

        return (
          <div
            key={entry.user.id}
            className={`rounded-2xl overflow-hidden ${isMe ? 'border border-emerald-500/30' : ''}`}
          >
            {/* Row principal */}
            <button
              onClick={() => toggleUser(entry.user.id)}
              className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                isMe ? 'bg-emerald-500/10' : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              <div className="w-7 text-center text-xl shrink-0">
                {i < 3 ? medals[i] : <span className="text-gray-500 text-sm font-bold">{i + 1}</span>}
              </div>

              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: entry.user.color }}
              >
                {entry.user.name[0].toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm flex items-center gap-1">
                  {entry.user.name}
                  {isMe && <span className="text-xs text-emerald-400">(vos)</span>}
                </div>
                <div className="text-xs text-gray-500 flex gap-2 mt-0.5">
                  <span>{entry.predictions_count} pred.</span>
                  <span>✓✓ {entry.exact_scores}</span>
                  <span>✓ {entry.correct_results}</span>
                </div>
              </div>

              <div className="text-right shrink-0 flex items-center gap-2">
                <div>
                  <div className="text-2xl font-bold text-white">{entry.total_points}</div>
                  <div className="text-xs text-gray-500">pts</div>
                </div>
                <span className={`text-gray-500 text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
              </div>
            </button>

            {/* Predictions expandidas */}
            {isExpanded && (
              <div className="border-t border-gray-800 bg-gray-900/50">
                {finishedMatches.length === 0 && (
                  <p className="text-center text-gray-600 text-xs py-4">
                    Aún no hay partidos jugados.
                  </p>
                )}
                {finishedMatches.map((match) => {
                  const pred = preds[match.id]
                  return (
                    <div key={match.id} className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-800/50 last:border-0">
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">
                          {match.home_team} vs {match.away_team}
                        </div>
                        <div className="text-xs text-gray-500">{formatMatchDate(match.match_date)}</div>
                      </div>

                      {/* Resultado real */}
                      <div className="text-xs text-gray-400 font-mono shrink-0">
                        {match.home_score}–{match.away_score}
                      </div>

                      {/* Predicción */}
                      {pred ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-sm font-bold text-white tabular-nums">
                            {pred.home_score}–{pred.away_score}
                          </span>
                          {pred.points === POINTS.EXACT_SCORE && (
                            <span className="text-emerald-400 text-xs font-medium">+{pred.points}</span>
                          )}
                          {pred.points === POINTS.CORRECT_RESULT && (
                            <span className="text-yellow-400 text-xs font-medium">+{pred.points}</span>
                          )}
                          {pred.points === 0 && (
                            <span className="text-gray-600 text-xs">0</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-600 text-xs italic shrink-0">—</span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
