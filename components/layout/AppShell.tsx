'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Calendar, ShoppingBag,
  User, LogOut, Menu, X, ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui/Avatar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User as UserType } from '@/types/database'

interface AppShellProps {
  children: React.ReactNode
  user: UserType
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/teams', icon: Users, label: 'Teams' },
  { href: '/games', icon: Calendar, label: 'Games' },
  { href: '/shop', icon: ShoppingBag, label: 'Shop' },
  { href: '/profile', icon: User, label: 'Profile' },
]

export function AppShell({ children, user }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = user.nickname ?? user.name.split(' ')[0]

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-display text-3xl tracking-widest text-brand">SQUAD</span>
        </Link>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand/10 text-brand'
                  : 'text-text-secondary hover:text-text-primary hover:bg-white/5'
              )}
            >
              <Icon className="w-4.5 h-4.5" size={18} />
              {label}
              {active && <ChevronRight className="ml-auto w-3.5 h-3.5 text-brand/60" />}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="p-3 border-t border-bg-border">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg">
          <Avatar src={user.avatar_url} name={user.name} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-text-primary truncate">{displayName}</div>
            <div className="text-xs text-text-muted truncate">{user.email}</div>
          </div>
          <button
            onClick={handleSignOut}
            className="p-1.5 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="flex h-screen bg-bg overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 bg-bg-card border-r border-bg-border flex-shrink-0">
        <NavContent />
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-bg-card border-b border-bg-border px-4 py-3 flex items-center justify-between">
        <span className="font-display text-2xl tracking-widest text-brand">SQUAD</span>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute top-0 left-0 bottom-0 w-56 bg-bg-card border-r border-bg-border flex flex-col pt-14">
            <NavContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="md:hidden h-14" /> {/* mobile header spacer */}
        {children}
      </main>
    </div>
  )
}
