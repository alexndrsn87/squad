import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ChipInClient } from './ChipInClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chip In' }

export default async function ChipInPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: team } = await supabase.from('teams').select('*').eq('id', params.id).single()
  if (!team || team.subscription_status === 'free') redirect(`/teams/${params.id}`)

  const { data: membership } = await supabase
    .from('team_members')
    .select('id')
    .eq('team_id', params.id)
    .eq('user_id', user.id)
    .single()
  if (!membership) redirect('/teams')

  const { data: items } = await supabase
    .from('chip_in_items')
    .select('*')
    .eq('team_id', params.id)
    .order('created_at', { ascending: false })

  const { count: memberCount } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', params.id)

  const isOwner = team.owner_id === user.id

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href={`/teams/${params.id}`} className="flex items-center gap-1 text-sm text-text-muted hover:text-brand mb-4">
            <ChevronLeft size={14} /> Back to team
          </Link>
          <h1 className="font-display text-3xl tracking-wide mb-1">Chip In</h1>
          <p className="text-text-secondary text-sm">Shared expenses split between the squad</p>
        </div>

        <ChipInClient
          teamId={params.id}
          items={items ?? []}
          memberCount={memberCount ?? 0}
          isOwner={isOwner}
        />
      </div>
    </AppShell>
  )
}
