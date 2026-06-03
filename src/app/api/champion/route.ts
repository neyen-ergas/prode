import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('champion_predictions')
    .select('*')
    .eq('user_id', session.userId)
    .single()

  return NextResponse.json({ champion: data ?? null })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { team } = await req.json()
  if (!team) return NextResponse.json({ error: 'Equipo requerido' }, { status: 400 })

  const supabase = createAdminClient()

  // Lock champion prediction once tournament starts
  const { data: firstMatch } = await supabase
    .from('matches')
    .select('match_date')
    .order('match_date', { ascending: true })
    .limit(1)
    .single()

  if (firstMatch && new Date(firstMatch.match_date) <= new Date()) {
    return NextResponse.json({ error: 'El torneo ya comenzó' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('champion_predictions')
    .upsert({ user_id: session.userId, team }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ champion: data })
}
