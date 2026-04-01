import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: teamId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  // Verify ownership
  const { data: team } = await supabase
    .from('teams')
    .select('owner_id')
    .eq('id', teamId)
    .single()

  if (!team || team.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Expire old invites
  await supabase
    .from('team_invites')
    .update({ expires_at: new Date().toISOString() })
    .eq('team_id', teamId)
    .gt('expires_at', new Date().toISOString())

  // Generate a unique short code
  const code = randomBytes(6).toString('base64url').slice(0, 8)

  // Create new invite
  const { data: invite, error } = await supabase
    .from('team_invites')
    .insert({
      team_id: teamId,
      code,
      created_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    })
    .select('code')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ invite_code: invite.code })
}
