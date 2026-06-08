import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getSession } from '@/lib/auth'

// GET /api/users — returns only users of the same family group
// Family group is determined by the ?family= query param (for the login page,
// where no session exists yet)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const familyParam = searchParams.get('family')

  // If already logged in, use session's family group
  const session = await getSession()
  const family = session?.familyGroup ?? familyParam ?? 'ergas'

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('users')
    .select('id, name, color, emoji, pin_hash')
    .eq('family_group', family)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type Row = { id: string; name: string; color: string; emoji: string | null; pin_hash: string | null }
  const users = (data ?? [] as Row[]).map(({ pin_hash, ...u }: Row) => ({
    ...u,
    has_pin: pin_hash !== null,
  }))

  return NextResponse.json({ users })
}
