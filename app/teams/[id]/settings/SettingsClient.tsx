'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Loader2, RefreshCw, Trash2, Copy, Check } from 'lucide-react'
import type { Team } from '@/types/database'

interface SettingsClientProps {
  team: Team
  inviteCode: string | null
  memberCount: number
}

export function SettingsClient({ team, inviteCode: initialCode, memberCount }: SettingsClientProps) {
  const router = useRouter()
  const [name, setName] = useState(team.name)
  const [venue, setVenue] = useState(team.venue ?? '')
  const [format, setFormat] = useState<5 | 6 | 7>(team.format as 5 | 6 | 7)
  const [saving, setSaving] = useState(false)
  const [inviteCode, setInviteCode] = useState(initialCode)
  const [generatingCode, setGeneratingCode] = useState(false)
  const [copied, setCopied] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const inviteUrl = inviteCode ? `${window?.location?.origin ?? ''}/teams/join/${inviteCode}` : null

  async function saveDetails() {
    setSaving(true)
    const res = await fetch(`/api/teams/${team.id}/settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), venue: venue.trim() || null, format }),
    })
    setSaving(false)
    if (res.ok) {
      toast.success('Settings saved')
      router.refresh()
    } else {
      const d = await res.json()
      toast.error(d.error ?? 'Failed to save')
    }
  }

  async function regenerateInvite() {
    setGeneratingCode(true)
    const res = await fetch(`/api/teams/${team.id}/invite`, { method: 'POST' })
    const data = await res.json()
    setGeneratingCode(false)
    if (data.invite_code) {
      setInviteCode(data.invite_code)
      toast.success('New invite link generated')
    }
  }

  async function copyInvite() {
    if (!inviteUrl) return
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Team details */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Team Details</h2>

        <div>
          <label className="label">Team name</label>
          <input
            className="input"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
          />
        </div>

        <div>
          <label className="label">Venue <span className="text-text-muted">(optional)</span></label>
          <input
            className="input"
            value={venue}
            onChange={e => setVenue(e.target.value)}
            placeholder="e.g. Powerleague Shoreditch"
            maxLength={100}
          />
        </div>

        <div>
          <label className="label">Format</label>
          <div className="flex gap-2">
            {([5, 6, 7] as const).map(f => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  format === f
                    ? 'bg-brand text-bg border-brand'
                    : 'border-bg-border text-text-secondary hover:border-text-secondary'
                }`}
              >
                {f}-a-side
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={saveDetails}
          disabled={saving || !name.trim()}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saving ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : 'Save changes'}
        </button>
      </div>

      {/* Invite link */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-sm text-text-secondary uppercase tracking-wide">Invite Link</h2>
        {inviteUrl ? (
          <>
            <div className="bg-bg-elevated rounded-xl px-3 py-2 font-mono text-xs text-text-muted break-all">
              {inviteUrl}
            </div>
            <div className="flex gap-2">
              <button
                onClick={copyInvite}
                className="flex-1 btn-ghost flex items-center justify-center gap-1.5 text-sm"
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
              </button>
              <button
                onClick={regenerateInvite}
                disabled={generatingCode}
                className="flex-1 btn-ghost flex items-center justify-center gap-1.5 text-sm"
              >
                {generatingCode
                  ? <><Loader2 size={14} className="animate-spin" /> Regenerating…</>
                  : <><RefreshCw size={14} /> New link</>
                }
              </button>
            </div>
            <p className="text-xs text-text-muted">
              Links expire after 7 days. Regenerate to invalidate the old one.
            </p>
          </>
        ) : (
          <button
            onClick={regenerateInvite}
            disabled={generatingCode}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {generatingCode
              ? <><Loader2 size={15} className="animate-spin" /> Generating…</>
              : 'Generate invite link'
            }
          </button>
        )}
      </div>

      {/* Danger zone */}
      <div className="card border-red-900/40 space-y-3">
        <h2 className="font-semibold text-sm text-red-400 uppercase tracking-wide">Danger Zone</h2>
        <p className="text-sm text-text-muted">
          Deleting the team permanently removes all games, stats, and player data. This cannot be undone.
        </p>
        <DeleteTeamButton teamId={team.id} teamName={team.name} />
      </div>
    </div>
  )
}

function DeleteTeamButton({ teamId, teamName }: { teamId: string; teamName: string }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function deleteTeam() {
    setDeleting(true)
    const res = await fetch(`/api/teams/${teamId}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success('Team deleted')
      router.push('/teams')
    } else {
      toast.error('Failed to delete team')
      setDeleting(false)
    }
  }

  if (confirm) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-400">
          Type <strong>{teamName}</strong> to confirm deletion:
        </p>
        <ConfirmDeleteInput teamName={teamName} onConfirm={deleteTeam} onCancel={() => setConfirm(false)} deleting={deleting} />
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="btn-danger flex items-center gap-2"
    >
      <Trash2 size={15} /> Delete team
    </button>
  )
}

function ConfirmDeleteInput({
  teamName,
  onConfirm,
  onCancel,
  deleting,
}: {
  teamName: string
  onConfirm: () => void
  onCancel: () => void
  deleting: boolean
}) {
  const [value, setValue] = useState('')
  return (
    <div className="space-y-2">
      <input
        className="input"
        placeholder={teamName}
        value={value}
        onChange={e => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={value !== teamName || deleting}
          className="btn-danger flex-1 flex items-center justify-center gap-2"
        >
          {deleting ? <><Loader2 size={14} className="animate-spin" /> Deleting…</> : 'Confirm delete'}
        </button>
        <button onClick={onCancel} className="btn-ghost flex-1">Cancel</button>
      </div>
    </div>
  )
}
