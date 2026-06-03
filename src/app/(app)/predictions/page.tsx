import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import MatchCard from '@/components/MatchCard'
import { STAGE_LABELS, STAGE_ORDER } from '@/lib/utils'
import type { Match, Prediction, Stage } from '@/lib/types'

export const dynamic = 'force-dynamic'

export default async function PredictionsPage() {
  const session = await getSession()
  const supabase = createAdminClient()

  const [{ data: matches }, { data: predictions }] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('user_id', session!.userId),
  ])

  const predMap = new Map<string, Prediction>(
    (predictions ?? [] as Prediction[]).map((p: Prediction) => [p.match_id, p])
  )

  const grouped = new Map<Stage, Match[]>()
  for (const match of (matches ?? []) as Match[]) {
    if (!grouped.has(match.stage)) grouped.set(match.stage, [])
    grouped.get(match.stage)!.push(match)
  }

  const stages = STAGE_ORDER.filter((s) => grouped.has(s))

  if (!matches?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 gap-2">
        <span className="text-4xl">📭</span>
        <p className="text-sm">No hay partidos cargados aún.</p>
        <p className="text-xs">El admin debe sincronizar desde la sección Admin.</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {stages.map((stage) => (
        <section key={stage}>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
            {STAGE_LABELS[stage]}
          </h2>
          <div className="space-y-3">
            {grouped.get(stage)!.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                prediction={predMap.get(match.id) ?? null}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
