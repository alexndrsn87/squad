'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Camera, Check, Trophy, Gamepad2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { PlanBadge } from '@/components/ui/Badge'
import type { User } from '@/types/database'

const POSITIONS = [
  { value: 'goalkeeper', label: 'Goalkeeper' },
  { value: 'defensive', label: 'Defensive' },
  { value: 'midfield', label: 'Midfield' },
  { value: 'attacking', label: 'Attacking' },
]

interface Membership {
  team_id: string
  preferred_position: string
  teams: { id: string; name: string; format: number; subscription_status: string } | null
  player_stats: { games_played: number; motm_count: number } | null
}

export function ProfileClient({ user, memberships }: { user: User; memberships: Membership[] }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(user.name)
  const [nickname, setNickname] = useState(user.nickname ?? '')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)

  const totalGames = memberships.reduce((sum, m) => sum + (m.player_stats?.games_played ?? 0), 0)
  const totalMotm = memberships.reduce((sum, m) => sum + (m.player_stats?.motm_count ?? 0), 0)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from('users')
      .update({ name, nickname: nickname || null })
      .eq('id', user.id)

    if (error) {
      toast.error(error.message)
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    }
    setSaving(false)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `avatars/${user.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      toast.error(uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

    await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
    toast.success('Photo updated!')
    router.refresh()
    setUploading(false)
  }

  return (
    <div className="p-5 md:p-8 max-w-xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-3xl tracking-wide mb-1">My profile</h1>
        <p className="text-text-secondary text-sm">How your squad sees you</p>
      </div>

      {/* Stats bar */}
      <div className="card mb-6">
        <div className="grid grid-cols-3 divide-x divide-bg-border">
          <div className="text-center px-2">
            <div className="text-2xl font-display tracking-wide">{memberships.length}</div>
            <div className="text-xs text-text-muted">Teams</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-display tracking-wide">{totalGames}</div>
            <div className="text-xs text-text-muted">Games</div>
          </div>
          <div className="text-center px-2">
            <div className="text-2xl font-display tracking-wide text-yellow-400">{totalMotm}</div>
            <div className="text-xs text-text-muted">🏆 MOTM</div>
          </div>
        </div>
      </div>

      {/* Avatar */}
      <div className="flex justify-center mb-6">
        <div className="relative">
          <Avatar src={user.avatar_url} name={user.name} size="xl" />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand flex items-center justify-center
                       hover:bg-brand-dark transition-colors"
          >
            {uploading ? <LoadingSpinner size="sm" className="border-bg" /> : <Camera size={13} className="text-bg" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Profile form */}
      <form onSubmit={saveProfile} className="space-y-4">
        <div>
          <label className="label" htmlFor="name">Full name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input"
            required
            maxLength={50}
          />
        </div>

        <div>
          <label className="label" htmlFor="nickname">
            Nickname <span className="text-text-muted font-normal normal-case">(shown in-app)</span>
          </label>
          <input
            id="nickname"
            type="text"
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="e.g. Sick Boy, The Gaffer..."
            className="input"
            maxLength={30}
          />
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={user.email}
            className="input opacity-50 cursor-not-allowed"
            disabled
          />
          <p className="text-xs text-text-muted mt-1">Email can&apos;t be changed here</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? <LoadingSpinner size="sm" /> :
           saved ? <><Check size={15} /> Saved</> :
           'Save changes'}
        </button>
      </form>

      {/* Team memberships */}
      {memberships.length > 0 && (
        <div className="mt-8">
          <div className="text-xs text-text-muted uppercase tracking-wide font-medium mb-3">Teams & positions</div>
          <div className="space-y-2">
            {memberships.map(m => (
              m.teams && (
                <div key={m.team_id} className="card flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm">{m.teams.name}</div>
                    <div className="text-xs text-text-muted mt-0.5 capitalize">{m.preferred_position}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {m.player_stats && (
                      <span className="text-xs text-text-muted">{m.player_stats.games_played}g</span>
                    )}
                    <PlanBadge plan={m.teams.subscription_status as 'free' | 'basic' | 'pro'} />
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
