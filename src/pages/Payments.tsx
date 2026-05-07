import { useState, useMemo } from 'react'
import { CheckCircle2, Circle, Plus, Trash2, Receipt, CreditCard, FileText, ChevronLeft, ChevronRight } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency } from '../utils/formatters'
import { CATEGORY_MAP } from '../utils/constants'
import type { Boleto } from '../types'
import { format, addMonths, subMonths, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

type Tab = 'bills' | 'invoices' | 'boletos'

// ─── Boleto Modal ──────────────────────────────────────────────────────────────

interface BoletoModalProps {
  isOpen: boolean
  onClose: () => void
  boleto?: Boleto
}

function BoletoModal({ isOpen, onClose, boleto }: BoletoModalProps) {
  const { state, dispatch } = useFinance()
  const blank = {
    userId: state.activeUserId ?? state.users[0]?.id ?? '',
    description: '',
    amount: '',
    dueDate: format(new Date(), 'yyyy-MM-dd'),
    barcode: '',
    isPaid: false,
    paidDate: '',
    bankAccountId: '',
    note: '',
  }
  const [form, setForm] = useState(boleto
    ? { ...boleto, amount: String(boleto.amount), paidDate: boleto.paidDate ?? '', barcode: boleto.barcode ?? '', bankAccountId: boleto.bankAccountId ?? '', note: boleto.note ?? '' }
    : blank
  )

  if (!isOpen) return null

  const userAccounts = state.bankAccounts.filter((a) => a.userId === form.userId)

  function save() {
    if (!form.description || !form.amount || !form.dueDate) return
    const payload = {
      userId: form.userId,
      description: form.description,
      amount: parseFloat(form.amount),
      dueDate: form.dueDate,
      barcode: form.barcode || undefined,
      isPaid: form.isPaid,
      paidDate: form.isPaid && form.paidDate ? form.paidDate : undefined,
      bankAccountId: form.bankAccountId || undefined,
      note: form.note || undefined,
    }
    if (boleto) {
      dispatch({ type: 'UPDATE_BOLETO', boleto: { ...payload, id: boleto.id } })
    } else {
      dispatch({ type: 'ADD_BOLETO', boleto: payload })
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">{boleto ? 'Editar Boleto' : 'Novo Boleto'}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Titular</label>
            <select value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value, bankAccountId: '' })}
              className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
              {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Descrição *</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Boleto IPVA 2025"
              className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Valor *</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0,00"
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Vencimento *</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Código de barras</label>
            <input value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              placeholder="000.00000 00000.000000 00000.000000 0 00000000000000"
              className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-brand-500" />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-800 border border-white/10">
            <button type="button" onClick={() => setForm({ ...form, isPaid: !form.isPaid })}
              className="shrink-0">
              {form.isPaid
                ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                : <Circle className="w-5 h-5 text-slate-500" />}
            </button>
            <span className="text-sm text-white">Já foi pago</span>
          </div>
          {form.isPaid && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Data do pagamento</label>
                <input type="date" value={form.paidDate} onChange={(e) => setForm({ ...form, paidDate: e.target.value })}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Conta debitada</label>
                <select value={form.bankAccountId} onChange={(e) => setForm({ ...form, bankAccountId: e.target.value })}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                  <option value="">Não informar</option>
                  {userAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank} – {a.name}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Observação</label>
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
          </div>
        </div>
        <div className="p-6 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={save} className="flex-1 py-2.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">Salvar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Pay Confirmation Modal ────────────────────────────────────────────────────

interface ConfirmPayModalProps {
  title: string
  amount: number
  userId: string
  currentDate?: string
  prefillBankAccountId?: string
  onConfirm: (date: string, bankAccountId: string) => void
  onCancel: () => void
}

function ConfirmPayModal({ title, amount, userId, currentDate, prefillBankAccountId, onConfirm, onCancel }: ConfirmPayModalProps) {
  const { state } = useFinance()
  const [date, setDate] = useState(currentDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [bankAccountId, setBankAccountId] = useState(prefillBankAccountId ?? '')
  const userAccounts = state.bankAccounts.filter((a) => a.userId === userId)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-sm">
        <div className="p-6">
          <h3 className="text-base font-semibold text-white mb-1">Confirmar Pagamento</h3>
          <p className="text-sm text-slate-400 mb-4">{title} — <span className="text-white font-medium">{formatCurrency(amount)}</span></p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Data do pagamento</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Conta debitada</label>
              <select value={bankAccountId} onChange={(e) => setBankAccountId(e.target.value)}
                className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none">
                <option value="">Não informar</option>
                {userAccounts.map((a) => <option key={a.id} value={a.id}>{a.bank} – {a.name}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-white/10 rounded-xl text-sm text-slate-400 hover:text-white transition-colors">Cancelar</button>
          <button onClick={() => onConfirm(date, bankAccountId)}
            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-medium transition-colors">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function Payments() {
  const { state, dispatch, getBillPayment, getInvoicePayment, getCardUsageForMonth } = useFinance()
  const [tab, setTab] = useState<Tab>('bills')
  const [monthDate, setMonthDate] = useState(new Date())
  const monthKey = format(monthDate, 'yyyy-MM')
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR })

  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'bill' | 'invoice' | 'boleto'
    id: string
    title: string
    amount: number
    userId: string
    currentDate?: string
    prefillBankAccountId?: string
  } | null>(null)

  const [boletoModal, setBoletoModal] = useState(false)
  const [editBoleto, setEditBoleto] = useState<Boleto | undefined>()

  // ── Bills tab ──────────────────────────────────────────────────────────────
  const activeBills = useMemo(() =>
    state.bills.filter((b) => b.isActive && (!state.activeUserId || b.userId === state.activeUserId)),
    [state.bills, state.activeUserId]
  )

  const billsSummary = useMemo(() => {
    const total = activeBills.reduce((s, b) => s + b.amount, 0)
    const paid = activeBills.filter((b) => getBillPayment(b.id, monthKey)?.isPaid).reduce((s, b) => s + b.amount, 0)
    return { total, paid, pending: total - paid }
  }, [activeBills, monthKey, getBillPayment])

  // ── Invoice tab ────────────────────────────────────────────────────────────
  const creditCards = useMemo(() =>
    state.cards.filter((c) => (c.type === 'credit' || c.type === 'both') && (!state.activeUserId || c.userId === state.activeUserId)),
    [state.cards, state.activeUserId]
  )

  const invoiceSummary = useMemo(() => {
    const total = creditCards.reduce((s, c) => s + getCardUsageForMonth(c.id, monthKey), 0)
    const paid = creditCards
      .filter((c) => getInvoicePayment(c.id, monthKey)?.isPaid)
      .reduce((s, c) => s + getCardUsageForMonth(c.id, monthKey), 0)
    return { total, paid, pending: total - paid }
  }, [creditCards, monthKey, getCardUsageForMonth, getInvoicePayment])

  // ── Boletos tab ────────────────────────────────────────────────────────────
  const boletos = useMemo(() =>
    state.boletos
      .filter((b) => !state.activeUserId || b.userId === state.activeUserId)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [state.boletos, state.activeUserId]
  )

  const boletosSummary = useMemo(() => {
    const pending = boletos.filter((b) => !b.isPaid)
    const total = pending.reduce((s, b) => s + b.amount, 0)
    return { total, count: pending.length }
  }, [boletos])

  // ── Handlers ───────────────────────────────────────────────────────────────
  function handleBillToggle(billId: string) {
    const payment = getBillPayment(billId, monthKey)
    const bill = state.bills.find((b) => b.id === billId)!
    if (payment?.isPaid) {
      dispatch({ type: 'UPSERT_BILL_PAYMENT', payment: { id: payment.id, billId, monthKey, amount: bill.amount, isPaid: false, paidDate: undefined, bankAccountId: undefined } })
    } else {
      const userId = bill.userId
      setConfirmTarget({ type: 'bill', id: billId, title: bill.name, amount: payment?.amount ?? bill.amount, userId })
    }
  }

  function handleInvoiceToggle(cardId: string) {
    const payment = getInvoicePayment(cardId, monthKey)
    const card = state.cards.find((c) => c.id === cardId)!
    const amount = getCardUsageForMonth(cardId, monthKey)
    if (payment?.isPaid) {
      dispatch({ type: 'UPSERT_INVOICE_PAYMENT', payment: { id: payment.id, cardId, monthKey, amount, isPaid: false, paidDate: undefined, bankAccountId: undefined } })
    } else {
      setConfirmTarget({ type: 'invoice', id: cardId, title: `Fatura ${card.name}`, amount: payment?.amount ?? amount, userId: card.userId, prefillBankAccountId: card.bankAccountId })
    }
  }

  function handleBoletoToggle(boleto: Boleto) {
    if (boleto.isPaid) {
      dispatch({ type: 'UPDATE_BOLETO', boleto: { ...boleto, isPaid: false, paidDate: undefined, bankAccountId: undefined } })
    } else {
      setConfirmTarget({ type: 'boleto', id: boleto.id, title: boleto.description, amount: boleto.amount, userId: boleto.userId })
    }
  }

  function handleConfirm(date: string, bankAccountId: string) {
    if (!confirmTarget) return
    const { type, id } = confirmTarget
    if (type === 'bill') {
      const bill = state.bills.find((b) => b.id === id)!
      dispatch({ type: 'UPSERT_BILL_PAYMENT', payment: { billId: id, monthKey, amount: bill.amount, isPaid: true, paidDate: date, bankAccountId: bankAccountId || undefined } })
    } else if (type === 'invoice') {
      const amount = getCardUsageForMonth(id, monthKey)
      dispatch({ type: 'UPSERT_INVOICE_PAYMENT', payment: { cardId: id, monthKey, amount, isPaid: true, paidDate: date, bankAccountId: bankAccountId || undefined } })
    } else {
      const boleto = state.boletos.find((b) => b.id === id)!
      dispatch({ type: 'UPDATE_BOLETO', boleto: { ...boleto, isPaid: true, paidDate: date, bankAccountId: bankAccountId || undefined } })
    }
    setConfirmTarget(null)
  }

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'bills',    label: 'Contas do Mês',    icon: FileText   },
    { key: 'invoices', label: 'Faturas de Cartão', icon: CreditCard },
    { key: 'boletos',  label: 'Boletos',           icon: Receipt    },
  ]

  return (
    <Layout title="Pagamentos" subtitle="Controle de contas, faturas e boletos">
      <div className="space-y-6">

        {/* Month navigator + tabs */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setMonthDate((d) => subMonths(d, 1))}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-white font-medium capitalize text-sm w-36 text-center">{monthLabel}</span>
              <button onClick={() => setMonthDate((d) => addMonths(d, 1))}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {tab === 'boletos' && (
              <button onClick={() => { setEditBoleto(undefined); setBoletoModal(true) }}
                className="flex items-center gap-2 px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
                <Plus className="w-3.5 h-3.5" /> Novo Boleto
              </button>
            )}
          </div>
          <div className="flex gap-1 bg-surface-800 rounded-xl p-1">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${
                  tab === key ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-white'
                }`}>
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── BILLS TAB ──────────────────────────────────────────────────── */}
        {tab === 'bills' && (
          <>
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              {[
                { label: 'Total do Mês', value: billsSummary.total, color: 'text-white' },
                { label: 'Pago', value: billsSummary.paid, color: 'text-emerald-400' },
                { label: 'Pendente', value: billsSummary.pending, color: 'text-rose-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-900 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
              {activeBills.length === 0 ? (
                <p className="text-center text-slate-500 py-12">Nenhuma conta fixa cadastrada</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {activeBills.map((bill) => {
                    const payment = getBillPayment(bill.id, monthKey)
                    const isPaid = payment?.isPaid ?? false
                    const cat = CATEGORY_MAP[bill.category]
                    const user = state.users.find((u) => u.id === bill.userId)
                    const linkedCard = bill.cardId ? state.cards.find((c) => c.id === bill.cardId) : undefined
                    return (
                      <div key={bill.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isPaid ? 'opacity-60' : 'hover:bg-white/5'}`}>
                        <button onClick={() => handleBillToggle(bill.id)} className="shrink-0">
                          {isPaid
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors" />}
                        </button>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                          style={{ backgroundColor: `${cat?.color}22` }}>
                          {cat?.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isPaid ? 'line-through text-slate-500' : 'text-white'}`}>{bill.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-xs text-slate-500">Vence dia {bill.dueDay}</p>
                            {linkedCard && (
                              <span className="text-xs text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded-md">
                                via fatura {linkedCard.name}
                              </span>
                            )}
                            {payment?.paidDate && (
                              <p className="text-xs text-emerald-400">Pago em {new Date(payment.paidDate).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                        </div>
                        {user && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ backgroundColor: `${user.color}22`, color: user.color }}>{user.name}</span>
                        )}
                        <p className={`text-sm font-semibold shrink-0 ${isPaid ? 'text-emerald-400' : 'text-white'}`}>
                          {formatCurrency(bill.amount)}
                        </p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── INVOICES TAB ───────────────────────────────────────────────── */}
        {tab === 'invoices' && (
          <>
            <div className="grid grid-cols-3 gap-3 lg:gap-4">
              {[
                { label: 'Total Faturas', value: invoiceSummary.total, color: 'text-white' },
                { label: 'Pago', value: invoiceSummary.paid, color: 'text-emerald-400' },
                { label: 'Pendente', value: invoiceSummary.pending, color: 'text-rose-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-900 border border-white/10 rounded-2xl p-4 text-center">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{formatCurrency(value)}</p>
                </div>
              ))}
            </div>

            <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
              {creditCards.length === 0 ? (
                <p className="text-center text-slate-500 py-12">Nenhum cartão de crédito cadastrado</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {creditCards.map((card) => {
                    const invoiceAmount = getCardUsageForMonth(card.id, monthKey)
                    const payment = getInvoicePayment(card.id, monthKey)
                    const isPaid = payment?.isPaid ?? false
                    const user = state.users.find((u) => u.id === card.userId)
                    return (
                      <div key={card.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isPaid ? 'opacity-60' : invoiceAmount > 0 ? 'hover:bg-white/5' : 'opacity-40'}`}>
                        <button onClick={() => invoiceAmount > 0 && handleInvoiceToggle(card.id)}
                          className={`shrink-0 ${invoiceAmount === 0 ? 'cursor-not-allowed' : ''}`}>
                          {isPaid
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : <Circle className={`w-5 h-5 ${invoiceAmount > 0 ? 'text-slate-500 hover:text-slate-300' : 'text-slate-700'} transition-colors`} />}
                        </button>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                          <CreditCard className="w-4 h-4 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${isPaid ? 'line-through text-slate-500' : 'text-white'}`}>{card.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-slate-500">{card.bank}{card.dueDay ? ` · vence dia ${card.dueDay}` : ''}</p>
                            {payment?.paidDate && (
                              <p className="text-xs text-emerald-400">Pago em {new Date(payment.paidDate).toLocaleDateString('pt-BR')}</p>
                            )}
                          </div>
                        </div>
                        {user && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ backgroundColor: `${user.color}22`, color: user.color }}>{user.name}</span>
                        )}
                        <div className="text-right shrink-0">
                          <p className={`text-sm font-semibold ${isPaid ? 'text-emerald-400' : invoiceAmount > 0 ? 'text-white' : 'text-slate-600'}`}>
                            {formatCurrency(invoiceAmount)}
                          </p>
                          {invoiceAmount === 0 && <p className="text-xs text-slate-600">sem gastos</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* ── BOLETOS TAB ────────────────────────────────────────────────── */}
        {tab === 'boletos' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-900 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Pendentes</p>
                <p className="text-lg font-bold text-rose-400">{formatCurrency(boletosSummary.total)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{boletosSummary.count} boleto{boletosSummary.count !== 1 ? 's' : ''}</p>
              </div>
              <div className="bg-surface-900 border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-xs text-slate-400 mb-1">Total cadastrado</p>
                <p className="text-lg font-bold text-white">{boletos.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">{boletos.filter((b) => b.isPaid).length} pagos</p>
              </div>
            </div>

            <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
              {boletos.length === 0 ? (
                <div className="text-center py-16">
                  <Receipt className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm">Nenhum boleto cadastrado</p>
                  <button onClick={() => { setEditBoleto(undefined); setBoletoModal(true) }}
                    className="mt-4 px-4 py-2 bg-brand-500/20 text-brand-400 rounded-xl text-sm hover:bg-brand-500/30 transition-colors">
                    Adicionar boleto
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {boletos.map((boleto) => {
                    const user = state.users.find((u) => u.id === boleto.userId)
                    const due = parseISO(boleto.dueDate)
                    const isOverdue = !boleto.isPaid && due < new Date()
                    return (
                      <div key={boleto.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${boleto.isPaid ? 'opacity-60' : 'hover:bg-white/5'}`}>
                        <button onClick={() => handleBoletoToggle(boleto)} className="shrink-0">
                          {boleto.isPaid
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : <Circle className="w-5 h-5 text-slate-500 hover:text-slate-300 transition-colors" />}
                        </button>
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                          <Receipt className="w-4 h-4 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${boleto.isPaid ? 'line-through text-slate-500' : 'text-white'}`}>{boleto.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {boleto.isPaid && boleto.paidDate
                              ? <p className="text-xs text-emerald-400">Pago em {new Date(boleto.paidDate).toLocaleDateString('pt-BR')}</p>
                              : <p className={`text-xs ${isOverdue ? 'text-rose-400' : 'text-slate-500'}`}>
                                  {isOverdue ? '⚠ Vencido em ' : 'Vence em '}
                                  {due.toLocaleDateString('pt-BR')}
                                </p>
                            }
                            {boleto.barcode && <p className="text-xs text-slate-600 font-mono truncate max-w-32">{boleto.barcode.slice(0, 20)}…</p>}
                          </div>
                        </div>
                        {user && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                            style={{ backgroundColor: `${user.color}22`, color: user.color }}>{user.name}</span>
                        )}
                        <p className={`text-sm font-semibold shrink-0 ${boleto.isPaid ? 'text-emerald-400' : isOverdue ? 'text-rose-400' : 'text-white'}`}>
                          {formatCurrency(boleto.amount)}
                        </p>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditBoleto(boleto); setBoletoModal(true) }}
                            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                            <FileText className="w-3.5 h-3.5 text-slate-400" />
                          </button>
                          <button onClick={() => { if (confirm(`Excluir "${boleto.description}"?`)) dispatch({ type: 'DELETE_BOLETO', boletoId: boleto.id }) }}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors">
                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {confirmTarget && (
        <ConfirmPayModal
          title={confirmTarget.title}
          amount={confirmTarget.amount}
          userId={confirmTarget.userId}
          currentDate={confirmTarget.currentDate}
          prefillBankAccountId={confirmTarget.prefillBankAccountId}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
        />
      )}

      <BoletoModal
        key={editBoleto?.id ?? 'new-boleto'}
        isOpen={boletoModal}
        onClose={() => { setBoletoModal(false); setEditBoleto(undefined) }}
        boleto={editBoleto}
      />
    </Layout>
  )
}
