import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent
      const { game_id, user_id, team_id } = pi.metadata

      if (game_id && user_id) {
        // Mark availability as paid
        await supabase
          .from('availability')
          .update({ payment_status: 'paid', payment_intent_id: pi.id })
          .eq('game_id', game_id)
          .eq('user_id', user_id)

        // Add kitty transaction (if team uses kitty)
        if (team_id) {
          const amountGBP = pi.amount / 100
          // Record in kitty transactions
          await supabase.from('kitty_transactions').insert({
            team_id,
            user_id,
            amount: amountGBP,
            type: 'game_payment',
            description: `Game payment`,
          })
        }
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent
      const { game_id, user_id } = pi.metadata

      if (game_id && user_id) {
        // Reset payment status on failure
        await supabase
          .from('availability')
          .update({ payment_status: 'unpaid', payment_intent_id: null })
          .eq('game_id', game_id)
          .eq('user_id', user_id)
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const teamId = sub.metadata.team_id
      if (!teamId) break

      const status = sub.status === 'active' ? sub.metadata.plan ?? 'basic' : 'free'

      await supabase
        .from('teams')
        .update({
          subscription_status: status as 'free' | 'basic' | 'pro',
          stripe_subscription_id: sub.id,
        })
        .eq('id', teamId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const teamId = sub.metadata.team_id
      if (!teamId) break

      await supabase
        .from('teams')
        .update({ subscription_status: 'free', stripe_subscription_id: null })
        .eq('id', teamId)
      break
    }

    default:
      // Unhandled event type — safe to ignore
      break
  }

  return NextResponse.json({ received: true })
}
