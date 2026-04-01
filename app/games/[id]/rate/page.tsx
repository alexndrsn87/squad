import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { RateClient } from './RateClient'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Rate your teammates' }

export default async function RatePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  const { data: game } = await supabase
    .from('games')
    .select('*, teams(id, name)')
    .eq('id', params.id)
    .single()

  if (!game || game.status !== 'completed') redirect(`/games/${params.id}`)

  // Current user must have been 'in'
  const { data: myAvail } = await supabase
    .from('availability')
    .select('status')
    .eq('game_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!myAvail || myAvail.status !== 'in') redirect(`/games/${params.id}`)

  // Have they already rated?
  const { data: existingRatings } = await supabase
    .from('ratings')
    .select('id')
    .eq('game_id', params.id)
    .eq('rater_id', user.id)
    .limit(1)

  const alreadyRated = (existingRatings?.length ?? 0) > 0

  // Get other players who were 'in' to rate
  const { data: inPlayers } = await supabase
    .from('availability')
    .select('user_id, users(id, name, nickname, avatar_url)')
    .eq('game_id', params.id)
    .eq('status', 'in')
    .neq('user_id', user.id)

  const ratees = (inPlayers ?? [])
    .map((p: any) => ({
      userId: p.user_id,
      name: p.users?.name ?? '',
      nickname: p.users?.nickname ?? null,
      avatarUrl: p.users?.avatar_url ?? null,
    }))
    .filter(r => r.userId)

  const team = game.teams as any

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-lg mx-auto">
        <div className="mb-6">
          <Link href={`/games/${params.id}`} className="flex items-center gap-1 text-sm text-text-muted hover:text-brand mb-4">
            <ChevronLeft size={14} /> Back to game
          </Link>
          <h1 className="font-display text-3xl tracking-wide mb-1">Rate Your Teammates</h1>
          <p className="text-text-secondary text-sm">{team?.name} · Anonymous ratings</p>
        </div>

        <RateClient gameId={params.id} ratees={ratees} alreadyRated={alreadyRated} />
      </div>
    </AppShell>
  )
}
