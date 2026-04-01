import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppShell } from '@/components/layout/AppShell'
import Link from 'next/link'
import { ExternalLink, ShoppingBag } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Shop' }

const PRODUCTS = [
  {
    id: 'match-ball',
    name: 'Match Ball',
    description: 'Official size 5 match ball, suitable for all surfaces.',
    price: 24.99,
    image: null,
    tag: 'Popular',
    affiliateUrl: 'https://www.amazon.co.uk/s?k=5-a-side+football',
  },
  {
    id: 'bib-set',
    name: 'Training Bibs (10 pack)',
    description: 'Lightweight mesh bibs in two colours. One-size fits all.',
    price: 12.99,
    image: null,
    tag: null,
    affiliateUrl: 'https://www.amazon.co.uk/s?k=football+training+bibs',
  },
  {
    id: 'gk-gloves',
    name: 'GK Gloves',
    description: 'Grip palm goalkeeper gloves with wrist strap.',
    price: 18.99,
    image: null,
    tag: null,
    affiliateUrl: 'https://www.amazon.co.uk/s?k=goalkeeper+gloves',
  },
  {
    id: 'pump',
    name: 'Ball Pump',
    description: 'Dual-action pump with needle and pressure gauge.',
    price: 6.99,
    image: null,
    tag: null,
    affiliateUrl: 'https://www.amazon.co.uk/s?k=football+ball+pump',
  },
  {
    id: 'cones',
    name: 'Cone Set (20 pack)',
    description: 'Flat disc cones for marking pitches and warm-up drills.',
    price: 9.99,
    image: null,
    tag: null,
    affiliateUrl: 'https://www.amazon.co.uk/s?k=football+disc+cones',
  },
  {
    id: 'water-bottle',
    name: 'Squad Bottle (1L)',
    description: 'BPA-free 1-litre squeeze bottle. Keep everyone hydrated.',
    price: 7.99,
    image: null,
    tag: null,
    affiliateUrl: 'https://www.amazon.co.uk/s?k=sports+water+bottle+1l',
  },
]

export default async function ShopPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single()
  if (!profile) redirect('/login')

  return (
    <AppShell user={profile}>
      <div className="p-5 md:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="font-display text-3xl tracking-wide mb-1">Squad Shop</h1>
            <p className="text-text-secondary text-sm">Everything your squad needs, delivered to your door</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PRODUCTS.map(product => (
            <div key={product.id} className="card relative">
              {product.tag && (
                <div className="absolute top-3 right-3">
                  <span className="bg-brand text-bg text-xs font-bold px-2.5 py-0.5 rounded-full">
                    {product.tag}
                  </span>
                </div>
              )}

              {/* Placeholder image */}
              <div className="w-full h-36 rounded-xl bg-bg-elevated border border-bg-border flex items-center justify-center mb-4">
                <ShoppingBag size={32} className="text-text-muted" />
              </div>

              <div className="font-semibold mb-1">{product.name}</div>
              <div className="text-sm text-text-muted mb-3">{product.description}</div>

              <div className="flex items-center justify-between">
                <div className="font-display text-xl tracking-wide">
                  £{product.price.toFixed(2)}
                </div>
                <Link
                  href={product.affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex items-center gap-1.5 text-sm"
                >
                  Buy now <ExternalLink size={13} />
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 rounded-xl bg-bg-elevated border border-bg-border text-center">
          <p className="text-sm text-text-muted">
            Items fulfilled by trusted retailers. Squad may earn a small commission at no extra cost to you.
          </p>
        </div>
      </div>
    </AppShell>
  )
}
