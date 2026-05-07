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
  editableAmount?: boolean
  onConfirm: (date: string, bankAccountId: string, amount: number) => void
  onCancel: () => void
}

function ConfirmPayModal({ title, amount: initialAmount, userId, currentDate, prefillBankAccountId, editableAmount, onConfirm, onCancel }: ConfirmPayModalProps) {
  const { state } = useFinance()
  const [date, setDate] = useState(currentDate ?? format(new Date(), 'yyyy-MM-dd'))
  const [bankAccountId, setBankAccountId] = useState(prefillBankAccountId ?? '')
  const [amount, setAmount] = useState(initialAmount)
  const userAccounts = state.bankAccounts.filter((a) => a.userId === userId)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-sm">
        <div className="p-6">
          <h3 className="text-base font-semibold text-white mb-1">Confirmar Pagamento</h3>
          <p className="text-sm text-slate-400 mb-4">{title}</p>
          <div className="space-y-3">
            {editableAmount ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Valor da fatura (R$)</label>
                <input type="number" step="0.01" value={amount} onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-surface-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-500" />
                <p className="text-xs text-slate-500 mt-1">Ajuste se o valor real da fatura for diferente</p>
              </div>
            ) : (
              <div className="bg-surface-800 rounded-xl px-3 py-2 flex justify-between items-center">
                <span className="text-xs text-slate-400">Valor</span>
                <span className="text-white font-semibold">{formatCurrency(amount)}</span>
              </div>
            )}
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
          <button onClick={() => onConfirm(date, bankAccountId, amount)}
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
  const { state, dispatch, getBillPayment, getInvoicePayment, getCardUsageForMonth, getBankAccountById } = useFinance()
  const [tab, setTab] = useState<Tab>('bills')
  const [monthDate, setMonthDate] = useState(new Date())
  const monthKey = format(monthDate, 'yyyy-MM')
  const monthLabel = format(monthDate, 'MMMM yyyy', { locale: ptBR })
  const currentMonthKey = format(new Date(), 'yyyy-MM')

  const [confirmTarget, setConfirmTarget] = useState<{
    type: 'bill' | 'invoice' | 'boleto'
    id: string
    title: string
    amount: number
    userId: string
    currentDate?: string
    prefillBankAccountId?: string
    editableAmount?: boolean
  } | null>(null)

  function adjustBalance(bankAccountId: string | undefined, delta: number) {
    if (!bankAccountId) return
    const account = getBankAccountById(bankAccountId)
    if (!account) return
    dispatch({ type: 'SET_BANK_BALANCE', accountId: bankAccountId, balance: account.balance + delta })
  }

  const [boletoModal, setBoletoModal] = useState(false)
  const [editBoleto, setEditBoleto] = useState<Boleto | undefined>()

  // ── Bills tab ──────────────────────────────────────────────────────────────
  // Only show bills NOT on a card — those appear inside the card invoice
  const activeBills = useMemo(() =>
    state.bills.filter((b) => b.isActive && !b.cardId && (!state.activeUserId || b.userId === state.activeUserId)),
    [state.bills, state.activeUserId]
  )
  // Card-linked bills (informational only — paid via invoice)
  const cardLinkedBills = useMemo(() =>
    state.bills.filter((b) => b.isActive && !!b.cardId && (!state.activeUserId || b.userId === state.activeUserId)),
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
      adjustBalance(payment.bankAccountId, payment.amount)
      dispatch({ type: 'UPSERT_BILL_PAYMENT', payment: { id: payment.id, billId, monthKey, amount: bill.amount, isPaid: false, paidDate: undefined, bankAccountId: undefined } })
    } else {
      setConfirmTarget({ type: 'bill', id: billId, title: bill.name, amount: payment?.amount ?? bill.amount, userId: bill.userId })
    }
  }

  function handleInvoiceToggle(cardId: string) {
    const payment = getInvoicePayment(cardId, monthKey)
    const card = state.cards.find((c) => c.id === cardId)!
    const computedAmount = getCardUsageForMonth(cardId, monthKey)
    if (payment?.isPaid) {
      adjustBalance(payment.bankAccountId, payment.amount)
      dispatch({ type: 'UPSERT_INVOICE_PAYMENT', payment: { id: payment.id, cardId, monthKey, amount: computedAmount, isPaid: false, paidDate: undefined, bankAccountId: undefined } })
    } else {
      setConfirmTarget({ type: 'invoice', id: cardId, title: `Fatura ${card.name}`, amount: payment?.amount ?? computedAmount, userId: card.userId, prefillBankAccountId: card.bankAccountId, editableAmount: true })
    }
  }

  function handleBoletoToggle(boleto: Boleto) {
    if (boleto.isPaid) {
      adjustBalance(boleto.bankAccountId, boleto.amount)
      dispatch({ type: 'UPDATE_BOLETO', boleto: { ...boleto, isPaid: false, paidDate: undefined, bankAccountId: undefined } })
    } else {
      setConfirmTarget({ type: 'boleto', id: boleto.id, title: boleto.description, amount: boleto.amount, userId: boleto.userId })
    }
  }

  function handleConfirm(date: string, bankAccountId: string, amount: number) {
    if (!confirmTarget) return
    const { type, id } = confirmTarget
    const acctId = bankAccountId || undefined
    if (type === 'bill') {
      const bill = state.bills.find((b) => b.id === id)!
      dispatch({ type: 'UPSERT_BILL_PAYMENT', payment: { billId: id, monthKey, amount: bill.amount, isPaid: true, paidDate: date, bankAccountId: acctId } })
      adjustBalance(acctId, -bill.amount)
    } else if (type === 'invoice') {
      dispatch({ type: 'UPSERT_INVOICE_PAYMENT', payment: { cardId: id, monthKey, amount, isPaid: true, paidDate: date, bankAccountId: acctId } })
      adjustBalance(acctId, -amount)
    } else {
      const boleto = state.boletos.find((b) => b.id === id)!
      dispatch({ type: 'UPDATE_BOLETO', boleto: { ...boleto, isPaid: true, paidDate: date, bankAccountId: acctId } })
      adjustBalance(acctId, -boleto.amount)
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
              {activeBills.length === 0 && cardLinkedBills.length === 0 ? (
                <p className="text-center text-slate-500 py-12">Nenhuma conta fixa cadastrada</p>
              ) : activeBills.length === 0 ? (
                <p className="text-center text-slate-500 py-8 text-sm">Todas as contas fixas estão incluídas nas faturas dos cartões</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {activeBills.map((bill) => {
                    const payment = getBillPayment(bill.id, monthKey)
                    const isPaid = payment?.isPaid ?? false
                    const cat = CATEGORY_MAP[bill.category]
                    const user = state.users.find((u) => u.id === bill.userId)
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
                            {payment?.paidDate && (
                              <p className="text-xs text-emerald-400">Pago em {new Date(payment.paidDate).toLocaleDateString('pt-BR')}</p>
                            )}
                            {payment?.bankAccountId && (
                              <p className="text-xs text-slate-500">
                                {state.bankAccounts.find((a) => a.id === payment.bankAccountId)?.bank ?? ''}
                              </p>
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
              {cardLinkedBills.length > 0 && (
                <div className="border-t border-white/5">
                  <div className="px-5 py-3 bg-surface-800/50">
                    <p className="text-xs text-slate-500 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      {cardLinkedBills.length} conta{cardLinkedBills.length !== 1 ? 's' : ''} incluída{cardLinkedBills.length !== 1 ? 's' : ''} nas faturas dos cartões
                    </p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {cardLinkedBills.map((bill) => {
                      const cat = CATEGORY_MAP[bill.category]
                      const linkedCard = state.cards.find((c) => c.id === bill.cardId)
                      const user = state.users.find((u) => u.id === bill.userId)
                      return (
                        <div key={bill.id} className="flex items-center gap-4 px-5 py-3 opacity-50">
                          <div className="w-5 h-5 shrink-0" />
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-base"
                            style={{ backgroundColor: `${cat?.color}22` }}>
                            {cat?.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-400">{bill.name}</p>
                            <p className="text-xs text-slate-600">via fatura {linkedCard?.name ?? 'cartão'}</p>
                          </div>
                          {user && (
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                              style={{ backgroundColor: `${user.color}22`, color: user.color }}>{user.name}</span>
                          )}
                          <p className="text-sm text-slate-500 shrink-0">{formatCurrency(bill.amount)}</p>
                        </div>
                      )
                    })}
                  </div>
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

            {/* Invoice period label */}
            {(() => {
              const isCurrentMonth = monthKey === currentMonthKey
              const isPastMonth = monthKey < currentMonthKey
              return (
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium ${
                  isCurrentMonth ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20' :
                  isPastMonth ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                  'bg-white/5 text-slate-400 border border-white/10'
                }`}>
                  {isCurrentMonth ? (
                    <><span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" /> Fatura em aberto — acumulando gastos deste mês</>
                  ) : isPastMonth ? (
                    <><span className="w-2 h-2 rounded-full bg-amber-400" /> Fatura fechada — {format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}</>
                  ) : (
                    <><span className="w-2 h-2 rounded-full bg-slate-400" /> Fatura futura — próximo ciclo</>
                  )}
                </div>
              )
            })()}

            <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
              {creditCards.length === 0 ? (
                <p className="text-center text-slate-500 py-12">Nenhum cartão de crédito cadastrado</p>
              ) : (
                <div className="divide-y divide-white/5">
                  {creditCards.map((card) => {
                    const computedAmount = getCardUsageForMonth(card.id, monthKey)
                    const payment = getInvoicePayment(card.id, monthKey)
                    const isPaid = payment?.isPaid ?? false
                    const displayAmount = isPaid && payment?.amount ? payment.amount : computedAmount
                    const user = state.users.find((u) => u.id === card.userId)
                    const isPast = monthKey < currentMonthKey
                    const linkedAccount = card.bankAccountId ? state.bankAccounts.find((a) => a.id === card.bankAccountId) : undefined
                    return (
                      <div key={card.id} className={`flex items-center gap-4 px-5 py-4 transition-colors ${isPaid ? 'opacity-60' : displayAmount > 0 ? 'hover:bg-white/5' : 'opacity-40'}`}>
                        <button onClick={() => displayAmount > 0 && handleInvoiceToggle(card.id)}
                          className={`shrink-0 ${displayAmount === 0 ? 'cursor-not-allowed' : ''}`}>
                          {isPaid
                            ? <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                            : <Circle className={`w-5 h-5 ${displayAmount > 0 ? 'text-slate-500 hover:text-slate-300' : 'text-slate-700'} transition-colors`} />}
                        </button>
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                          <CreditCard className="w-4 h-4 text-white/80" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`text-sm font-medium ${isPaid ? 'line-through text-slate-500' : 'text-white'}`}>{card.name}</p>
                            {isPast && !isPaid && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400">fechada</span>
                            )}
                            {!isPast && (
                              <span className="text-xs px-1.5 py-0.5 rounded-md bg-brand-500/10 text-brand-400">aberta</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <p className="text-xs text-slate-500">{card.bank}{card.dueDay ? ` · vence dia ${card.dueDay}` : ''}</p>
                            {linkedAccount && <p className="text-xs text-slate-500">débito: {linkedAccount.name}</p>}
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
                          <p className={`text-sm font-semibold ${isPaid ? 'text-emerald-400' : displayAmount > 0 ? 'text-white' : 'text-slate-600'}`}>
                            {formatCurrency(displayAmount)}
                          </p>
                          {displayAmount === 0 && <p className="text-xs text-slate-600">sem gastos</p>}
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
          editableAmount={confirmTarget.editableAmount}
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
