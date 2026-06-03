import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/server'
import { createSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { userId, pin } = await req.json()

  if (!userId || !pin || String(pin).length !== 4) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, pin_hash, color')
    .eq('id', userId)
    .single()

  if (error || !user) {
    return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
  }

  if (user.pin_hash === null) {
    // Primera vez: crear el PIN
    const pin_hash = await bcrypt.hash(String(pin), 10)
    await supabase.from('users').update({ pin_hash }).eq('id', userId)
  } else {
    // Verificar PIN existente
    const valid = await bcrypt.compare(String(pin), user.pin_hash)
    if (!valid) {
      return NextResponse.json({ error: 'PIN incorrecto' }, { status: 401 })
    }
  }

  await createSession({ userId: user.id, userName: user.name })
  return NextResponse.json({ user: { id: user.id, name: user.name, color: user.color } })
}
