import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import type { User } from '@/lib/types'
import { POINTS } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

type PredRow = { user_id: string; points: number | null }

interface RankingEntry {
  user: User
  total_points: number
  exact_scores: number
  correct_results: number
  predictions_count: number
}

export default async function RankingPage() {
  const session = await getSession()
  const supabase = createAdminClient()

  const [{ data: allUsers }, { data: predictions }, { data: anyFinished }] = await Promise.all([
    supabase.from('users').select('id, name, color, created_at').order('name'),
    supabase.from('predictions').select('user_id, points'),
    supabase.from('matches').select('id').eq('status', 'FINISHED').limit(1),
  ])

  const ranking: RankingEntry[] = (allUsers ?? [] as User[]).map((user: User) => {
    const userPreds = (predictions ?? [] as PredRow[]).filter((p: PredRow) => p.user_id === user.id)
    const total_points = userPreds.reduce((s: number, p: PredRow) => s + (p.points ?? 0), 0)
    const exact_scores = userPreds.filter((p: PredRow) => p.points === POINTS.EXACT_SCORE).length
    const correct_results = userPreds.filter((p: PredRow) => p.points === POINTS.CORRECT_RESULT).length
    return { user, total_points, exact_scores, correct_results, predictions_count: userPreds.length }
  })

  ranking.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
    return a.user.name.localeCompare(b.user.name)
  })

  const hasStarted = (anyFinished?.length ?? 0) > 0
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ranking</h1>
        {!hasStarted && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            Torneo no iniciado
          </span>
        )}
      </div>

      <div className="space-y-2">
        {ranking.map((entry, i) => {
          const isMe = entry.user.id === session!.userId
          return (
            <div
              key={entry.user.id}
              className={`rounded-2xl p-4 flex items-center gap-3 ${
                isMe ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-gray-900'
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

              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-white">{entry.total_points}</div>
                <div className="text-xs text-gray-500">pts</div>
              </div>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-gray-600 text-center pt-2">
        Exacto = {POINTS.EXACT_SCORE} pts · Resultado = {POINTS.CORRECT_RESULT} pt
      </p>
    </div>
  )
}
