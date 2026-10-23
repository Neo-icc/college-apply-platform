import { cn } from '../../lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'pending'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-ding-100 text-ding-700',
  success: 'bg-emerald-100 text-emerald-700',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  muted: 'bg-gray-100 text-gray-600',
  pending: 'bg-purple-100 text-purple-700',
}

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
  dot?: boolean
}

export function Badge({ variant = 'default', className, children, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

// 节点状态映射到 badge variant
export function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case 'completed': return 'success'
    case 'in_progress': return 'info'
    case 'pending_confirm': return 'pending'
    case 'overdue': return 'danger'
    case 'stalled': return 'warning'
    default: return 'muted'
  }
}
