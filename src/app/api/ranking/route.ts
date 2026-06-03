import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import type { RankingEntry, User } from '@/lib/types'
import { POINTS } from '@/lib/scoring'

type PredRow = { user_id: string; points: number | null }
type ChampRow = { user_id: string; team: string }

export async function GET() {
  const supabase = createAdminClient()

  const [{ data: users }, { data: predictions }, { data: champions }, { data: finishedMatch }] =
    await Promise.all([
      supabase.from('users').select('id, name, color, created_at'),
      supabase.from('predictions').select('user_id, points'),
      supabase.from('champion_predictions').select('user_id, team'),
      supabase.from('matches').select('home_team').eq('status', 'FINISHED').limit(1),
    ])

  const { data: finalMatch } = await supabase
    .from('matches')
    .select('home_team, away_team, home_score, away_score')
    .eq('stage', 'FINAL')
    .eq('status', 'FINISHED')
    .single()

  let actualChampion: string | null = null
  if (finalMatch && finalMatch.home_score !== null && finalMatch.away_score !== null) {
    actualChampion =
      finalMatch.home_score > finalMatch.away_score
        ? finalMatch.home_team
        : finalMatch.away_team
  }

  const ranking: RankingEntry[] = (users ?? [] as User[]).map((user: User) => {
    const userPredictions = (predictions ?? [] as PredRow[]).filter((p: PredRow) => p.user_id === user.id)
    const matchPoints = userPredictions.reduce((sum: number, p: PredRow) => sum + (p.points ?? 0), 0)
    const exactScores = userPredictions.filter((p: PredRow) => p.points === POINTS.EXACT_SCORE).length
    const correctResults = userPredictions.filter((p: PredRow) => p.points === POINTS.CORRECT_RESULT).length

    const championPred = (champions ?? [] as ChampRow[]).find((c: ChampRow) => c.user_id === user.id)
    const championPoints =
      actualChampion && championPred?.team === actualChampion ? POINTS.CHAMPION : 0

    return {
      user,
      total_points: matchPoints + championPoints,
      exact_scores: exactScores,
      correct_results: correctResults,
      predictions_count: userPredictions.length,
      champion_team: championPred?.team ?? null,
      champion_points: championPoints,
    }
  })

  ranking.sort((a, b) => {
    if (b.total_points !== a.total_points) return b.total_points - a.total_points
    if (b.exact_scores !== a.exact_scores) return b.exact_scores - a.exact_scores
    return a.user.name.localeCompare(b.user.name)
  })

  return NextResponse.json({ ranking, hasStarted: !!finishedMatch })
}
