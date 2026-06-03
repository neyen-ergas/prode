import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchMatches } from '@/lib/football-api'
import { calculatePoints } from '@/lib/scoring'

export async function POST(req: NextRequest) {
  // Protect with a secret token (set CRON_SECRET in env)
  const auth = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  try {
    const matches = await fetchMatches()
    const supabase = createAdminClient()

    const { error: matchError } = await supabase.from('matches').upsert(
      matches.map((m) => ({ ...m, updated_at: new Date().toISOString() })),
      { onConflict: 'id' }
    )
    if (matchError) throw new Error(matchError.message)

    const finishedMatches = matches.filter(
      (m) => m.status === 'FINISHED' && m.home_score !== null && m.away_score !== null
    )

    for (const match of finishedMatches) {
      const { data: predictions } = await supabase
        .from('predictions')
        .select('id, home_score, away_score')
        .eq('match_id', match.id)

      if (!predictions?.length) continue
      for (const pred of predictions) {
        const points = calculatePoints(pred.home_score, pred.away_score, match.home_score!, match.away_score!)
        await supabase.from('predictions').update({ points }).eq('id', pred.id)
      }
    }

    return NextResponse.json({ ok: true, synced: matches.length, scored: finishedMatches.length })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
