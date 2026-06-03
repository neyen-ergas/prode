import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .eq('user_id', session.userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ predictions: data })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { matchId, homeScore, awayScore } = await req.json()

  if (matchId === undefined || homeScore === undefined || awayScore === undefined) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Check match hasn't started
  const { data: match } = await supabase
    .from('matches')
    .select('match_date, status, home_team, away_team')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: 'Partido no encontrado' }, { status: 404 })

  if (match.home_team === 'TBD' || match.away_team === 'TBD') {
    return NextResponse.json({ error: 'Los equipos aún no están definidos' }, { status: 400 })
  }

  const locked = match.status === 'FINISHED' || new Date(match.match_date) <= new Date()
  if (locked) {
    return NextResponse.json({ error: 'El partido ya comenzó' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('predictions')
    .upsert(
      {
        user_id: session.userId,
        match_id: matchId,
        home_score: homeScore,
        away_score: awayScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,match_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ prediction: data })
}
