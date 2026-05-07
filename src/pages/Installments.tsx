import { useState } from 'react'
import { Layers, CheckCircle2, Clock, AlertTriangle, Plus, ChevronDown, ChevronUp, Edit2, Trash2 } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency, formatDate } from '../utils/formatters'
import { CATEGORY_MAP } from '../utils/constants'
import { addMonths, format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { Transaction } from '../types'

interface InstallmentGroup {
  rep: Transaction          // representative (earliest known entry)
  entries: Transaction[]    // all entered installment records for this series
  paidCount: number         // highest installment number entered (= paid up to this point)
  total: number             // total installments
  perInstallment: number
  totalRemaining: number
  nextDueDate: string
  isComplete: boolean
}

// Build installment groups from transactions.
// Groups by (description + cardId). Within each group the highest
// installment_current value is considered the latest paid installment.
export function buildInstallmentGroups(txns: Transaction[]): InstallmentGroup[] {
  const map = new Map<string, Transaction[]>()
  txns.forEach((t) => {
    const key = `${t.description}||${t.cardId ?? t.bankAccountId ?? ''}`
    const arr = map.get(key) ?? []
    arr.push(t)
    map.set(key, arr)
  })

  return Array.from(map.values()).map((entries) => {
    entries.sort((a, b) => (a.installment!.current) - (b.installment!.current))
    const rep = entries[0]
    const latest = entries[entries.length - 1]
    const paidCount = latest.installment!.current
    const total = rep.installment!.total
    const perInstallment = rep.installment!.amountPerInstallment
    const remaining = total - paidCount
    const totalRemaining = remaining * perInstallment

    // Next due = date of latest entry + 1 month
    const nextDueDate = format(addMonths(parseISO(latest.date), 1), 'yyyy-MM-dd')

    return { rep, entries, paidCount, total, perInstallment, totalRemaining, nextDueDate, isComplete: remaining === 0 }
  })
}

export function Installments() {
  const { state, dispatch } = useFinance()
  const [addOpen, setAddOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | undefined>()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'complete'>('active')

  function handleDelete(g: InstallmentGroup) {
    const label = `"${g.rep.description}" (${g.paidCount}/${g.total} parcelas)`
    if (!confirm(`Excluir o parcelamento ${label} e todos os seus registros?`)) return
    g.entries.forEach((t) => dispatch({ type: 'DELETE_TRANSACTION', transactionId: t.id }))
    if (expandedId === g.rep.id) setExpandedId(null)
  }

  const userId = state.activeUserId || undefined

  const txns = state.transactions.filter((t) => t.installment && (userId ? t.userId === userId : true))
  const groups = buildInstallmentGroups(txns)

  const filtered = groups.filter((g) => {
    if (filter === 'active') return !g.isComplete
    if (filter === 'complete') return g.isComplete
    return true
  })

  const totalDebt        = groups.filter((g) => !g.isComplete).reduce((s, g) => s + g.totalRemaining, 0)
  const monthlyCommit    = groups.filter((g) => !g.isComplete).reduce((s, g) => s + g.perInstallment, 0)
  const activeCount      = groups.filter((g) => !g.isComplete).length
  const completedCount   = groups.filter((g) => g.isComplete).length

  // Next 3 months projection
  const now = new Date()
  const projectionMonths = Array.from({ length: 3 }, (_, i) => {
    const d = addMonths(now, i + 1)
    const mKey = format(d, 'yyyy-MM')
    const mLabel = format(d, 'MMMM yyyy', { locale: ptBR })
    const amount = groups
      .filter((g) => !g.isComplete)
      .reduce((s, g) => {
        const latestEntry = g.entries[g.entries.length - 1]
        const latestDate = parseISO(latestEntry.date)
        // Project future installments starting from the month after the latest entry
        for (let n = 1; n <= g.total - g.paidCount; n++) {
          const dueMonth = format(addMonths(latestDate, n), 'yyyy-MM')
          if (dueMonth === mKey) return s + g.perInstallment
        }
        return s
      }, 0)
    return { label: mLabel, amount }
  })

  return (
    <Layout title="Parcelamentos" subtitle="Monitore todas as suas compras parceladas">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard title="Dívida total em parcelas" value={formatCurrency(totalDebt)} icon={Layers} iconColor="#a855f7" />
          <StatCard title="Compromisso mensal" value={formatCurrency(monthlyCommit)}
            subtitle="Próximas parcelas/mês" icon={Clock} iconColor="#f97316" />
          <StatCard title="Parcelamentos ativos" value={String(activeCount)}
            subtitle="Em andamento" icon={AlertTriangle} iconColor="#ef4444" />
          <StatCard title="Concluídos" value={String(completedCount)}
            subtitle="Quitados" icon={CheckCircle2} iconColor="#22c55e" />
        </div>

        {/* Next 3 months projection */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Projeção — Próximos 3 Meses</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {projectionMonths.map((m) => (
              <div key={m.label} className="bg-surface-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 capitalize mb-2">{m.label}</p>
                <p className="text-xl font-bold text-white">{formatCurrency(m.amount)}</p>
                <p className="text-xs text-slate-500 mt-1">em parcelas previstas</p>
              </div>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex gap-2">
              {(['all', 'active', 'complete'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filter === f
                      ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}>
                  {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Concluídos'}
                </button>
              ))}
            </div>
            <button onClick={() => setAddOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Nova Compra Parcelada
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                Nenhum parcelamento {filter === 'active' ? 'ativo' : filter === 'complete' ? 'concluído' : ''}
              </div>
            ) : filtered.map((g) => {
              const cat  = CATEGORY_MAP[g.rep.category]
              const card = state.cards.find((c) => c.id === g.rep.cardId)
              const user = state.users.find((u) => u.id === g.rep.userId)
              const pct  = (g.paidCount / g.total) * 100
              const isExpanded = expandedId === g.rep.id

              return (
                <div key={g.rep.id}>
                  <div
                    className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : g.rep.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${cat?.color}22` }}>
                        {cat?.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-medium text-white">{g.rep.description}</p>
                          {g.isComplete
                            ? <Badge color="#22c55e">✓ Quitado</Badge>
                            : <Badge color="#f97316">Próxima: {new Date(g.nextDueDate).toLocaleDateString('pt-BR')}</Badge>
                          }
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                          {card && <span>{card.name} ••{card.lastFourDigits}</span>}
                          {user && <span style={{ color: user.color }}>{user.name}</span>}
                          <span>{formatDate(g.rep.date)}</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{g.paidCount}/{g.total} parcelas pagas</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div className="h-1.5 rounded-full transition-all"
                              style={{ width: `${pct}%`, backgroundColor: g.isComplete ? '#22c55e' : '#0ea5e9' }} />
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(g.perInstallment)}
                          <span className="text-xs text-slate-400 font-normal">/mês</span>
                        </p>
                        {!g.isComplete && (
                          <p className="text-xs text-slate-400 mt-0.5">Restam {formatCurrency(g.totalRemaining)}</p>
                        )}
                        <p className="text-xs text-slate-500">
                          Total: {formatCurrency(g.total * g.perInstallment)}
                        </p>
                      </div>

                      <div className="ml-2 flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditTx(g.rep); setAddOpen(true) }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-400 hover:bg-brand-500/10 transition-colors"
                          title="Editar">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(g) }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="text-slate-500 ml-1">
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded installment timeline */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-surface-800/50">
                      <p className="text-xs text-slate-400 mb-3 pt-2">Linha do tempo das parcelas</p>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: g.total }, (_, i) => {
                          const num = i + 1
                          const isPaid = num <= g.paidCount
                          const isCurrent = num === g.paidCount + 1
                          return (
                            <div key={num}
                              className={`rounded-lg p-2 text-center border text-xs ${
                                isPaid
                                  ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                                  : isCurrent
                                  ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                                  : 'bg-surface-800 border-white/10 text-slate-500'
                              }`}>
                              <p className="font-bold">{num}ª</p>
                              <p>{isPaid ? '✓' : isCurrent ? '→' : '○'}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <TransactionModal
        key={editTx?.id ?? 'new'}
        isOpen={addOpen}
        onClose={() => { setAddOpen(false); setEditTx(undefined) }}
        transaction={editTx}
      />
    </Layout>
  )
}
