import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/server'
import AppShell from '@/components/AppShell'
import BackgroundMusic from '@/components/BackgroundMusic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/')

  const supabase = createAdminClient()
  const { data: user } = await supabase
    .from('users')
    .select('id, name, color, emoji, created_at')
    .eq('id', session.userId)
    .single()

  if (!user) redirect('/')

  return (
    <>
      {session.familyGroup === 'ergas' && <BackgroundMusic />}
      <AppShell user={user}>{children}</AppShell>
    </>
  )
}
