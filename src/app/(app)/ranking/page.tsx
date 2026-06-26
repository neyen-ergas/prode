import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import type { User, Match } from '@/lib/types'
import { POINTS } from '@/lib/scoring'
import RankingList from '@/components/RankingList'
export const dynamic = 'force-dynamic'
type PredRow = { user_id: string; match_id: string; home_score: number; away_score: number; points: number | null }
export default async function RankingPage() {
  const session = await getSession()
  const family = session?.familyGroup ?? 'ergas'
  const supabase = createAdminClient()
  const [{ data: allUsers }, { data: predictions }, { data: matches }, { data: anyFinished }] =
    await Promise.all([
      supabase.from('users').select('id, name, color, emoji, created_at').eq('family_group', family).order('name'),
      supabase.from('predictions').select('user_id, match_id, home_score, away_score, points').limit(10000),
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('matches').select('id').eq('status', 'FINISHED').limit(1),
    ])
  const allPreds = (predictions ?? []) as PredRow[]
  const familyUserIds = new Set((allUsers ?? []).map((u: { id: string }) => u.id))
  const familyPreds = allPreds.filter((p) => familyUserIds.has(p.user_id))
  const userPredMap: Record<string, Record<string, { home_score: number; away_score: number; points: number | null }>> = {}
  for (const p of familyPreds) {
    if (!userPredMap[p.user_id]) userPredMap[p.user_id] = {}
    userPredMap[p.user_id][p.match_id] = { home_score: p.home_score, away_score: p.away_score, points: p.points }
  }
  type RankEntry = { user: User; total_points: number; exact_scores: number; correct_results: number; predictions_count: number }
  const ranking: RankEntry[] = (allUsers ?? [] as User[]).map((user: User) => {
    const userPreds = familyPreds.filter((p) => p.user_id === user.id)
    const total_points = userPreds.reduce((s, p) => s + (p.points ?? 0), 0)
    const exact_scores = userPreds.filter((p) => p.points === POINTS.EXACT_SCORE).length
    const correct_results = userPreds.filter((p) => p.points === POINTS.CORRECT_RESULT).length
    return { user, total_points, exact_scores, correct_results, predictions_count: userPreds.length }
  })
  ranking.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
    return a.user.name.localeCompare(b.user.name)
  })
  const hasStarted = (anyFinished?.length ?? 0) > 0
  return (
    <div className="p-4 space-y-4 relative">
      {/* Premio — solo familia ergas */}
      {family === 'ergas' && <div className="relative rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-900/50 via-yellow-900/25 to-amber-900/50" />
        <div className="absolute inset-0 ring-1 ring-amber-400/35 rounded-2xl" />
        {/* Lluvia de plata contenida en el card */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl" aria-hidden>
          {[
            { emoji: '💵', left: '5%',  delay: '0s',   dur: '4s' },
            { emoji: '🪙', left: '15%', delay: '1.8s', dur: '3.5s' },
            { emoji: '💵', left: '27%', delay: '0.5s', dur: '4.5s' },
            { emoji: '🪙', left: '38%', delay: '2.9s', dur: '3.8s' },
            { emoji: '💵', left: '50%', delay: '1.1s', dur: '4.2s' },
            { emoji: '🪙', left: '62%', delay: '0.3s', dur: '3.6s' },
            { emoji: '💵', left: '73%', delay: '2.2s', dur: '4.8s' },
            { emoji: '🪙', left: '85%', delay: '1.5s', dur: '3.9s' },
            { emoji: '💵', left: '93%', delay: '3.4s', dur: '4.1s' },
          ].map((item, i) => (
            <span
              key={i}
              className="absolute top-0 text-base"
              style={{
                left: item.left,
                opacity: 0.35,
                animation: `money-fall-card ${item.dur} linear ${item.delay} infinite`,
              }}
            >{item.emoji}</span>
          ))}
          <div
            className="absolute inset-y-0 w-1/2 animate-[shimmer_3s_ease-in-out_infinite]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.18), transparent)' }}
          />
        </div>
        <div className="relative p-5 flex flex-col items-center gap-1">
          <div className="text-4xl">🏆</div>
          <div className="text-xs text-amber-400/75 font-semibold uppercase tracking-widest">Premio</div>
          <div className="text-3xl font-bold text-amber-300 tabular-nums">$240.000</div>
        </div>
      </div>}

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ranking</h1>
        {!hasStarted && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            Torneo no iniciado
          </span>
        )}
      </div>
      <RankingList
        ranking={ranking}
        currentUserId={session!.userId}
        userPredMap={userPredMap}
        matches={(matches ?? []) as Match[]}
      />
      <p className="text-xs text-gray-600 text-center pt-2">
        Exacto = {POINTS.EXACT_SCORE} pts · Resultado = {POINTS.CORRECT_RESULT} pt
      </p>
    </div>
  )
}
