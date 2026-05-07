import { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  TrendingDown, TrendingUp, Layers, Plus, ArrowRight, Calendar, Landmark, Wallet
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency, getLast12Months, monthLabel } from '../utils/formatters'
import { CATEGORY_MAP, CATEGORIES, PAYMENT_METHOD_LABELS } from '../utils/constants'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { format, addMonths } from 'date-fns'
import { Badge } from '../components/ui/Badge'
import { buildInstallmentGroups } from './Installments'

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
}

export function Dashboard() {
  const {
    state, getTransactionsForMonth, getTotalForMonth, getTotalSpendingForMonth,
    getCardUsageForMonth, getTotalBankBalance, getTotalIncomeForMonth,
  } = useFinance()
  const [addOpen, setAddOpen] = useState(false)

  const userId = state.activeUserId || undefined
  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const lastMonth = format(addMonths(now, -1), 'yyyy-MM')

  const currentTotal   = getTotalSpendingForMonth(currentMonth, userId)
  const lastTotal      = getTotalSpendingForMonth(lastMonth, userId)
  const trendPct       = lastTotal > 0 ? ((currentTotal - lastTotal) / lastTotal) * 100 : 0
  const totalBalance   = getTotalBankBalance(userId)
  const currentIncome  = getTotalIncomeForMonth(currentMonth, userId)
  const netMonth       = currentIncome - currentTotal

  // Last 6 months area chart data
  const last6 = getLast12Months().slice(-6)
  const areaData = last6.map((m) => ({
    name: monthLabel(m),
    Gastos:   Math.round(getTotalSpendingForMonth(m, userId)),
    Entradas: Math.round(getTotalIncomeForMonth(m, userId)),
    ...Object.fromEntries(
      state.users.map((u) => [u.name, Math.round(getTotalSpendingForMonth(m, u.id))])
    ),
  }))

  // Category breakdown: transactions + active bills
  const currentTxns = getTransactionsForMonth(currentMonth, userId)
  const currentBills = state.bills.filter((b) => b.isActive && (userId ? b.userId === userId : true))
  const byCategory = CATEGORIES.map((cat) => {
    const txnTotal  = currentTxns.filter((t) => t.category === cat.id).reduce((s, t) => s + t.amount, 0)
    const billTotal = currentBills.filter((b) => b.category === cat.id).reduce((s, b) => s + b.amount, 0)
    return { name: cat.label, value: Math.round(txnTotal + billTotal), color: cat.color, icon: cat.icon }
  }).filter((c) => c.value > 0).sort((a, b) => b.value - a.value)

  // Payment method breakdown
  const byPaymentMethod = (['credit', 'debit', 'pix', 'cash'] as const).map((pm) => {
    const total = currentTxns.filter((t) => t.paymentMethod === pm).reduce((s, t) => s + t.amount, 0)
    const meta  = PAYMENT_METHOD_LABELS[pm]
    return { ...meta, value: Math.round(total) }
  }).filter((p) => p.value > 0)

  // Card usage
  const userCards = userId ? state.cards.filter((c) => c.userId === userId) : state.cards
  const cardData = userCards.map((c) => ({
    name:   `${c.name.substring(0, 12)} ••${c.lastFourDigits}`,
    usado:  Math.round(getCardUsageForMonth(c.id, currentMonth)),
    limite: c.limit ?? 0,
  }))

  // Installments — use the same grouping as the Installments page so
  // mid-series entries and duplicate records don't inflate the numbers
  const installmentTxns = state.transactions.filter(
    (t) => t.installment && (userId ? t.userId === userId : true)
  )
  const installmentGroups = buildInstallmentGroups(installmentTxns)
  const activeGroups = installmentGroups.filter((g) => !g.isComplete)
  const totalInstallmentDebt = activeGroups.reduce((s, g) => s + g.totalRemaining, 0)

  // Recent transactions
  const recent = [...state.transactions]
    .filter((t) => userId ? t.userId === userId : true)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  // Projection
  const last3 = getLast12Months().slice(-3)
  const avgLast3 = last3.reduce((s, m) => s + getTotalSpendingForMonth(m, userId), 0) / 3

  const daysPassed = now.getDate()
  const avgDaily = daysPassed > 0 ? currentTotal / daysPassed : 0

  // Bank accounts summary
  const visibleAccounts = userId
    ? state.bankAccounts.filter((a) => a.userId === userId)
    : state.bankAccounts

  return (
    <Layout title="Dashboard" subtitle="Visão geral das suas finanças">
      <div className="space-y-6">

        {/* Stat cards row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard title="Gasto este mês"   value={formatCurrency(currentTotal)}
            icon={TrendingDown} iconColor="#ef4444"
            trend={{ value: trendPct, label: 'vs mês anterior' }} />
          <StatCard title="Entradas (mês)"   value={formatCurrency(currentIncome)}
            subtitle="Recebido no mês" icon={TrendingUp} iconColor="#22c55e" />
          <StatCard title="Saldo líquido"    value={formatCurrency(Math.abs(netMonth))}
            subtitle={netMonth >= 0 ? '✅ Sobrou este mês' : '⚠️ Gastou mais que recebeu'}
            icon={Wallet} iconColor={netMonth >= 0 ? '#22c55e' : '#ef4444'} />
          <StatCard title="Saldo em contas"  value={formatCurrency(totalBalance)}
            subtitle={`${visibleAccounts.length} conta${visibleAccounts.length !== 1 ? 's' : ''}`}
            icon={Landmark} iconColor="#0ea5e9" />
        </div>

        {/* Stat cards row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard title="Média diária" value={formatCurrency(avgDaily)}
            subtitle={`${daysPassed} dias`} icon={Calendar} iconColor="#f97316" />
          <StatCard title="Parcelas em aberto" value={formatCurrency(totalInstallmentDebt)}
            subtitle={`${activeGroups.length} parcelamento${activeGroups.length !== 1 ? 's' : ''}`}
            icon={Layers} iconColor="#a855f7" />
          <StatCard title="Projeção próx. mês" value={formatCurrency(avgLast3)}
            subtitle="Média 3 meses" icon={TrendingDown} iconColor="#94a3b8" />
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-2">Métodos de pagamento</p>
            <div className="space-y-1.5">
              {byPaymentMethod.slice(0, 3).map((p) => (
                <div key={p.label} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">{p.icon} {p.label}</span>
                  <span className="text-xs font-semibold text-white">{formatCurrency(p.value)}</span>
                </div>
              ))}
              {byPaymentMethod.length === 0 && (
                <p className="text-xs text-slate-500">Sem gastos este mês</p>
              )}
            </div>
          </div>
        </div>

        {/* Bank accounts quick view */}
        {visibleAccounts.length > 0 && (
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Saldo nas Contas</h3>
              <span className="text-sm font-bold text-green-400">{formatCurrency(totalBalance)} total</span>
            </div>
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(visibleAccounts.length, 4)}, 1fr)` }}>
              {visibleAccounts.map((acc) => {
                const user = state.users.find((u) => u.id === acc.userId)
                return (
                  <div key={acc.id} className="bg-surface-800 rounded-xl p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: acc.color }} />
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${acc.color}22` }}>
                        <Landmark className="w-3.5 h-3.5" style={{ color: acc.color }} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-white font-medium truncate">{acc.name}</p>
                        <p className="text-xs text-slate-500">{acc.bank}</p>
                      </div>
                    </div>
                    <p className="text-base font-bold" style={{ color: acc.balance >= 0 ? '#22c55e' : '#ef4444' }}>
                      {formatCurrency(acc.balance)}
                    </p>
                    {user && (
                      <p className="text-xs mt-0.5" style={{ color: user.color }}>{user.name}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Area chart */}
          <div className="col-span-2 bg-surface-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-white">Entradas vs Gastos</h3>
                <p className="text-xs text-slate-400 mt-0.5">Últimos 6 meses</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={areaData}>
                <defs>
                  <linearGradient id="gastosGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="entradasGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
                <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
                <Area type="monotone" dataKey="Entradas" stroke="#22c55e" fill="url(#entradasGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="Gastos"   stroke="#ef4444" fill="url(#gastosGrad)"   strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">Categorias</h3>
            <p className="text-xs text-slate-400 mb-4">Este mês</p>
            {byCategory.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={byCategory} cx="50%" cy="50%" innerRadius={42} outerRadius={65}
                      paddingAngle={3} dataKey="value">
                      {byCategory.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {byCategory.slice(0, 5).map((c) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{c.icon} {c.name}</span>
                      <span className="text-xs font-medium text-white">{formatCurrency(c.value)}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-40 text-slate-500 text-sm">
                Sem gastos este mês
              </div>
            )}
          </div>
        </div>

        {/* Card usage + Recent transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-1">Uso por Cartão</h3>
            <p className="text-xs text-slate-400 mb-4">Gasto este mês</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={cardData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={(v) => `R$${v}`} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }}
                  axisLine={false} tickLine={false} width={120} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
                <Bar dataKey="usado" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent transactions */}
          <div className="col-span-2 bg-surface-900 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-white">Últimas Transações</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mais recentes</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setAddOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-lg text-xs font-medium hover:bg-brand-500/30 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Nova
                </button>
                <a href="/transactions"
                  className="flex items-center gap-1 px-3 py-1.5 text-slate-400 hover:text-white rounded-lg text-xs transition-colors">
                  Ver todas <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
            <div className="space-y-1">
              {recent.map((t) => {
                const cat  = CATEGORY_MAP[t.category]
                const card = state.cards.find((c) => c.id === t.cardId)
                const acc  = state.bankAccounts.find((a) => a.id === t.bankAccountId)
                const user = state.users.find((u) => u.id === t.userId)
                const pm   = PAYMENT_METHOD_LABELS[t.paymentMethod]
                return (
                  <div key={t.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0"
                      style={{ backgroundColor: `${cat?.color}22` }}>
                      {cat?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium text-white truncate">{t.description}</p>
                        {t.installment && (
                          <Badge color="#a855f7">{t.installment.current}/{t.installment.total}x</Badge>
                        )}
                        <Badge color={pm.color}>{pm.icon} {pm.label}</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                        {card && <span>{card.name}</span>}
                        {acc  && <span>{acc.bank}</span>}
                        {user && <span style={{ color: user.color }}>{user.name}</span>}
                        <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-white shrink-0">
                      -{formatCurrency(t.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* User comparison */}
        {!userId && state.users.length > 1 && (
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-4">Comparativo do Casal</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              {state.users.map((u) => {
                const uTotal  = getTotalSpendingForMonth(currentMonth, u.id)
                const uIncome = getTotalIncomeForMonth(currentMonth, u.id)
                const uNet    = uIncome - uTotal
                const uPct    = currentTotal > 0 ? (uTotal / currentTotal) * 100 : 0
                const uBal    = getTotalBankBalance(u.id)
                const uTxns   = getTransactionsForMonth(currentMonth, u.id)
                const uBills  = state.bills.filter((b) => b.isActive && b.userId === u.id)
                const uCategories = CATEGORIES.map((cat) => ({
                  cat,
                  val: uTxns.filter((t) => t.category === cat.id).reduce((s, t) => s + t.amount, 0)
                    + uBills.filter((b) => b.category === cat.id).reduce((s, b) => s + b.amount, 0),
                })).filter((x) => x.val > 0).sort((a, b) => b.val - a.val).slice(0, 3)

                return (
                  <div key={u.id} className="bg-surface-800 rounded-xl p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: u.color }}>
                        {u.avatar}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-white">{u.name}</p>
                        <p className="text-xs text-slate-400">{uPct.toFixed(0)}% dos gastos do casal</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                      <div className="bg-surface-900 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Gastos</p>
                        <p className="text-sm font-bold text-red-400">{formatCurrency(uTotal)}</p>
                      </div>
                      <div className="bg-surface-900 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Entradas</p>
                        <p className="text-sm font-bold text-green-400">{formatCurrency(uIncome)}</p>
                      </div>
                      <div className="bg-surface-900 rounded-lg p-2">
                        <p className="text-xs text-slate-500">Saldo contas</p>
                        <p className="text-sm font-bold text-brand-400">{formatCurrency(uBal)}</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5 mb-3">
                      <div className="h-1.5 rounded-full" style={{ width: `${uPct}%`, backgroundColor: u.color }} />
                    </div>
                    <div className="space-y-1">
                      {uCategories.map(({ cat, val }) => (
                        <div key={cat.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">{cat.icon} {cat.label}</span>
                          <span className="text-white font-medium">{formatCurrency(val)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <TransactionModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </Layout>
  )
}
