import type { LucideIcon } from 'lucide-react'

interface Props {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  iconColor?: string
  trend?: { value: number; label: string }
  className?: string
}

export function StatCard({ title, value, subtitle, icon: Icon, iconColor = '#0ea5e9', trend, className = '' }: Props) {
  const trendUp = trend && trend.value >= 0

  return (
    <div className={`bg-surface-900 border border-white/10 rounded-2xl p-5 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${iconColor}22` }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        {trend && (
          <span
            className="text-xs font-medium px-2 py-1 rounded-full"
            style={{
              backgroundColor: trendUp ? '#ef444422' : '#22c55e22',
              color: trendUp ? '#ef4444' : '#22c55e',
            }}
          >
            {trendUp ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-slate-400 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {trend && <p className="text-xs text-slate-500 mt-1">{trend.label}</p>}
    </div>
  )
}
