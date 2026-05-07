import { useState } from 'react'
import { Plus, Edit2, Trash2, TrendingDown, Landmark, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2, Clock } from 'lucide-react'
import { addMonths, subMonths, format as dateFnsFormat } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Layout } from '../components/layout/Layout'
import { CreditCardVisual } from '../components/cards/CreditCardVisual'
import { CardModal } from '../components/cards/CardModal'
import { BankAccountModal } from '../components/cards/BankAccountModal'
import { useFinance } from '../contexts/FinanceContext'
import { formatCurrency, getLast12Months, monthLabel } from '../utils/formatters'
import { format } from 'date-fns'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import type { Card, BankAccount } from '../types'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/FormField'

const TOOLTIP_STYLE = {
  backgroundColor: '#1e293b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
}

const ACCOUNT_TYPE_LABELS = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  investment: 'Investimentos',
}

function UpdateBalanceModal({ account, onClose }: { account: BankAccount; onClose: () => void }) {
  const { dispatch } = useFinance()
  const [value, setValue] = useState(account.balance.toString())

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    dispatch({ type: 'SET_BANK_BALANCE', accountId: account.id, balance: Number(value) })
    onClose()
  }

  return (
    <Modal isOpen onClose={onClose} title={`Atualizar saldo — ${account.name}`} size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Saldo atual (R$)" type="number" step="0.01" value={value}
          onChange={(e) => setValue(e.target.value)} autoFocus required />
        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm">
            Atualizar
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function Cards() {
  const { state, dispatch, getCardUsageForMonth, getTotalBankBalance, getInvoicePayment } = useFinance()
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [editCard, setEditCard] = useState<Card | undefined>()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [detailMonthDate, setDetailMonthDate] = useState(new Date())
  const [accModalOpen, setAccModalOpen] = useState(false)
  const [editAcc, setEditAcc] = useState<BankAccount | undefined>()
  const [updateBalAcc, setUpdateBalAcc] = useState<BankAccount | undefined>()

  const userId = state.activeUserId || undefined
  const currentMonth = format(new Date(), 'yyyy-MM')
  const detailMonthKey = format(detailMonthDate, 'yyyy-MM')
  const detailMonthLabel = dateFnsFormat(detailMonthDate, 'MMMM yyyy', { locale: ptBR })

  const visibleCards    = userId ? state.cards.filter((c) => c.userId === userId) : state.cards
  const visibleAccounts = userId ? state.bankAccounts.filter((a) => a.userId === userId) : state.bankAccounts

  const handleDeleteCard = (card: Card) => {
    if (confirm(`Excluir cartão ${card.name}? Todas as transações vinculadas serão removidas.`)) {
      dispatch({ type: 'DELETE_CARD', cardId: card.id })
      if (selectedCard === card.id) setSelectedCard(null)
    }
  }
  const handleDeleteAcc = (acc: BankAccount) => {
    if (confirm(`Excluir conta ${acc.name}?`))
      dispatch({ type: 'DELETE_BANK_ACCOUNT', accountId: acc.id })
  }

  const totalLimit = visibleCards.filter((c) => c.type === 'credit' || c.type === 'both').reduce((s, c) => s + (c.limit ?? 0), 0)
  const totalUsed  = visibleCards.reduce((s, c) => s + getCardUsageForMonth(c.id, currentMonth), 0)
  const totalBal   = getTotalBankBalance(userId)

  // Chart for selected card
  const last6 = getLast12Months().slice(-6)
  const historyData = selectedCard
    ? last6.map((m) => ({ name: monthLabel(m), gasto: Math.round(getCardUsageForMonth(selectedCard, m)) }))
    : []

  const selected      = state.cards.find((c) => c.id === selectedCard)
  const selectedUsage = selectedCard ? getCardUsageForMonth(selectedCard, detailMonthKey) : 0

  // Detail month breakdown
  const detailTxns = selectedCard
    ? (() => {
        const [y, m] = detailMonthKey.split('-').map(Number)
        return [...state.transactions]
          .filter((t) => {
            if (t.cardId !== selectedCard) return false
            const d = new Date(t.date)
            return d.getFullYear() === y && d.getMonth() + 1 === m
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      })()
    : []
  const detailBills = selectedCard
    ? state.bills.filter((b) => b.isActive && b.cardId === selectedCard)
    : []

  // Invoice payment history for selected card
  const invoiceHistory = selectedCard
    ? [...state.invoicePayments]
        .filter((p) => p.cardId === selectedCard)
        .sort((a, b) => b.monthKey.localeCompare(a.monthKey))
        .slice(0, 6)
    : []

  return (
    <Layout title="Cartões & Contas" subtitle="Gerencie seus cartões de crédito e contas bancárias">
      <div className="space-y-8">

        {/* ── Summary row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Cartões ativos</p>
            <p className="text-2xl font-bold text-white">{visibleCards.length}</p>
            <p className="text-xs text-slate-500 mt-1">
              {visibleCards.filter((c) => c.type === 'credit' || c.type === 'both').length} crédito ·{' '}
              {visibleCards.filter((c) => c.type === 'debit' || c.type === 'both').length} débito
            </p>
          </div>
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Limite total</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalLimit)}</p>
            <p className="text-xs text-slate-500 mt-1">Crédito somado</p>
          </div>
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Fatura este mês</p>
            <p className="text-2xl font-bold text-white">{formatCurrency(totalUsed)}</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-2">
              <div className="h-1.5 rounded-full bg-brand-500"
                style={{ width: totalLimit > 0 ? `${Math.min((totalUsed / totalLimit) * 100, 100)}%` : '0%' }} />
            </div>
          </div>
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-5">
            <p className="text-xs text-slate-400 mb-1">Saldo em contas</p>
            <p className={`text-2xl font-bold ${totalBal >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalBal)}
            </p>
            <p className="text-xs text-slate-500 mt-1">{visibleAccounts.length} conta{visibleAccounts.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* ── Credit cards ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">Cartões</h2>
            <button onClick={() => { setEditCard(undefined); setCardModalOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Novo Cartão
            </button>
          </div>

          {visibleCards.length === 0 ? (
            <div className="bg-surface-900 border border-dashed border-white/20 rounded-2xl p-10 text-center">
              <p className="text-slate-400 mb-3">Nenhum cartão cadastrado</p>
              <button onClick={() => setCardModalOpen(true)}
                className="px-4 py-2 bg-brand-500/20 text-brand-400 rounded-xl text-sm border border-brand-500/30">
                Adicionar cartão
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {visibleCards.map((card) => {
                const usage = getCardUsageForMonth(card.id, currentMonth)
                const user  = state.users.find((u) => u.id === card.userId)
                return (
                  <div key={card.id} className="group relative">
                    <CreditCardVisual card={card} usage={usage}
                      onClick={() => setSelectedCard(selectedCard === card.id ? null : card.id)} />
                    <div className="flex items-center justify-between mt-2 px-1">
                      <span className="text-xs font-medium" style={{ color: user?.color }}>{user?.name}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditCard(card); setCardModalOpen(true) }}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-white/10">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => handleDeleteCard(card)}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-red-500/20">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Selected card detail ──────────────────────────────────────── */}
        {selected && (
          <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
            {/* Header with month nav */}
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h3 className="font-semibold text-white">{selected.name} — Detalhes</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => setDetailMonthDate((d) => subMonths(d, 1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-white capitalize w-32 text-center">{detailMonthLabel}</span>
                <button onClick={() => setDetailMonthDate((d) => addMonths(d, 1))}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Invoice total & status */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">Fatura {detailMonthKey < currentMonth ? 'fechada' : 'em aberto'}</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(selectedUsage)}</p>
                </div>
                {(() => {
                  const inv = getInvoicePayment(selected.id, detailMonthKey)
                  if (inv?.isPaid) return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm">
                      <CheckCircle2 className="w-4 h-4" /> Paga em {inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('pt-BR') : '—'}
                    </div>
                  )
                  if (detailMonthKey < currentMonth) return (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 rounded-xl text-sm">
                      <Clock className="w-4 h-4" /> Pendente
                      {selected.dueDay && <span>· vence dia {selected.dueDay}</span>}
                    </div>
                  )
                  return null
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* 6-month chart */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Histórico (6 meses)</h4>
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={historyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false}
                        tickFormatter={(v) => `R$${v}`} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
                      <Bar dataKey="gasto" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Invoice breakdown */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Composição da fatura</h4>
                  <div className="space-y-2">
                    {detailBills.map((b) => (
                      <div key={b.id} className="flex items-center justify-between py-1.5 border-b border-white/5">
                        <div>
                          <p className="text-xs text-white">{b.name}</p>
                          <p className="text-xs text-slate-500">recorrente · dia {b.dueDay}</p>
                        </div>
                        <span className="text-xs font-medium text-white">{formatCurrency(b.amount)}</span>
                      </div>
                    ))}
                    {detailTxns.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-white/5">
                        <div>
                          <p className="text-xs text-white truncate max-w-28">{t.description}</p>
                          <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span className="text-xs font-medium text-white">{formatCurrency(t.amount)}</span>
                      </div>
                    ))}
                    {detailTxns.length === 0 && detailBills.length === 0 && (
                      <p className="text-xs text-slate-500">Nenhum gasto neste mês</p>
                    )}
                  </div>
                </div>

                {/* Invoice payment history */}
                <div>
                  <h4 className="text-xs font-medium text-slate-400 mb-3">Histórico de pagamentos</h4>
                  <div className="space-y-2">
                    {invoiceHistory.length === 0 ? (
                      <p className="text-xs text-slate-500">Nenhuma fatura paga</p>
                    ) : invoiceHistory.map((inv) => {
                      const acc = state.bankAccounts.find((a) => a.id === inv.bankAccountId)
                      return (
                        <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-white/5">
                          <div>
                            <p className="text-xs text-white capitalize">{inv.monthKey}</p>
                            <p className="text-xs text-slate-500">{acc?.bank ?? 'sem conta'}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-emerald-400">{formatCurrency(inv.amount)}</p>
                            <p className="text-xs text-slate-500">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('pt-BR') : '—'}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Card info */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-white/10">
                {[
                  { label: 'Banco',     value: selected.bank },
                  { label: 'Bandeira',  value: selected.network.toUpperCase() },
                  { label: 'Fecha dia', value: selected.closingDay ? `${selected.closingDay}` : '—' },
                  { label: 'Vence dia', value: selected.dueDay     ? `${selected.dueDay}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-surface-800 rounded-xl p-3">
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Bank accounts ─────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-white">Contas Bancárias</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Saldo total: <span className="font-semibold text-green-400">{formatCurrency(totalBal)}</span>
              </p>
            </div>
            <button onClick={() => { setEditAcc(undefined); setAccModalOpen(true) }}
              className="flex items-center gap-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors">
              <Plus className="w-4 h-4" /> Nova Conta
            </button>
          </div>

          {visibleAccounts.length === 0 ? (
            <div className="bg-surface-900 border border-dashed border-white/20 rounded-2xl p-10 text-center">
              <p className="text-slate-400 mb-3">Nenhuma conta bancária cadastrada</p>
              <button onClick={() => setAccModalOpen(true)}
                className="px-4 py-2 bg-brand-500/20 text-brand-400 rounded-xl text-sm border border-brand-500/30">
                Adicionar conta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {visibleAccounts.map((acc) => {
                const user = state.users.find((u) => u.id === acc.userId)
                return (
                  <div key={acc.id}
                    className="bg-surface-900 border border-white/10 rounded-2xl p-5 group relative overflow-hidden hover:border-white/20 transition-colors">
                    {/* Color accent bar */}
                    <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
                      style={{ backgroundColor: acc.color }} />

                    <div className="flex items-start justify-between mb-4 mt-1">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: `${acc.color}22` }}>
                        <Landmark className="w-5 h-5" style={{ color: acc.color }} />
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setUpdateBalAcc(acc)}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-white/10" title="Atualizar saldo">
                          <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => { setEditAcc(acc); setAccModalOpen(true) }}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-white/10">
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => handleDeleteAcc(acc)}
                          className="p-1.5 rounded-lg bg-surface-800 hover:bg-red-500/20">
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">{acc.bank}</p>
                      <p className="font-semibold text-white">{acc.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ACCOUNT_TYPE_LABELS[acc.type]}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                      <span className="text-xs text-slate-400">Saldo</span>
                      <span
                        className="text-xl font-bold"
                        style={{ color: acc.balance >= 0 ? '#22c55e' : '#ef4444' }}
                      >
                        {formatCurrency(acc.balance)}
                      </span>
                    </div>

                    {user && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="w-4 h-4 rounded-full text-xs font-bold flex items-center justify-center text-white"
                          style={{ backgroundColor: user.color, fontSize: '9px' }}>
                          {user.avatar}
                        </div>
                        <span className="text-xs" style={{ color: user.color }}>{user.name}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

      <CardModal key={editCard?.id ?? 'new-card'} isOpen={cardModalOpen} onClose={() => { setCardModalOpen(false); setEditCard(undefined) }} card={editCard} />
      <BankAccountModal key={editAcc?.id ?? 'new-acc'} isOpen={accModalOpen} onClose={() => { setAccModalOpen(false); setEditAcc(undefined) }} account={editAcc} />
      {updateBalAcc && <UpdateBalanceModal account={updateBalAcc} onClose={() => setUpdateBalAcc(undefined)} />}
    </Layout>
  )
}
