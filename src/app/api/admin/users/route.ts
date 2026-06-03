import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'

async function requireAdmin() {
  const session = await getSession()
  if (!session) return null
  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', session.userId)
    .single()
  return user?.is_admin ? session : null
}

const COLORS = [
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#84CC16', '#6366F1',
]

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { name, pin, color } = await req.json()
  if (!name || !pin) return NextResponse.json({ error: 'Nombre y PIN requeridos' }, { status: 400 })
  if (String(pin).length !== 4) return NextResponse.json({ error: 'El PIN debe tener 4 dígitos' }, { status: 400 })

  const pin_hash = await bcrypt.hash(String(pin), 10)
  const supabase = createAdminClient()

  const { data: existing } = await supabase.from('users').select('id').order('created_at')
  const assignedColor = color || COLORS[(existing?.length ?? 0) % COLORS.length]

  const { data, error } = await supabase
    .from('users')
    .insert({ name: name.trim(), pin_hash, color: assignedColor })
    .select('id, name, color, is_admin')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user: data })
}

export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId requerido' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('users').delete().eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Sin permisos' }, { status: 403 })

  const { userId, pin } = await req.json()
  if (!userId || !pin) return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  if (String(pin).length !== 4) return NextResponse.json({ error: 'PIN debe tener 4 dígitos' }, { status: 400 })

  const pin_hash = await bcrypt.hash(String(pin), 10)
  const supabase = createAdminClient()
  const { error } = await supabase.from('users').update({ pin_hash }).eq('id', userId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
