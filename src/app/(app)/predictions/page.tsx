import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import PredictionsTabs from '@/components/PredictionsTabs'
import type { Match, Prediction, User } from '@/lib/types'
export const dynamic = 'force-dynamic'
function toArgDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
}
function toArgDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short', day: 'numeric', month: 'short',
  })
}
export default async function PredictionsPage() {
  const session = await getSession()
  const family = session?.familyGroup ?? 'ergas'
  const supabase = createAdminClient()
  const [{ data: matches }, { data: myPreds }, { data: allPreds }, { data: users }] =
    await Promise.all([
      supabase.from('matches').select('*').order('match_date', { ascending: true }),
      supabase.from('predictions').select('*').eq('user_id', session!.userId),
      supabase.from('predictions').select('user_id, match_id, home_score, away_score, points'),
      supabase.from('users').select('id, name, color, emoji').eq('family_group', family).order('name'),
    ])
  if (!matches?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <span className="text-4xl">📭</span>
        <p className="text-sm">No hay partidos cargados aún.</p>
      </div>
    )
  }
  // My predictions: matchId → Prediction
  const predMap: Record<string, Prediction> = {}
  for (const p of (myPreds ?? []) as Prediction[]) predMap[p.match_id] = p
  // Solo predicciones de usuarios de esta familia
  const familyUserIds = new Set((users ?? []).map((u: User) => u.id))
  console.log('DEBUG family:', family)
  console.log('DEBUG familyUserIds:', [...familyUserIds])
  // All predictions: matchId → userId → {home, away, points}
  type PredEntry = { home_score: number; away_score: number; points: number | null }
  const allPredMap: Record<string, Record<string, PredEntry>> = {}
  for (const p of (allPreds ?? []) as Array<PredEntry & { user_id: string; match_id: string }>) {
    if (!familyUserIds.has(p.user_id)) continue
    if (!allPredMap[p.match_id]) allPredMap[p.match_id] = {}
    allPredMap[p.match_id][p.user_id] = { home_score: p.home_score, away_score: p.away_score, points: p.points }
  }
  console.log('DEBUG allPredMap 760415:', JSON.stringify(allPredMap['760415']))
  // Group by Argentine date
  const dateMap = new Map<string, Match[]>()
  for (const match of matches as Match[]) {
    const key = toArgDate(match.match_date)
    if (!dateMap.has(key)) dateMap.set(key, [])
    dateMap.get(key)!.push(match)
  }
  const grouped = Array.from(dateMap.entries()).map(([date, ms]) => ({
    date,
    label: toArgDateLabel(ms[0].match_date),
    matches: ms,
  }))
  return (
    <PredictionsTabs
      grouped={grouped}
      predMap={predMap}
      allPredMap={allPredMap}
      users={(users ?? []) as User[]}
      currentUserId={session!.userId}
    />
  )
}
