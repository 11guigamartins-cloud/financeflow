import { useState } from 'react'
import { Plus, Edit2, Trash2, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Modal } from '../components/ui/Modal'
import { Input, Select, TextArea } from '../components/ui/FormField'
import { Badge } from '../components/ui/Badge'
import { StatCard } from '../components/ui/StatCard'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency } from '../utils/formatters'
import { CATEGORY_MAP, CATEGORIES } from '../utils/constants'
import type { Bill } from '../types'
import { FileText, DollarSign } from 'lucide-react'

interface BillForm {
  userId: string
  name: string
  amount: string
  dueDay: string
  category: Bill['category']
  cardId: string
  isActive: boolean
  note: string
}

function BillModal({ isOpen, onClose, bill }: { isOpen: boolean; onClose: () => void; bill?: Bill }) {
  const { state, dispatch } = useFinance()
  const [form, setForm] = useState<BillForm>({
    userId: bill?.userId ?? state.users[0]?.id ?? '',
    name: bill?.name ?? '',
    amount: bill?.amount?.toString() ?? '',
    dueDay: bill?.dueDay?.toString() ?? '',
    category: bill?.category ?? 'utilities',
    cardId: bill?.cardId ?? '',
    isActive: bill?.isActive ?? true,
    note: bill?.note ?? '',
  })

  const set = <K extends keyof BillForm>(k: K, v: BillForm[K]) => setForm((f) => ({ ...f, [k]: v }))
  const userCards = state.cards.filter((c) => c.userId === form.userId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base: Omit<Bill, 'id'> = {
      userId: form.userId,
      name: form.name,
      amount: Number(form.amount),
      dueDay: Number(form.dueDay),
      category: form.category,
      cardId: form.cardId || undefined,
      isActive: form.isActive,
      note: form.note || undefined,
    }
    if (bill) dispatch({ type: 'UPDATE_BILL', bill: { ...base, id: bill.id } })
    else dispatch({ type: 'ADD_BILL', bill: base })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={bill ? 'Editar Conta' : 'Nova Conta Fixa'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Titular" value={form.userId} onChange={(e) => set('userId', e.target.value)}>
          {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>
        <Input label="Nome da conta" value={form.name} onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Conta de Luz" required />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Valor (R$)" type="number" step="0.01" value={form.amount}
            onChange={(e) => set('amount', e.target.value)} required />
          <Input label="Dia de vencimento" type="number" min={1} max={31} value={form.dueDay}
            onChange={(e) => set('dueDay', e.target.value)} required />
        </div>
        <Select label="Categoria" value={form.category} onChange={(e) => set('category', e.target.value as Bill['category'])}>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
        </Select>
        <Select label="Cartão de pagamento (opcional)" value={form.cardId} onChange={(e) => set('cardId', e.target.value)}>
          <option value="">Boleto / débito automático</option>
          {userCards.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <TextArea label="Observação" value={form.note} onChange={(e) => set('note', e.target.value)} />
        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)}
            className="w-4 h-4 accent-brand-500" />
          <span className="text-sm text-slate-300">Conta ativa</span>
        </label>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-colors text-sm">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            {bill ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Bills() {
  const { state, dispatch } = useFinance()
  const [modalOpen, setModalOpen] = useState(false)
  const [editBill, setEditBill] = useState<Bill | undefined>()

  const userId = state.activeUserId || undefined
  const today = new Date().getDate()

  const bills = state.bills.filter((b) => userId ? b.userId === userId : true)
  const activeBills = bills.filter((b) => b.isActive)
  const totalMonthly = activeBills.reduce((s, b) => s + b.amount, 0)
  const totalAnnual = totalMonthly * 12

  // Sort by due day
  const sorted = [...bills].sort((a, b) => a.dueDay - b.dueDay)

  const getBillStatus = (b: Bill) => {
    if (!b.isActive) return 'inactive'
    if (b.dueDay < today) return 'overdue'
    if (b.dueDay <= today + 5) return 'upcoming'
    return 'ok'
  }

  const handleDelete = (b: Bill) => {
    if (confirm(`Excluir conta "${b.name}"?`)) dispatch({ type: 'DELETE_BILL', billId: b.id })
  }

  // Group by category
  const byCategory = CATEGORIES.map((cat) => {
    const catBills = activeBills.filter((b) => b.category === cat.id)
    return { cat, bills: catBills, total: catBills.reduce((s, b) => s + b.amount, 0) }
  }).filter((x) => x.bills.length > 0)

  return (
    <Layout title="Contas Fixas" subtitle="Controle de gastos recorrentes e despesas fixas">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <StatCard title="Total mensal" value={formatCurrency(totalMonthly)} icon={DollarSign} iconColor="#0ea5e9" />
          <StatCard title="Total anual" value={formatCurrency(totalAnnual)} subtitle="Projeção 12 meses"
            icon={FileText} iconColor="#a855f7" />
          <StatCard title="Contas ativas" value={String(activeBills.length)}
            subtitle={`de ${bills.length} cadastradas`} icon={CheckCircle2} iconColor="#22c55e" />
          <StatCard title="Vencendo em breve"
            value={String(activeBills.filter((b) => b.dueDay >= today && b.dueDay <= today + 5).length)}
            subtitle="Próximos 5 dias" icon={AlertCircle} iconColor="#f97316" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Bills list */}
          <div className="col-span-2 bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="font-semibold text-white">Todas as Contas</h3>
              <button onClick={() => { setEditBill(undefined); setModalOpen(true) }}
                className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-4 h-4" /> Nova Conta
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {sorted.length === 0 ? (
                <div className="p-12 text-center text-slate-500">Nenhuma conta cadastrada</div>
              ) : sorted.map((b) => {
                const cat = CATEGORY_MAP[b.category]
                const card = state.cards.find((c) => c.id === b.cardId)
                const user = state.users.find((u) => u.id === b.userId)
                const status = getBillStatus(b)

                return (
                  <div key={b.id} className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${cat?.color}22` }}>
                      {cat?.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{b.name}</p>
                        {!b.isActive && <Badge color="#64748b">inativa</Badge>}
                        {status === 'overdue' && <Badge color="#ef4444">atrasada?</Badge>}
                        {status === 'upcoming' && <Badge color="#f97316">vence em breve</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                        <span>Vence dia {b.dueDay}</span>
                        {card && <span>{card.name}</span>}
                        {user && <span style={{ color: user.color }}>{user.name}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-white">{formatCurrency(b.amount)}</p>
                      <p className="text-xs text-slate-500">/mês</p>
                    </div>

                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditBill(b); setModalOpen(true) }}
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                      </button>
                      <button onClick={() => handleDelete(b)}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* By category */}
          <div className="space-y-4">
            <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Por Categoria</h3>
              <div className="space-y-3">
                {byCategory.map(({ cat, bills: cBills, total }) => (
                  <div key={cat.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-400">{cat.icon} {cat.label}</span>
                      <span className="text-sm font-medium text-white">{formatCurrency(total)}</span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full"
                        style={{
                          width: `${totalMonthly > 0 ? (total / totalMonthly) * 100 : 0}%`,
                          backgroundColor: cat.color,
                        }} />
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{cBills.length} conta{cBills.length !== 1 ? 's' : ''}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Calendar view - days with due dates */}
            <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
              <h3 className="font-semibold text-white mb-4">Calendário de Vencimentos</h3>
              <div className="space-y-2">
                {sorted.filter((b) => b.isActive).map((b) => {
                  const status = getBillStatus(b)
                  return (
                    <div key={b.id} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        status === 'overdue' ? 'bg-red-500/20 text-red-400' :
                        status === 'upcoming' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-surface-800 text-slate-400'
                      }`}>
                        {b.dueDay}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white truncate">{b.name}</p>
                        <p className="text-xs text-slate-500">{formatCurrency(b.amount)}</p>
                      </div>
                      {status === 'overdue' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                      {status === 'upcoming' && <Clock className="w-4 h-4 text-orange-400 shrink-0" />}
                      {status === 'ok' && <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BillModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditBill(undefined) }} bill={editBill} />
    </Layout>
  )
}
