import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' }

  return (
    <div
      className={cn(
        'border-2 border-bg-border border-t-brand rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl font-display tracking-widest text-brand">SQUAD</div>
        <LoadingSpinner size="md" />
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="card animate-pulse">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-bg-border" />
        <div className="flex-1">
          <div className="h-4 bg-bg-border rounded w-1/3 mb-2" />
          <div className="h-3 bg-bg-border rounded w-1/4" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-bg-border rounded" />
        <div className="h-3 bg-bg-border rounded w-4/5" />
      </div>
    </div>
  )
}
