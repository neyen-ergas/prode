import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import PredictionsTabs from '@/components/PredictionsTabs'
import type { Match, Prediction } from '@/lib/types'

export const dynamic = 'force-dynamic'

function toArgDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

function toArgDateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export default async function PredictionsPage() {
  const session = await getSession()
  const supabase = createAdminClient()

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', session!.userId),
  ])

  if (!matches?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <span className="text-4xl">📭</span>
        <p className="text-sm">No hay partidos cargados aún.</p>
      </div>
    )
  }

  const predMap: Record<string, Prediction> = {}
  for (const p of (predictions ?? []) as Prediction[]) {
    predMap[p.match_id] = p
  }

  // Group matches by Argentine date
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

  return <PredictionsTabs grouped={grouped} predMap={predMap} />
}
