import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'
import type { RankingEntry, User } from '@/lib/types'
import { POINTS } from '@/lib/scoring'

export const dynamic = 'force-dynamic'

async function getRanking(): Promise<{ ranking: RankingEntry[]; hasStarted: boolean }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL ? '' : 'http://localhost:3000'}/api/ranking`, {
    cache: 'no-store',
  })
  if (!res.ok) return { ranking: [], hasStarted: false }
  return res.json()
}

export default async function RankingPage() {
  const session = await getSession()
  const supabase = createAdminClient()

  const [rankingRes, { data: users }] = await Promise.all([
    (async () => {
      const supabaseAdmin = createAdminClient()
      const [{ data: allUsers }, { data: predictions }, { data: champions }] = await Promise.all([
        supabaseAdmin.from('users').select('id, name, color, created_at').order('name'),
        supabaseAdmin.from('predictions').select('user_id, points'),
        supabaseAdmin.from('champion_predictions').select('user_id, team'),
      ])

      const { data: finalMatch } = await supabaseAdmin
        .from('matches')
        .select('home_team, away_team, home_score, away_score')
        .eq('stage', 'FINAL')
        .eq('status', 'FINISHED')
        .maybeSingle()

      const { data: anyFinished } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('status', 'FINISHED')
        .limit(1)

      let actualChampion: string | null = null
      if (finalMatch?.home_score !== null && finalMatch?.away_score !== null) {
        actualChampion =
          (finalMatch?.home_score ?? 0) > (finalMatch?.away_score ?? 0)
            ? finalMatch?.home_team ?? null
            : finalMatch?.away_team ?? null
      }

      const ranking: RankingEntry[] = (allUsers ?? [] as User[]).map((user: User) => {
        const userPreds = (predictions ?? []).filter((p: { user_id: string; points: number | null }) => p.user_id === user.id)
        type PredRow = { user_id: string; points: number | null }
        const matchPoints = userPreds.reduce((s: number, p: PredRow) => s + (p.points ?? 0), 0)
        const exactScores = userPreds.filter((p: PredRow) => p.points === POINTS.EXACT_SCORE).length
        const correctResults = userPreds.filter((p: PredRow) => p.points === POINTS.CORRECT_RESULT).length
        const championPred = (champions ?? []).find((c: { user_id: string; team: string }) => c.user_id === user.id)
        const championPoints =
          actualChampion && championPred?.team === actualChampion ? POINTS.CHAMPION : 0

        return {
          user,
          total_points: matchPoints + championPoints,
          exact_scores: exactScores,
          correct_results: correctResults,
          predictions_count: userPreds.length,
          champion_team: championPred?.team ?? null,
          champion_points: championPoints,
        }
      })

      ranking.sort((a, b) => {
        if (b.total_points !== a.total_points) return b.total_points - a.total_points
        if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
        return a.user.name.localeCompare(b.user.name)
      })

      return { ranking, hasStarted: (anyFinished?.length ?? 0) > 0 }
    })(),
    supabase.from('users').select('id').eq('id', session!.userId),
  ])

  const { ranking, hasStarted } = rankingRes
  const medals = ['🥇', '🥈', '🥉']

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">Ranking</h1>
        {!hasStarted && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            El torneo no inició
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
              <div className="w-8 text-center text-xl font-bold">
                {medals[i] ?? <span className="text-gray-500 text-base">{i + 1}</span>}
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
                  {entry.champion_team && (
                    <span className="text-yellow-500">🌟 {entry.champion_team}</span>
                  )}
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

      {ranking.length === 0 && (
        <div className="text-center text-gray-500 py-12 text-sm">
          Aún no hay usuarios registrados.
        </div>
      )}

      <div className="text-xs text-gray-600 text-center pt-2 space-y-0.5">
        <p>Marcador exacto = {POINTS.EXACT_SCORE} pts · Resultado correcto = {POINTS.CORRECT_RESULT} pt</p>
        <p>Campeón correcto = {POINTS.CHAMPION} pts</p>
      </div>
    </div>
  )
}
