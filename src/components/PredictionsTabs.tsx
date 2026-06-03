'use client'

import { useState } from 'react'
import MatchCard from './MatchCard'
import type { Match, Prediction, User } from '@/lib/types'

type PredEntry = { home_score: number; away_score: number; points: number | null }

interface Props {
  grouped: { date: string; label: string; matches: Match[] }[]
  predMap: Record<string, Prediction>
  allPredMap: Record<string, Record<string, PredEntry>>
  users: User[]
  currentUserId: string
}

export default function PredictionsTabs({ grouped, predMap: initialPredMap, allPredMap, users, currentUserId }: Props) {
  const initialTab = () => {
    const now = new Date()
    const upcoming = grouped.find((g) => g.matches.some((m) => new Date(m.match_date) >= now))
    return upcoming?.date ?? grouped[0]?.date ?? ''
  }

  const [active, setActive] = useState<string>(initialTab)
  // Mantiene las predicciones guardadas en esta sesión para que persistan al cambiar de tab
  const [savedPreds, setSavedPreds] = useState<Record<string, { home: number; away: number }>>({})

  const current = grouped.find((g) => g.date === active)

  function handleSaved(matchId: string, home: number, away: number) {
    setSavedPreds((prev) => ({ ...prev, [matchId]: { home, away } }))
  }

  function getPrediction(matchId: string): Prediction | null {
    const saved = savedPreds[matchId]
    if (saved) {
      const base = initialPredMap[matchId]
      return {
        ...(base ?? { id: '', user_id: currentUserId, match_id: matchId, points: null, updated_at: '' }),
        home_score: saved.home,
        away_score: saved.away,
      }
    }
    return initialPredMap[matchId] ?? null
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none border-b border-gray-800 shrink-0">
        {grouped.map((g) => {
          const isActive = g.date === active
          return (
            <button
              key={g.date}
              onClick={() => setActive(g.date)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {g.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {current?.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={getPrediction(match.id)}
            allPreds={allPredMap[match.id] ?? {}}
            users={users}
            currentUserId={currentUserId}
            onSaved={handleSaved}
          />
        ))}
      </div>
    </div>
  )
}
