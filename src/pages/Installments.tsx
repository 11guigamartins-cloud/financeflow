import { useState } from 'react'
import { Layers, CheckCircle2, Clock, AlertTriangle, Plus, ChevronDown, ChevronUp } from 'lucide-react'
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
  firstTx: Transaction
  allInstallments: Transaction[]
  totalPaid: number
  totalRemaining: number
  nextDueDate: string
  isComplete: boolean
}

export function Installments() {
  const { state } = useFinance()
  const [addOpen, setAddOpen] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'complete'>('active')

  const userId = state.activeUserId || undefined

  // Group by purchase (match by description + card + approximate date)
  // Strategy: group transactions that share the same description, cardId and are clearly a series
  const txns = state.transactions.filter((t) => t.installment && (userId ? t.userId === userId : true))

  // Build groups from "first installment" entries
  const firstInstallments = txns.filter((t) => t.installment?.current === 1)

  const groups: InstallmentGroup[] = firstInstallments.map((first) => {
    // Find all sibling installments (same description + cardId)
    const siblings = txns.filter(
      (t) => t.description === first.description && t.cardId === first.cardId
    ).sort((a, b) => (a.installment?.current ?? 0) - (b.installment?.current ?? 0))

    const total = first.installment!.total
    const paid = siblings.length
    const remaining = total - paid
    const perInstallment = first.installment!.amountPerInstallment
    const totalPaid = paid * perInstallment
    const totalRemaining = remaining * perInstallment

    // Next due date: base date of first + paid months
    const baseDate = parseISO(first.date)
    const nextDueDate = format(addMonths(baseDate, paid), 'yyyy-MM-dd')

    return {
      firstTx: first,
      allInstallments: siblings,
      totalPaid,
      totalRemaining,
      nextDueDate,
      isComplete: remaining === 0,
    }
  })

  const filtered = groups.filter((g) => {
    if (filter === 'active') return !g.isComplete
    if (filter === 'complete') return g.isComplete
    return true
  })

  const totalDebt = groups.filter((g) => !g.isComplete).reduce((s, g) => s + g.totalRemaining, 0)
  const monthlyCommitment = groups.filter((g) => !g.isComplete).reduce(
    (s, g) => s + g.firstTx.installment!.amountPerInstallment, 0
  )
  const activeCount = groups.filter((g) => !g.isComplete).length
  const completedCount = groups.filter((g) => g.isComplete).length

  // Next 3 months projection
  const now = new Date()
  const projectionMonths = Array.from({ length: 3 }, (_, i) => {
    const d = addMonths(now, i + 1)
    const mKey = format(d, 'yyyy-MM')
    const mLabel = format(d, 'MMMM yyyy', { locale: ptBR })
    const amount = groups
      .filter((g) => !g.isComplete)
      .reduce((s, g) => {
        const first = g.firstTx
        const paid = g.allInstallments.length
        const total = first.installment!.total
        const baseDate = parseISO(first.date)
        for (let p = paid; p < total; p++) {
          const dueMonth = format(addMonths(baseDate, p), 'yyyy-MM')
          if (dueMonth === mKey) return s + first.installment!.amountPerInstallment
        }
        return s
      }, 0)
    return { label: mLabel, amount }
  })

  return (
    <Layout title="Parcelamentos" subtitle="Monitore todas as suas compras parceladas">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="Dívida total em parcelas" value={formatCurrency(totalDebt)} icon={Layers} iconColor="#a855f7" />
          <StatCard title="Compromisso mensal" value={formatCurrency(monthlyCommitment)}
            subtitle="Próximas parcelas/mês" icon={Clock} iconColor="#f97316" />
          <StatCard title="Parcelamentos ativos" value={String(activeCount)}
            subtitle="Em andamento" icon={AlertTriangle} iconColor="#ef4444" />
          <StatCard title="Concluídos" value={String(completedCount)}
            subtitle="Quitados" icon={CheckCircle2} iconColor="#22c55e" />
        </div>

        {/* Next months projection */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-4">Projeção — Próximos 3 Meses</h3>
          <div className="grid grid-cols-3 gap-4">
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
              const cat = CATEGORY_MAP[g.firstTx.category]
              const card = state.cards.find((c) => c.id === g.firstTx.cardId)
              const user = state.users.find((u) => u.id === g.firstTx.userId)
              const paid = g.allInstallments.length
              const total = g.firstTx.installment!.total
              const pct = (paid / total) * 100
              const isExpanded = expandedId === g.firstTx.id

              return (
                <div key={g.firstTx.id}>
                  <div
                    className="p-6 hover:bg-white/5 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : g.firstTx.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${cat?.color}22` }}>
                        {cat?.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-white">{g.firstTx.description}</p>
                          {g.isComplete && <Badge color="#22c55e">✓ Quitado</Badge>}
                          {!g.isComplete && (
                            <Badge color="#f97316">
                              Próxima: {new Date(g.nextDueDate).toLocaleDateString('pt-BR')}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {card && <span>{card.name} ••{card.lastFourDigits}</span>}
                          {user && <span style={{ color: user.color }}>{user.name}</span>}
                          <span>{formatDate(g.firstTx.date)}</span>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-xs text-slate-400 mb-1">
                            <span>{paid}/{total} parcelas pagas</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-1.5">
                            <div
                              className="h-1.5 rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: g.isComplete ? '#22c55e' : '#0ea5e9',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-white">
                          {formatCurrency(g.firstTx.installment!.amountPerInstallment)}
                          <span className="text-xs text-slate-400 font-normal">/mês</span>
                        </p>
                        {!g.isComplete && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            Restam {formatCurrency(g.totalRemaining)}
                          </p>
                        )}
                        <p className="text-xs text-slate-500">
                          Total: {formatCurrency(g.firstTx.installment!.total * g.firstTx.installment!.amountPerInstallment)}
                        </p>
                      </div>

                      <div className="ml-2 text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded installment timeline */}
                  {isExpanded && (
                    <div className="px-6 pb-6 bg-surface-800/50">
                      <p className="text-xs text-slate-400 mb-3 pt-2">Linha do tempo das parcelas</p>
                      <div className="grid grid-cols-6 gap-2">
                        {Array.from({ length: total }, (_, i) => {
                          const installNum = i + 1
                          const isPaid = installNum <= paid
                          const isCurrent = installNum === paid + 1
                          return (
                            <div key={installNum}
                              className={`rounded-lg p-2 text-center border text-xs ${
                                isPaid
                                  ? 'bg-brand-500/20 border-brand-500/30 text-brand-400'
                                  : isCurrent
                                  ? 'bg-orange-500/20 border-orange-500/30 text-orange-400'
                                  : 'bg-surface-800 border-white/10 text-slate-500'
                              }`}
                            >
                              <p className="font-bold">{installNum}ª</p>
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

      <TransactionModal isOpen={addOpen} onClose={() => setAddOpen(false)} />
    </Layout>
  )
}
