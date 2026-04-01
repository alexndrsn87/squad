import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import { PayClient } from './PayClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Pay for game' }

export default async function PayPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: game } = await supabase
    .from('games')
    .select('*, teams(id, name, subscription_status)')
    .eq('id', params.id)
    .single()

  if (!game) redirect('/games')

  // Only paid-plan teams use payments
  const team = game.teams as any
  if (!team || team.subscription_status === 'free') redirect(`/games/${params.id}`)
  if (game.cost_per_player <= 0) redirect(`/games/${params.id}`)

  // Check user is a member of this team
  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', team.id)
    .eq('user_id', user.id)
    .single()

  if (!membership) redirect(`/games/${params.id}`)

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-lg mx-auto">
        <div className="mb-6">
          <h1 className="font-display text-3xl tracking-wide mb-1">Pay for game</h1>
          <p className="text-text-secondary text-sm">Secure payment powered by Stripe</p>
        </div>
        <PayClient
          gameId={params.id}
          scheduledAt={game.scheduled_at}
          costPerPlayer={game.cost_per_player}
          teamName={team.name}
        />
      </div>
    </AppShell>
  )
}
