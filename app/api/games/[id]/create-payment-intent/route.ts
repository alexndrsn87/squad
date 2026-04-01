import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: game } = await supabase
    .from('games')
    .select('*, teams(id, name, subscription_status)')
    .eq('id', params.id)
    .single()

  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.cost_per_player <= 0) return NextResponse.json({ error: 'This game is free' }, { status: 400 })

  // Check user is marked in for this game
  const { data: avail } = await supabase
    .from('availability')
    .select('*')
    .eq('game_id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!avail || avail.status !== 'in') {
    return NextResponse.json({ error: 'You must be marked as IN to pay' }, { status: 400 })
  }

  if (avail.payment_status === 'paid') {
    return NextResponse.json({ error: 'Already paid' }, { status: 400 })
  }

  const amountPence = Math.round(game.cost_per_player * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountPence,
    currency: 'gbp',
    automatic_payment_methods: { enabled: true },
    metadata: {
      game_id: params.id,
      user_id: user.id,
      team_id: (game.teams as any)?.id ?? '',
    },
    description: `${(game.teams as any)?.name ?? 'Squad'} – game on ${new Date(game.scheduled_at).toLocaleDateString('en-GB')}`,
  })

  // Save payment intent ID immediately so webhook can match it
  await supabase
    .from('availability')
    .update({ payment_intent_id: paymentIntent.id })
    .eq('id', avail.id)

  return NextResponse.json({ clientSecret: paymentIntent.client_secret })
}
