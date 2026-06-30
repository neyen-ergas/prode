import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { fetchMatches } from '@/lib/football-api'
import { calculatePoints } from '@/lib/scoring'

async function runSync() {
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

  let scored = 0
  if (finishedMatches.length > 0) {
    const finishedIds = finishedMatches.map((m) => m.id)
    const { data: predictions } = await supabase
      .from('predictions')
      .select('id, match_id, home_score, away_score')
      .in('match_id', finishedIds)

    if (predictions?.length) {
      const scoreMap = new Map(finishedMatches.map((m) => [m.id, m]))
      const updates = predictions.map((pred) => {
        const match = scoreMap.get(pred.match_id)!
        const points = calculatePoints(pred.home_score, pred.away_score, match.home_score!, match.away_score!)
        return { id: pred.id, points }
      })

      const { error: scoreError } = await supabase
        .from('predictions')
        .upsert(updates, { onConflict: 'id' })
      if (scoreError) throw new Error(scoreError.message)
      scored = updates.length
    }
  }

  return { ok: true, synced: matches.length, scored }
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return true
  const header = req.headers.get('authorization')
  const param = req.nextUrl.searchParams.get('secret')
  return header === `Bearer ${secret}` || param === secret
}

// POST: called by Vercel Cron
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    return NextResponse.json(await runSync())
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// GET: sync manual desde el browser con ?secret=xxx
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  try {
    const result = await runSync()
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
