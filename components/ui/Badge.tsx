import { cn, statusBg, statusLabel } from '@/lib/utils'

interface BadgeProps {
  status: string
  children?: React.ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ status, children, className, dot = false }: BadgeProps) {
  return (
    <span className={cn('badge', statusBg(status), className)}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children ?? statusLabel(status)}
    </span>
  )
}

interface PlanBadgeProps {
  plan: 'free' | 'basic' | 'pro'
  className?: string
}

export function PlanBadge({ plan, className }: PlanBadgeProps) {
  const styles = {
    free: 'bg-white/10 text-text-secondary',
    basic: 'bg-blue-500/15 text-blue-400',
    pro: 'bg-brand/15 text-brand',
  }
  const labels = { free: 'Free', basic: 'Basic', pro: 'Pro' }

  return (
    <span className={cn('badge', styles[plan], className)}>
      {plan === 'pro' && <span className="text-[10px]">⚡</span>}
      {labels[plan]}
    </span>
  )
}
