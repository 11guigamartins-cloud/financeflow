import { useState, useMemo } from 'react'
import { Plus, Search, Edit2, Trash2, ArrowUpDown } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { TransactionModal } from '../components/transactions/TransactionModal'
import { Badge } from '../components/ui/Badge'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency } from '../utils/formatters'
import { CATEGORY_MAP, CATEGORIES, PAYMENT_METHOD_LABELS } from '../utils/constants'
import type { Transaction } from '../types'
import { format, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type SortKey = 'date' | 'amount' | 'description'
type SortDir = 'asc' | 'desc'

export function Transactions() {
  const { state, dispatch, getBankAccountById } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editTx, setEditTx] = useState<Transaction | undefined>()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterCard, setFilterCard] = useState('')
  const [filterUser, setFilterUser] = useState(state.activeUserId ?? '')
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [sortKey, setSortKey] = useState<SortKey>('date')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const months = Array.from({ length: 24 }, (_, i) => {
    const d = subMonths(new Date(), i)
    return { key: format(d, 'yyyy-MM'), label: format(d, 'MMMM yyyy', { locale: ptBR }) }
  })

  const filtered = useMemo(() => {
    return state.transactions.filter((t) => {
      const tMonth = t.date.slice(0, 7)
      if (filterMonth && tMonth !== filterMonth) return false
      if (filterUser && t.userId !== filterUser) return false
      if (filterCategory && t.category !== filterCategory) return false
      if (filterCard && t.cardId !== filterCard) return false
      if (search && !t.description.toLowerCase().includes(search.toLowerCase())) return false
      return true
    }).sort((a, b) => {
      let cmp = 0
      if (sortKey === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (sortKey === 'amount') cmp = a.amount - b.amount
      if (sortKey === 'description') cmp = a.description.localeCompare(b.description)
      return sortDir === 'desc' ? -cmp : cmp
    })
  }, [state.transactions, filterMonth, filterUser, filterCategory, filterCard, search, sortKey, sortDir])

  const total = filtered.reduce((s, t) => s + t.amount, 0)

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('desc') }
  }

  const handleDelete = (t: Transaction) => {
    if (confirm(`Excluir "${t.description}"?`))
      dispatch({ type: 'DELETE_TRANSACTION', transactionId: t.id })
  }

  const visibleCards = filterUser
    ? state.cards.filter((c) => c.userId === filterUser)
    : state.cards

  return (
    <Layout title="Transações" subtitle="Histórico completo de gastos">
      <div className="space-y-6">
        {/* Filters bar */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-4">
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar transação..."
                className="w-full bg-surface-800 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500" />
            </div>

            <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}
              className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none capitalize">
              <option value="">Todos os meses</option>
              {months.map((m) => <option key={m.key} value={m.key} className="capitalize">{m.label}</option>)}
            </select>

            <select value={filterUser} onChange={(e) => { setFilterUser(e.target.value); setFilterCard('') }}
              className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">Todos os titulares</option>
              {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            <select value={filterCard} onChange={(e) => setFilterCard(e.target.value)}
              className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">Todos os cartões</option>
              {visibleCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              <option value="">Todas as categorias</option>
              {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
            </select>

            <button onClick={() => { setModalOpen(true); setEditTx(undefined) }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors ml-auto">
              <Plus className="w-4 h-4" /> Nova Transação
            </button>
          </div>
        </div>

        {/* Summary row */}
        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-slate-400">
            <span className="text-white font-semibold">{filtered.length}</span> transações encontradas
          </p>
          <p className="text-sm text-slate-400">
            Total: <span className="text-white font-semibold">{formatCurrency(total)}</span>
          </p>
        </div>

        {/* Table */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                {[
                  { key: 'description' as SortKey, label: 'Descrição' },
                  { key: 'date' as SortKey, label: 'Data' },
                  { key: 'amount' as SortKey, label: 'Valor' },
                ].map(({ key, label }) => (
                  <th key={key} className="px-6 py-4 text-left">
                    <button onClick={() => toggleSort(key)}
                      className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors uppercase tracking-wide">
                      {label}
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                ))}
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Categoria</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Pagamento</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wide">Titular</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              ) : filtered.map((t) => {
                const cat  = CATEGORY_MAP[t.category]
                const card = state.cards.find((c) => c.id === t.cardId)
                const acc  = state.bankAccounts.find((a) => a.id === t.bankAccountId)
                const user = state.users.find((u) => u.id === t.userId)
                const pm   = PAYMENT_METHOD_LABELS[t.paymentMethod ?? 'credit']
                return (
                  <tr key={t.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                          style={{ backgroundColor: `${cat?.color}22` }}>
                          {cat?.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{t.description}</p>
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {t.installment && (
                              <Badge color="#a855f7">{t.installment.current}/{t.installment.total}x</Badge>
                            )}
                            {t.isRecurring && <Badge color="#0ea5e9">recorrente</Badge>}
                            {t.note && <Badge color="#64748b">nota</Badge>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(t.date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {formatCurrency(t.amount)}
                      {t.installment && (
                        <p className="text-xs text-slate-500 font-normal">
                          {formatCurrency(t.installment.amountPerInstallment)}/parcela
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge color={cat?.color}>{cat?.icon} {cat?.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-0.5">
                        <Badge color={pm.color}>{pm.icon} {pm.label}</Badge>
                        {card && (
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <span className={`w-2 h-2 rounded-full bg-gradient-to-br ${card.color}`} />
                            {card.name}
                          </p>
                        )}
                        {acc && (
                          <p className="text-xs text-slate-500">{acc.bank}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user && (
                        <span className="text-xs font-medium px-2 py-1 rounded-full"
                          style={{ backgroundColor: `${user.color}22`, color: user.color }}>
                          {user.name}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditTx(t); setModalOpen(true) }}
                          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => handleDelete(t)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditTx(undefined) }}
        transaction={editTx}
        onAdd={(month) => setFilterMonth(month)}
      />
    </Layout>
  )
}
