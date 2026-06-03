import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ user: null })

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, color')
    .eq('id', session.userId)
    .single()

  return NextResponse.json({ user })
}
