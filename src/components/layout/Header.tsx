import { Bell, Search } from 'lucide-react'
import { useFinance } from '../../contexts/FinanceContext'
import { formatCurrency } from '../../utils/formatters'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface Props {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: Props) {
  const { state, getTotalForMonth } = useFinance()
  const monthKey = format(new Date(), 'yyyy-MM')
  const total = getTotalForMonth(monthKey, state.activeUserId || undefined)
  const todayLabel = format(new Date(), "EEEE, d 'de' MMMM", { locale: ptBR })

  return (
    <header className="sticky top-0 z-30 bg-surface-950/80 backdrop-blur-md border-b border-white/10 px-8 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">{title}</h1>
          {subtitle && <p className="text-sm text-slate-400 mt-0.5">{subtitle}</p>}
          {!subtitle && <p className="text-sm text-slate-400 capitalize mt-0.5">{todayLabel}</p>}
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-surface-900 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
            <span className="text-xs text-slate-400">Gasto este mês</span>
            <span className="text-sm font-bold text-white">{formatCurrency(total)}</span>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <input
              placeholder="Buscar..."
              className="bg-surface-900 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 w-52 transition-colors"
            />
          </div>

          <button className="relative w-9 h-9 rounded-xl bg-surface-900 border border-white/10 flex items-center justify-center hover:bg-white/5 transition-colors">
            <Bell className="w-4 h-4 text-slate-400" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
          </button>

          {state.activeUserId && (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white border-2"
              style={{
                backgroundColor: `${state.users.find((u) => u.id === state.activeUserId)?.color}33`,
                borderColor: state.users.find((u) => u.id === state.activeUserId)?.color,
              }}
            >
              {state.users.find((u) => u.id === state.activeUserId)?.avatar}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
