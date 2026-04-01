import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must have been 'in' for the game
  const { data: avail } = await supabase
    .from('availability')
    .select('status')
    .eq('game_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!avail || avail.status !== 'in') {
    return NextResponse.json({ error: 'You were not in this game' }, { status: 403 })
  }

  // Check game is completed
  const { data: game } = await supabase
    .from('games')
    .select('status, team_id')
    .eq('id', params.id)
    .single()

  if (!game || game.status !== 'completed') {
    return NextResponse.json({ error: 'Game is not completed' }, { status: 400 })
  }

  // Prevent double-rating
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('game_id', params.id)
    .eq('rater_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'Already rated' }, { status: 400 })
  }

  const body = await req.json()
  const { ratings } = body as { ratings: { ratee_id: string; score: number }[] }

  if (!ratings || !Array.isArray(ratings) || ratings.length === 0) {
    return NextResponse.json({ error: 'No ratings provided' }, { status: 400 })
  }

  // Validate scores
  for (const r of ratings) {
    if (r.score < 1 || r.score > 10) {
      return NextResponse.json({ error: 'Scores must be 1–10' }, { status: 400 })
    }
    if (r.ratee_id === user.id) {
      return NextResponse.json({ error: 'Cannot rate yourself' }, { status: 400 })
    }
  }

  // Use admin client to insert (ratings table has no INSERT for regular users if restricted)
  const admin = createAdminClient()
  const rows = ratings.map(r => ({
    game_id: params.id,
    rater_id: user.id,
    ratee_id: r.ratee_id,
    score: r.score,
  }))

  const { error } = await admin.from('ratings').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Trigger stats update
  await admin.rpc('update_player_stats', { p_game_id: params.id } as any)

  return NextResponse.json({ ok: true })
}
