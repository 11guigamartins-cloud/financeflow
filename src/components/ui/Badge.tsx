interface Props {
  children: React.ReactNode
  color?: string
  className?: string
}

export function Badge({ children, color = '#64748b', className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${className}`}
      style={{ backgroundColor: `${color}22`, color }}
    >
      {children}
    </span>
  )
}
