// Run: npx tsx scripts/create-admin.ts
// Creates the first admin user in Supabase

import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const NAME = process.env.ADMIN_NAME ?? 'Admin'
const PIN = process.env.ADMIN_USER_PIN ?? '0000'

async function main() {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env')
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const pin_hash = await bcrypt.hash(PIN, 10)

  const { data, error } = await supabase
    .from('users')
    .insert({ name: NAME, pin_hash, color: '#10B981', is_admin: true })
    .select('id, name')
    .single()

  if (error) {
    console.error('Error creating admin:', error.message)
    process.exit(1)
  }

  console.log(`✓ Admin creado: ${data.name} (id: ${data.id}) con PIN: ${PIN}`)
}

main()
