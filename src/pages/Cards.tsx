import { useState } from 'react'
import { Plus, Edit2, Trash2, TrendingDown, Landmark, RefreshCw } from 'lucide-react'
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
  const { state, dispatch, getCardUsageForMonth, getTotalBankBalance } = useFinance()
  const [cardModalOpen, setCardModalOpen] = useState(false)
  const [editCard, setEditCard] = useState<Card | undefined>()
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [accModalOpen, setAccModalOpen] = useState(false)
  const [editAcc, setEditAcc] = useState<BankAccount | undefined>()
  const [updateBalAcc, setUpdateBalAcc] = useState<BankAccount | undefined>()

  const userId = state.activeUserId || undefined
  const currentMonth = format(new Date(), 'yyyy-MM')

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

  const totalLimit = visibleCards.filter((c) => c.type === 'credit').reduce((s, c) => s + (c.limit ?? 0), 0)
  const totalUsed  = visibleCards.reduce((s, c) => s + getCardUsageForMonth(c.id, currentMonth), 0)
  const totalBal   = getTotalBankBalance(userId)

  // Chart for selected card
  const last6 = getLast12Months().slice(-6)
  const historyData = selectedCard
    ? last6.map((m) => ({ name: monthLabel(m), gasto: Math.round(getCardUsageForMonth(selectedCard, m)) }))
    : []

  const selected      = state.cards.find((c) => c.id === selectedCard)
  const selectedUsage = selectedCard ? getCardUsageForMonth(selectedCard, currentMonth) : 0
  const selectedTxns  = selectedCard
    ? [...state.transactions].filter((t) => t.cardId === selectedCard)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10)
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
              {visibleCards.filter((c) => c.type === 'credit').length} crédito ·{' '}
              {visibleCards.filter((c) => c.type === 'debit').length} débito
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
          <div className="bg-surface-900 border border-white/10 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">{selected.name} — Detalhes</h3>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <TrendingDown className="w-4 h-4" />
                Fatura atual: <span className="text-white font-semibold ml-1">{formatCurrency(selectedUsage)}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Histórico (6 meses)</h4>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={historyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                    <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                      tickFormatter={(v) => `R$${v}`} />
                    <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="gasto" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-400 mb-3">Últimas transações</h4>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {selectedTxns.length === 0 ? (
                    <p className="text-slate-500 text-sm">Nenhuma transação</p>
                  ) : selectedTxns.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 border-b border-white/5">
                      <div>
                        <p className="text-sm text-white">{t.description}</p>
                        <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="text-sm font-semibold text-white">{formatCurrency(t.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4 pt-2 border-t border-white/10">
              {[
                { label: 'Banco',      value: selected.bank },
                { label: 'Bandeira',   value: selected.network.toUpperCase() },
                { label: 'Fecha dia',  value: selected.closingDay ? `${selected.closingDay}` : '—' },
                { label: 'Vence dia',  value: selected.dueDay     ? `${selected.dueDay}` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface-800 rounded-xl p-3">
                  <p className="text-xs text-slate-500">{label}</p>
                  <p className="text-sm font-semibold text-white mt-0.5">{value}</p>
                </div>
              ))}
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

      <CardModal isOpen={cardModalOpen} onClose={() => { setCardModalOpen(false); setEditCard(undefined) }} card={editCard} />
      <BankAccountModal isOpen={accModalOpen} onClose={() => { setAccModalOpen(false); setEditAcc(undefined) }} account={editAcc} />
      {updateBalAcc && <UpdateBalanceModal account={updateBalAcc} onClose={() => setUpdateBalAcc(undefined)} />}
    </Layout>
  )
}
