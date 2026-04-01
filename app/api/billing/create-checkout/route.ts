import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' })

// Price IDs — create these in your Stripe dashboard and add to .env.local
const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC ?? '',
  pro: process.env.STRIPE_PRICE_PRO ?? '',
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { team_id, plan } = body as { team_id: string; plan: 'basic' | 'pro' }

  if (!team_id || !['basic', 'pro'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  // Verify ownership
  const { data: team } = await supabase.from('teams').select('owner_id, name').eq('id', team_id).single()
  if (!team || team.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: profile } = await supabase.from('users').select('email, name').eq('id', user.id).single()

  const priceId = PRICE_IDS[plan]
  if (!priceId) return NextResponse.json({ error: 'Price not configured. Set STRIPE_PRICE_BASIC and STRIPE_PRICE_PRO in .env.local' }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: profile?.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/teams/${team_id}?upgraded=1`,
    cancel_url: `${appUrl}/upgrade`,
    metadata: { team_id, plan, user_id: user.id },
    subscription_data: { metadata: { team_id, plan } },
  })

  return NextResponse.json({ url: session.url })
}
