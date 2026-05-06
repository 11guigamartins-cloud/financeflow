import { useState } from 'react'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts'
import { Layout } from '../components/layout/Layout'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency, getLast12Months, monthLabel } from '../utils/formatters'
import { CATEGORIES, CATEGORY_MAP } from '../utils/constants'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { TrendingUp, TrendingDown, BarChart2, PieChart as PieIcon, Target } from 'lucide-react'

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
}

export function Reports() {
  const { state, getTransactionsForMonth, getTotalForMonth } = useFinance()
  const [period, setPeriod] = useState<3 | 6 | 12>(6)

  const userId = state.activeUserId || undefined
  const now = new Date()

  const months = getLast12Months().slice(-period)
  const currentMonth = format(now, 'yyyy-MM')
  const lastMonth = format(subMonths(now, 1), 'yyyy-MM')

  // Monthly trend data
  const trendData = months.map((m) => {
    const row: Record<string, string | number> = { name: monthLabel(m) }
    row['Total'] = Math.round(getTotalForMonth(m, userId))
    state.users.forEach((u) => {
      row[u.name] = Math.round(getTotalForMonth(m, u.id))
    })
    return row
  })

  // Category breakdown comparison (current vs last month)
  const categoryCompare = CATEGORIES.map((cat) => {
    const curr = getTransactionsForMonth(currentMonth, userId)
      .filter((t) => t.category === cat.id).reduce((s, t) => s + t.amount, 0)
    const last = getTransactionsForMonth(lastMonth, userId)
      .filter((t) => t.category === cat.id).reduce((s, t) => s + t.amount, 0)
    return {
      name: cat.label,
      icon: cat.icon,
      color: cat.color,
      'Este mês': Math.round(curr),
      'Mês anterior': Math.round(last),
      diff: curr - last,
    }
  }).filter((c) => c['Este mês'] > 0 || c['Mês anterior'] > 0)
    .sort((a, b) => b['Este mês'] - a['Este mês'])

  // Top categories this month
  const topCategories = [...categoryCompare].sort((a, b) => b['Este mês'] - a['Este mês']).slice(0, 6)

  // Category radar (spending profile)
  const radarData = CATEGORIES.map((cat) => ({
    category: cat.label.substring(0, 8),
    value: Math.round(
      months.reduce((s, m) => s + getTransactionsForMonth(m, userId)
        .filter((t) => t.category === cat.id).reduce((ss, t) => ss + t.amount, 0), 0) / months.length
    ),
  })).filter((d) => d.value > 0)

  // User comparison over period
  const userCompare = state.users.map((u) => {
    const totals = months.map((m) => getTotalForMonth(m, u.id))
    const total = totals.reduce((s, v) => s + v, 0)
    const avg = total / months.length
    const max = Math.max(...totals)
    const topCat = CATEGORIES.map((cat) => ({
      cat,
      val: months.reduce(
        (s, m) => s + getTransactionsForMonth(m, u.id).filter((t) => t.category === cat.id).reduce((ss, t) => ss + t.amount, 0),
        0
      ),
    })).sort((a, b) => b.val - a.val)[0]

    return { user: u, total, avg, max, topCat }
  })

  // Biggest single expenses
  const biggestExpenses = [...state.transactions]
    .filter((t) => {
      if (userId && t.userId !== userId) return false
      const m = t.date.slice(0, 7)
      return months.includes(m)
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 8)

  // Monthly avg by day of week (spending pattern)
  const dayOfWeekData = Array.from({ length: 7 }, (_, i) => {
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][i]
    const dayTxns = state.transactions.filter((t) => {
      if (userId && t.userId !== userId) return false
      return new Date(t.date).getDay() === i
    })
    return {
      day: dayName,
      média: Math.round(
        dayTxns.length > 0 ? dayTxns.reduce((s, t) => s + t.amount, 0) / Math.max(dayTxns.length, 1) : 0
      ),
    }
  })

  return (
    <Layout title="Relatórios" subtitle="Análises detalhadas e projeções financeiras">
      <div className="space-y-6">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">Período:</span>
          {([3, 6, 12] as const).map((p) => (
            <button key={p} onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:bg-white/5 border border-transparent'
              }`}>
              {p} meses
            </button>
          ))}
        </div>

        {/* Trend line */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-brand-400" />
            <h3 className="font-semibold text-white">Evolução dos Gastos</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => formatCurrency(v)} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              {userId ? (
                <Line type="monotone" dataKey="Total" stroke="#0ea5e9" strokeWidth={2.5}
                  dot={{ fill: '#0ea5e9', r: 4 }} activeDot={{ r: 6 }} />
              ) : (
                state.users.map((u) => (
                  <Line key={u.id} type="monotone" dataKey={u.name} stroke={u.color} strokeWidth={2.5}
                    dot={{ fill: u.color, r: 3 }} />
                ))
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category comparison + Radar */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart2 className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold text-white">Categorias: Este vs Anterior</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={categoryCompare.slice(0, 7)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false}
                  tickLine={false} width={80} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => formatCurrency(v)} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 11 }}>{v}</span>} />
                <Bar dataKey="Este mês" fill="#0ea5e9" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Mês anterior" fill="#334155" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <Target className="w-5 h-5 text-brand-400" />
              <h3 className="font-semibold text-white">Perfil de Gastos (Radar)</h3>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff15" />
                <PolarAngleAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                <Radar name="Média mensal" dataKey="value" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.2}
                  strokeWidth={2} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => formatCurrency(v)} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Day of week pattern + User comparison */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">Padrão por Dia da Semana</h3>
            <p className="text-xs text-slate-400 mb-4">Gasto médio por transação</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dayOfWeekData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$${v}`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="média" fill="#a855f7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* User comparison */}
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Comparativo de Titulares</h3>
            <div className="space-y-4">
              {userCompare.map(({ user, total, avg, max, topCat }) => (
                <div key={user.id} className="bg-surface-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white"
                      style={{ backgroundColor: user.color }}>
                      {user.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">Total no período: {formatCurrency(total)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-xs text-slate-500">Média/mês</p>
                      <p className="text-sm font-semibold text-white">{formatCurrency(avg)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Pico</p>
                      <p className="text-sm font-semibold text-white">{formatCurrency(max)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Top categoria</p>
                      <p className="text-sm font-semibold text-white">
                        {topCat?.cat.icon} {topCat?.cat.label.substring(0, 6)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Biggest expenses */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Maiores Gastos do Período</h3>
          <div className="grid grid-cols-2 gap-3">
            {biggestExpenses.map((t, i) => {
              const cat = CATEGORY_MAP[t.category]
              const user = state.users.find((u) => u.id === t.userId)
              const card = state.cards.find((c) => c.id === t.cardId)
              return (
                <div key={t.id} className="flex items-center gap-3 bg-surface-800 rounded-xl p-4">
                  <span className="text-2xl font-bold text-slate-600 w-7 shrink-0">#{i + 1}</span>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${cat?.color}22` }}>
                    {cat?.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(t.date).toLocaleDateString('pt-BR')} · {card?.name} · <span style={{ color: user?.color }}>{user?.name}</span>
                    </p>
                  </div>
                  <span className="text-sm font-bold text-white shrink-0">{formatCurrency(t.amount)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </Layout>
  )
}
