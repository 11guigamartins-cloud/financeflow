import { useState, useMemo } from 'react'
import { Plus, Edit2, Trash2, TrendingUp, Clock, CheckCircle2, DollarSign } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Modal } from '../components/ui/Modal'
import { Input, Select, TextArea } from '../components/ui/FormField'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency } from '../utils/formatters'
import { INCOME_CATEGORIES, INCOME_CATEGORY_MAP } from '../utils/constants'
import type { Income } from '../types'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getLast12Months, monthLabel } from '../utils/formatters'

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
}

// ── Income Modal ────────────────────────────────────────────────────────────────

function IncomeModal({ isOpen, onClose, income }: { isOpen: boolean; onClose: () => void; income?: Income }) {
  const { state, dispatch } = useFinance()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    userId:        income?.userId       ?? state.users[0]?.id ?? '',
    description:   income?.description  ?? '',
    amount:        income?.amount?.toString() ?? '',
    date:          income?.date         ?? today,
    category:      (income?.category    ?? 'salary') as Income['category'],
    bankAccountId: income?.bankAccountId ?? '',
    isRecurring:   income?.isRecurring  ?? false,
    status:        (income?.status      ?? 'received') as Income['status'],
    note:          income?.note         ?? '',
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const userAccounts = state.bankAccounts.filter((a) => a.userId === form.userId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base: Omit<Income, 'id'> = {
      userId:        form.userId,
      description:   form.description,
      amount:        Number(form.amount),
      date:          form.date,
      category:      form.category,
      bankAccountId: form.bankAccountId || undefined,
      isRecurring:   form.isRecurring,
      status:        form.status,
      note:          form.note || undefined,
    }
    if (income) dispatch({ type: 'UPDATE_INCOME', income: { ...base, id: income.id } })
    else dispatch({ type: 'ADD_INCOME', income: base })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={income ? 'Editar Entrada' : 'Nova Entrada'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Titular" value={form.userId}
          onChange={(e) => { set('userId', e.target.value); set('bankAccountId', '') }}>
          {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>

        <Input label="Descrição" value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Ex: Salário Janeiro" required />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Valor (R$)" type="number" step="0.01" min="0.01"
            value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          <Input label="Data" type="date" value={form.date}
            onChange={(e) => set('date', e.target.value)} required />
        </div>

        <Select label="Categoria" value={form.category}
          onChange={(e) => set('category', e.target.value as Income['category'])}>
          {INCOME_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </Select>

        <Select label="Conta de destino (opcional)" value={form.bankAccountId}
          onChange={(e) => set('bankAccountId', e.target.value)}>
          <option value="">Selecione a conta...</option>
          {userAccounts.map((a) => (
            <option key={a.id} value={a.id}>{a.name} — {a.bank}</option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Status" value={form.status}
            onChange={(e) => set('status', e.target.value as Income['status'])}>
            <option value="received">✅ Recebido</option>
            <option value="pending">⏳ A receber</option>
          </Select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isRecurring}
            onChange={(e) => set('isRecurring', e.target.checked)}
            className="w-4 h-4 accent-brand-500" />
          <span className="text-sm text-slate-300">Entrada recorrente (mensal)</span>
        </label>

        <TextArea label="Observação" value={form.note}
          onChange={(e) => set('note', e.target.value)} placeholder="Detalhes adicionais..." />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 text-sm">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold text-sm">
            {income ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ── Page ────────────────────────────────────────────────────────────────────────

export function Income() {
  const { state, dispatch, getTotalForMonth, getTotalIncomeForMonth, getIncomesForMonth } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editIncome, setEditIncome] = useState<Income | undefined>()
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [filterUser, setFilterUser] = useState(state.activeUserId ?? '')

  const userId = state.activeUserId || undefined
  const now = new Date()
  const currentMonth = format(now, 'yyyy-MM')
  const lastMonth = format(subMonths(now, 1), 'yyyy-MM')

  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(now, i)
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: ptBR }) }
  })

  const filtered = useMemo(() => {
    return state.incomes.filter((i) => {
      if (filterMonth && i.date.slice(0, 7) !== filterMonth) return false
      if (filterUser && i.userId !== filterUser) return false
      return true
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [state.incomes, filterMonth, filterUser])

  const currentIncome  = getTotalIncomeForMonth(currentMonth, userId)
  const lastIncome     = getTotalIncomeForMonth(lastMonth, userId)
  const currentExpense = getTotalForMonth(currentMonth, userId)
  const net            = currentIncome - currentExpense
  const pendingTotal   = getIncomesForMonth(currentMonth, userId)
    .filter((i) => i.status === 'pending').reduce((s, i) => s + i.amount, 0)

  // 6-month income vs expense chart
  const last6 = getLast12Months().slice(-6)
  const chartData = last6.map((m) => ({
    name: monthLabel(m),
    Entradas: Math.round(getTotalIncomeForMonth(m, userId)),
    Gastos:   Math.round(getTotalForMonth(m, userId)),
  }))

  // By income category this month
  const byCat = INCOME_CATEGORIES.map((cat) => {
    const total = getIncomesForMonth(currentMonth, userId)
      .filter((i) => i.category === cat.id).reduce((s, i) => s + i.amount, 0)
    return { cat, total }
  }).filter((x) => x.total > 0).sort((a, b) => b.total - a.total)

  const handleDelete = (i: Income) => {
    if (confirm(`Excluir "${i.description}"?`))
      dispatch({ type: 'DELETE_INCOME', incomeId: i.id })
  }

  return (
    <Layout title="Entradas & Ganhos" subtitle="Controle salários, freelances e tudo que entra na conta">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard title="Recebido este mês" value={formatCurrency(currentIncome)}
            icon={TrendingUp} iconColor="#22c55e" />
          <StatCard title="A receber este mês" value={formatCurrency(pendingTotal)}
            subtitle="Entradas pendentes" icon={Clock} iconColor="#f97316" />
          <StatCard title="Saldo líquido" value={formatCurrency(net)}
            subtitle="Entradas − Gastos" icon={DollarSign}
            iconColor={net >= 0 ? '#22c55e' : '#ef4444'} />
          <StatCard title="Entradas recorrentes" value={String(
              state.incomes.filter((i) => i.isRecurring && (userId ? i.userId === userId : true)).length
            )}
            subtitle="Mensais cadastradas" icon={CheckCircle2} iconColor="#0ea5e9" />
        </div>

        {/* Chart */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-1">Entradas vs Gastos</h3>
          <p className="text-xs text-slate-400 mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `R$${(v / 1000).toFixed(1)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
              <Legend formatter={(v) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v}</span>} />
              <Bar dataKey="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Gastos"   fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* List + Category breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="col-span-2 bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
            {/* Filters */}
            <div className="flex items-center gap-3 p-5 border-b border-white/10">
              <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none capitalize">
                {months.map((m) => <option key={m.key} value={m.key} className="capitalize">{m.label}</option>)}
              </select>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}
                className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Todos</option>
                {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              <button onClick={() => { setEditIncome(undefined); setModalOpen(true) }}
                className="ml-auto flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nova Entrada
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="p-10 text-center text-slate-500">Nenhuma entrada encontrada</div>
              ) : filtered.map((inc) => {
                const cat  = INCOME_CATEGORY_MAP[inc.category]
                const user = state.users.find((u) => u.id === inc.userId)
                const acc  = state.bankAccounts.find((a) => a.id === inc.bankAccountId)
                return (
                  <div key={inc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                      style={{ backgroundColor: `${cat?.color}22` }}>
                      {cat?.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{inc.description}</p>
                        <Badge color={inc.status === 'received' ? '#22c55e' : '#f97316'}>
                          {inc.status === 'received' ? '✓ Recebido' : '⏳ A receber'}
                        </Badge>
                        {inc.isRecurring && <Badge color="#0ea5e9">recorrente</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>{new Date(inc.date).toLocaleDateString('pt-BR')}</span>
                        {acc && <span>→ {acc.bank} ({acc.name})</span>}
                        {user && <span style={{ color: user.color }}>{user.name}</span>}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-400 shrink-0">
                      +{formatCurrency(inc.amount)}
                    </span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditIncome(inc); setModalOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-white/10">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => handleDelete(inc)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Category breakdown */}
          <div className="space-y-4">
            <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Por Categoria (mês atual)</h3>
              {byCat.length === 0 ? (
                <p className="text-slate-500 text-sm">Sem entradas este mês</p>
              ) : (
                <div className="space-y-3">
                  {byCat.map(({ cat, total }) => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-slate-400">{cat.icon} {cat.label}</span>
                        <span className="text-sm font-medium text-white">{formatCurrency(total)}</span>
                      </div>
                      <div className="w-full bg-white/10 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full"
                          style={{
                            width: `${currentIncome > 0 ? (total / currentIncome) * 100 : 0}%`,
                            backgroundColor: cat.color,
                          }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Net balance card */}
            <div className={`rounded-2xl p-5 border ${
              net >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'
            }`}>
              <p className="text-xs text-slate-400 mb-1">Saldo Líquido do Mês</p>
              <p className={`text-3xl font-bold ${net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(Math.abs(net))}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                {net >= 0 ? '✅ Sobrou' : '⚠️ Faltou'} este mês
              </p>
              <div className="mt-3 space-y-1 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Entradas</span>
                  <span className="text-green-400">+{formatCurrency(currentIncome)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Gastos</span>
                  <span className="text-red-400">-{formatCurrency(currentExpense)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <IncomeModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditIncome(undefined) }}
        income={editIncome}
      />
    </Layout>
  )
}
