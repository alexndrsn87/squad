import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must be owner
  const { data: team } = await supabase.from('teams').select('owner_id').eq('id', params.id).single()
  if (!team || team.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { name, total_cost } = body
  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!total_cost || total_cost <= 0) return NextResponse.json({ error: 'Invalid cost' }, { status: 400 })

  // Get member count to compute per-player
  const { count } = await supabase
    .from('team_members')
    .select('*', { count: 'exact', head: true })
    .eq('team_id', params.id)

  const memberCount = count ?? 1
  const perPlayer = total_cost / memberCount

  const { data, error } = await supabase.from('chip_in_items').insert({
    team_id: params.id,
    created_by: user.id,
    name: name.trim(),
    total_cost,
    per_player_amount: perPlayer,
    status: 'active',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Deduct from each member's kitty
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', params.id)

  if (members) {
    for (const m of members) {
      // Upsert kitty row
      await supabase.rpc('adjust_kitty', {
        p_team_id: params.id,
        p_user_id: m.user_id,
        p_amount: -perPlayer,
      } as any).maybeSingle()

      // Transaction log
      await supabase.from('kitty_transactions').insert({
        team_id: params.id,
        user_id: m.user_id,
        amount: -perPlayer,
        type: 'chip_in',
        description: name.trim(),
      })
    }
  }

  return NextResponse.json({ ok: true, item: data })
}
