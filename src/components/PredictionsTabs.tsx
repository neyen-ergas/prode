'use client'

import { useState } from 'react'
import MatchCard from './MatchCard'
import MusicButton from './MusicButton'
import type { Match, Prediction, User } from '@/lib/types'
import { isMatchLocked } from '@/lib/utils'

type PredEntry = { home_score: number; away_score: number; points: number | null }

const PENDING_TAB = '__pending__'

interface Props {
  grouped: { date: string; label: string; matches: Match[] }[]
  predMap: Record<string, Prediction>
  allPredMap: Record<string, Record<string, PredEntry>>
  users: User[]
  currentUserId: string
}

export default function PredictionsTabs({ grouped, predMap: initialPredMap, allPredMap, users, currentUserId }: Props) {
  const [savedPreds, setSavedPreds] = useState<Record<string, { home: number; away: number }>>({})
  const [pastTabsOpen, setPastTabsOpen] = useState(false)

  function isPlaceholder(team: string): boolean {
    return /winner|loser|round of|quarterfinal|semifinal|tbd|place|group [a-z]/i.test(team)
  }

  function isPending(match: Match): boolean {
    if (isMatchLocked(match.match_date, match.status)) return false
    if (isPlaceholder(match.home_team) || isPlaceholder(match.away_team)) return false
    return !savedPreds[match.id] && !initialPredMap[match.id]
  }

  const pendingMatches = grouped.flatMap((g) => g.matches).filter(isPending)

  // Un grupo es "pasado" solo si todos sus partidos terminaron
  const pastGroups = grouped.filter((g) =>
    g.matches.every((m) => m.status === 'FINISHED')
  )
  const upcomingGroups = grouped.filter((g) =>
    g.matches.some((m) => m.status !== 'FINISHED')
  )

  const initialTab = (): string => {
    if (pendingMatches.length > 0) return PENDING_TAB
    return upcomingGroups[0]?.date ?? grouped[0]?.date ?? ''
  }

  const [active, setActive] = useState<string>(initialTab)

  const todayKey = new Date().toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })

  function handleSaved(matchId: string, home: number, away: number) {
    setSavedPreds((prev) => ({ ...prev, [matchId]: { home, away } }))
  }

  function handleTabChange(tab: string) {
    setActive(tab)
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

  const currentMatches =
    active === PENDING_TAB
      ? pendingMatches
      : grouped.find((g) => g.date === active)?.matches ?? []

  function renderTab(g: { date: string; label: string; matches: Match[] }) {
    const pendingInDate = g.matches.filter(isPending).length
    const isActive = g.date === active
    return (
      <button
        key={g.date}
        onClick={() => handleTabChange(g.date)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
          isActive ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white'
        }`}
      >
        {g.label}
        {pendingInDate > 0 && (
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-white' : 'bg-red-500'}`} />
        )}
      </button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none border-b border-gray-800 shrink-0">

        {/* Tab pendientes */}
        {pendingMatches.length > 0 && (
          <button
            onClick={() => handleTabChange(PENDING_TAB)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              active === PENDING_TAB ? 'bg-red-600 text-white' : 'bg-gray-800 text-red-400 hover:text-red-300'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block" />
            Pendientes ({pendingMatches.length})
          </button>
        )}

        {/* Botón fechas anteriores */}
        {pastGroups.length > 0 && (
          <button
            onClick={() => setPastTabsOpen((v) => !v)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
              pastTabsOpen ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-500 hover:text-gray-300'
            }`}
          >
            Anteriores ({pastGroups.length})
            <span className={`transition-transform duration-200 inline-block ${pastTabsOpen ? 'rotate-180' : ''}`}>▼</span>
          </button>
        )}

        {/* Fechas pasadas — se muestran al expandir */}
        {pastTabsOpen && pastGroups.map(renderTab)}

        {/* Fechas próximas — siempre visibles */}
        {upcomingGroups.map(renderTab)}
      </div>

      {/* Matches */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {currentMatches.length === 0 && active === PENDING_TAB && (
          <div className="text-center text-gray-500 text-sm py-12">
            ¡Todos los pronósticos al día! 🎉
          </div>
        )}
        {currentMatches.map((match) => (
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
        {active === todayKey && <MusicButton />}
      </div>
    </div>
  )
}
