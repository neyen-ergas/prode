import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, color, emoji, pin_hash')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = { id: string; name: string; color: string; emoji: string | null; pin_hash: string | null }
  const users = (data ?? [] as Row[]).map(({ pin_hash, ...u }: Row) => ({
    ...u,
    has_pin: pin_hash !== null,
  }))

  return NextResponse.json({ users })
}
