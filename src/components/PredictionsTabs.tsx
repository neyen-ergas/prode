'use client'

import { useState } from 'react'
import MatchCard from './MatchCard'
import type { Match, Prediction } from '@/lib/types'

interface Props {
  grouped: { date: string; label: string; matches: Match[] }[]
  predMap: Record<string, Prediction>
}

export default function PredictionsTabs({ grouped, predMap }: Props) {
  const initialTab = () => {
    const now = new Date()
    const upcoming = grouped.find((g) => g.matches.some((m) => new Date(m.match_date) >= now))
    return upcoming?.date ?? grouped[0]?.date ?? ''
  }

  const [active, setActive] = useState<string>(initialTab)

  const current = grouped.find((g) => g.date === active)

  return (
    <div className="flex flex-col h-full">
      {/* Tabs scroll */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none border-b border-gray-800 shrink-0">
        {grouped.map((g) => {
          const hasUnfinished = g.matches.some((m) => m.status !== 'FINISHED')
          const isActive = g.date === active
          return (
            <button
              key={g.date}
              onClick={() => setActive(g.date)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {g.label}
              {hasUnfinished && !isActive && (
                <span className="ml-1 w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block align-middle" />
              )}
            </button>
          )
        })}
      </div>

      {/* Matches */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {current?.matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            prediction={predMap[match.id] ?? null}
          />
        ))}
      </div>
    </div>
  )
}
