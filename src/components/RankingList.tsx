'use client'

import { useState, useEffect } from 'react'
import type { Match, User } from '@/lib/types'
import { POINTS } from '@/lib/scoring'
import Avatar from './Avatar'
import { formatMatchDate } from '@/lib/utils'

const RANKING_ORDER_KEY = 'prode-ranking-order'
const CARD_HEIGHT_PX = 80

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

const PODIUM = [
  { ring: 'ring-1 ring-amber-400/50', medal: '🥇', shimmer: 'rgba(251,191,36,0.22)', delay: '0s' },
  { ring: 'ring-1 ring-slate-300/30', medal: '🥈', shimmer: 'rgba(203,213,225,0.16)', delay: '0.9s' },
  { ring: 'ring-1 ring-orange-600/40', medal: '🥉', shimmer: 'rgba(234,88,12,0.16)', delay: '1.8s' },
]

export default function RankingList({ ranking, currentUserId, userPredMap, matches }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [anim, setAnim] = useState<{ deltas: Record<string, number>; active: boolean }>({ deltas: {}, active: false })
  const [movement, setMovement] = useState<Record<string, number>>({})
  const leaderPoints = ranking[0]?.total_points ?? 0

  useEffect(() => {
    const currentOrder = ranking.map(e => e.user.id)
    const raw = localStorage.getItem(RANKING_ORDER_KEY)

    if (raw) {
      try {
        const prevOrder: string[] = JSON.parse(raw)
        const prevPos: Record<string, number> = {}
        prevOrder.forEach((id, i) => { prevPos[id] = i })

        const deltas: Record<string, number> = {}
        const moves: Record<string, number> = {}
        let hasMove = false
        currentOrder.forEach((id, newIdx) => {
          const oldIdx = prevPos[id]
          if (oldIdx !== undefined && oldIdx !== newIdx) {
            deltas[id] = (oldIdx - newIdx) * CARD_HEIGHT_PX
            moves[id] = oldIdx - newIdx
            hasMove = true
          }
        })

        setMovement(moves)

        if (hasMove) {
          const doAnimate = () => {
            setAnim({ deltas, active: false })
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                setAnim({ deltas, active: true })
              })
            })
          }
          // Wait for splash to end; fallback 150ms if no splash is showing
          const fallback = setTimeout(doAnimate, 150)
          window.addEventListener('splashend', () => {
            clearTimeout(fallback)
            doAnimate()
          }, { once: true })
        }
      } catch { /* corrupt storage */ }
    }

    localStorage.setItem(RANKING_ORDER_KEY, JSON.stringify(currentOrder))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
        const podium = i < 3 ? PODIUM[i] : null
        const gap = leaderPoints - entry.total_points

        const delta = anim.deltas[entry.user.id]
        const cardMotionStyle: React.CSSProperties = delta !== undefined
          ? {
              transform: anim.active ? undefined : `translateY(${delta}px)`,
              transition: anim.active ? 'transform 0.65s cubic-bezier(0.34, 1.4, 0.64, 1)' : 'none',
              zIndex: anim.active ? 10 : undefined,
            }
          : {}

        return (
          <div
            key={entry.user.id}
            className={`relative rounded-2xl overflow-hidden ${
              podium ? podium.ring : isMe ? 'border border-emerald-500/30' : ''
            }`}
            style={{
              ...(i === 0 ? { animation: 'glow-gold 2.2s ease-in-out infinite' } : {}),
              ...cardMotionStyle,
            }}
          >
            {podium && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                <div
                  className="absolute inset-y-0 w-1/2 animate-[shimmer_2.8s_ease-in-out_infinite]"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${podium.shimmer}, transparent)`,
                    animationDelay: podium.delay,
                  }}
                />
              </div>
            )}
            {/* Row principal */}
            <button
              onClick={() => toggleUser(entry.user.id)}
              className={`w-full flex items-center gap-3 p-4 text-left transition-colors ${
                isMe ? 'bg-emerald-500/10' : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              <div className="w-7 flex flex-col items-center justify-center shrink-0">
                {podium
                  ? <span className={`text-xl ${i === 0 ? 'text-2xl' : ''}`}>{podium.medal}</span>
                  : <span className="text-gray-500 text-sm font-bold">{i + 1}</span>
                }
                {!!movement[entry.user.id] && (
                  <span
                    className={`text-[9px] font-bold leading-none mt-0.5 tabular-nums ${
                      movement[entry.user.id] > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {movement[entry.user.id] > 0 ? '▲' : '▼'}{Math.abs(movement[entry.user.id])}
                  </span>
                )}
              </div>

              <Avatar name={entry.user.name} color={entry.user.color} emoji={entry.user.emoji} size="lg" />

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-white text-sm flex items-center gap-1.5">
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
                  {i === 0 && leaderPoints > 0 && (
                    <div className="text-xs text-amber-400 font-medium">líder</div>
                  )}
                  {i > 0 && gap > 0 && (
                    <div className="text-xs text-red-400/70 font-medium tabular-nums">-{gap}</div>
                  )}
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
