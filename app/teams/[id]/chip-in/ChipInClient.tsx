'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Plus, Loader2, CheckCircle2, Clock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { ChipInItem } from '@/types/database'

interface ChipInClientProps {
  teamId: string
  items: ChipInItem[]
  memberCount: number
  isOwner: boolean
}

export function ChipInClient({ teamId, items, memberCount, isOwner }: ChipInClientProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [totalCost, setTotalCost] = useState('')
  const [creating, setCreating] = useState(false)
  const [settling, setSettling] = useState<string | null>(null)

  const perPlayer = memberCount > 0 && totalCost ? (parseFloat(totalCost) / memberCount).toFixed(2) : null

  async function createItem() {
    if (!name.trim() || !totalCost) return
    setCreating(true)
    const res = await fetch(`/api/teams/${teamId}/chip-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), total_cost: parseFloat(totalCost) }),
    })
    setCreating(false)
    if (res.ok) {
      toast.success('Item created')
      setShowForm(false)
      setName('')
      setTotalCost('')
      router.refresh()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to create')
    }
  }

  async function settleItem(itemId: string) {
    setSettling(itemId)
    const res = await fetch(`/api/teams/${teamId}/chip-in/${itemId}/settle`, { method: 'POST' })
    setSettling(null)
    if (res.ok) {
      toast.success('Item settled')
      router.refresh()
    } else {
      toast.error('Failed to settle')
    }
  }

  const active = items.filter(i => i.status === 'active')
  const settled = items.filter(i => i.status === 'settled')

  return (
    <div className="space-y-4">
      {/* Create new item */}
      {isOwner && (
        showForm ? (
          <div className="card space-y-3">
            <h3 className="font-semibold text-sm">New expense</h3>
            <div>
              <label className="label">What is it?</label>
              <input
                className="input"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. New set of bibs"
              />
            </div>
            <div>
              <label className="label">Total cost (£)</label>
              <input
                className="input"
                type="number"
                min="0.01"
                step="0.01"
                value={totalCost}
                onChange={e => setTotalCost(e.target.value)}
                placeholder="0.00"
              />
              {perPlayer && (
                <p className="text-xs text-text-muted mt-1">
                  {formatCurrency(parseFloat(perPlayer))} per player ({memberCount} players)
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={createItem}
                disabled={creating || !name.trim() || !totalCost}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 size={14} className="animate-spin" /> Creating…</> : 'Create'}
              </button>
              <button onClick={() => setShowForm(false)} className="btn-ghost flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowForm(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus size={15} /> Add expense
          </button>
        )
      )}

      {/* Active items */}
      {active.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-text-muted uppercase tracking-wide font-medium px-1">Active</div>
          {active.map(item => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-text-muted mt-0.5">
                    {formatCurrency(item.total_cost)} total · {formatCurrency(item.per_player_amount)} per player
                  </div>
                  <div className="flex items-center gap-1 text-xs text-yellow-400 mt-1">
                    <Clock size={11} /> Active
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => settleItem(item.id)}
                    disabled={settling === item.id}
                    className="btn-ghost text-xs flex items-center gap-1"
                  >
                    {settling === item.id
                      ? <Loader2 size={12} className="animate-spin" />
                      : <CheckCircle2 size={12} />
                    }
                    Settle
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settled items */}
      {settled.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-text-muted uppercase tracking-wide font-medium px-1 mt-4">Settled</div>
          {settled.map(item => (
            <div key={item.id} className="card opacity-60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-text-muted">
                    {formatCurrency(item.total_cost)} total
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-brand">
                  <CheckCircle2 size={12} /> Settled
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <p className="text-text-muted text-sm">No shared expenses yet.</p>
          {isOwner && (
            <button onClick={() => setShowForm(true)} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={15} /> Add first expense
            </button>
          )}
        </div>
      )}
    </div>
  )
}
