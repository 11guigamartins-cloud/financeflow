import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Select, TextArea } from '../ui/FormField'
import { useFinance } from '../../contexts/FinanceContext'
import type { Transaction, PaymentMethod } from '../../types'
import { CATEGORIES, PAYMENT_METHOD_LABELS } from '../../utils/constants'
import { format } from 'date-fns'

interface Props {
  isOpen: boolean
  onClose: () => void
  transaction?: Transaction
}

export function TransactionModal({ isOpen, onClose, transaction }: Props) {
  const { state, dispatch } = useFinance()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [form, setForm] = useState({
    userId:          transaction?.userId ?? state.users[0]?.id ?? '',
    paymentMethod:   (transaction?.paymentMethod ?? 'credit') as PaymentMethod,
    cardId:          transaction?.cardId ?? '',
    bankAccountId:   transaction?.bankAccountId ?? '',
    description:     transaction?.description ?? '',
    amount:          transaction?.amount ?? '',
    date:            transaction?.date ?? today,
    category:        (transaction?.category ?? 'other') as Transaction['category'],
    isRecurring:     transaction?.isRecurring ?? false,
    note:            transaction?.note ?? '',
    hasInstallment:  !!transaction?.installment,
    installTotal:    transaction?.installment?.total ?? 2,
    installCurrent:  transaction?.installment?.current ?? 1,
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const userCards    = state.cards.filter((c) => c.userId === form.userId)
  const userAccounts = state.bankAccounts.filter((a) => a.userId === form.userId)

  const needsCard    = form.paymentMethod === 'credit' || form.paymentMethod === 'debit'
  const needsAccount = form.paymentMethod === 'pix' || form.paymentMethod === 'debit'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount)
    const installment = form.hasInstallment
      ? { total: form.installTotal, current: form.installCurrent, amountPerInstallment: amount }
      : undefined

    const base: Omit<Transaction, 'id'> = {
      userId:        form.userId,
      paymentMethod: form.paymentMethod,
      cardId:        needsCard ? form.cardId || undefined : undefined,
      bankAccountId: (needsAccount && form.bankAccountId) ? form.bankAccountId : undefined,
      description:   form.description,
      amount,
      date:          form.date,
      category:      form.category,
      isRecurring:   form.isRecurring,
      note:          form.note || undefined,
      installment,
    }

    if (transaction) {
      dispatch({ type: 'UPDATE_TRANSACTION', transaction: { ...base, id: transaction.id } })
    } else {
      dispatch({ type: 'ADD_TRANSACTION', transaction: base })
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={transaction ? 'Editar Transação' : 'Nova Transação'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Titular */}
        <Select label="Titular" value={form.userId}
          onChange={(e) => { set('userId', e.target.value); set('cardId', ''); set('bankAccountId', '') }} required>
          {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>

        {/* Método de pagamento */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Método de Pagamento</label>
          <div className="grid grid-cols-4 gap-2">
            {(['credit', 'debit', 'pix', 'cash'] as PaymentMethod[]).map((m) => {
              const meta = PAYMENT_METHOD_LABELS[m]
              return (
                <button key={m} type="button" onClick={() => set('paymentMethod', m)}
                  className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border transition-all text-xs font-medium ${
                    form.paymentMethod === m
                      ? 'border-opacity-50 text-white'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                  style={form.paymentMethod === m ? {
                    backgroundColor: `${meta.color}22`,
                    borderColor: meta.color,
                    color: meta.color,
                  } : {}}>
                  <span className="text-xl">{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Cartão — só para crédito/débito */}
        {needsCard && (
          <Select label="Cartão" value={form.cardId} onChange={(e) => set('cardId', e.target.value)} required>
            <option value="">Selecione o cartão...</option>
            {userCards.map((c) => (
              <option key={c.id} value={c.id}>{c.name} •••{c.lastFourDigits}</option>
            ))}
          </Select>
        )}

        {/* Conta bancária — para pix e débito */}
        {needsAccount && (
          <Select label={form.paymentMethod === 'pix' ? 'Banco do Pix' : 'Conta Débito'}
            value={form.bankAccountId} onChange={(e) => set('bankAccountId', e.target.value)}
            required={form.paymentMethod === 'pix'}>
            <option value="">Selecione a conta...</option>
            {userAccounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name} — {a.bank}</option>
            ))}
          </Select>
        )}

        {/* Descrição e valor */}
        <Input label="Descrição" value={form.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Ex: Supermercado Pão de Açúcar" required />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Valor (R$)" type="number" step="0.01" min="0.01"
            value={form.amount} onChange={(e) => set('amount', e.target.value)} required />
          <Input label="Data" type="date" value={form.date}
            onChange={(e) => set('date', e.target.value)} required />
        </div>

        <Select label="Categoria" value={form.category}
          onChange={(e) => set('category', e.target.value as Transaction['category'])}>
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </Select>

        {/* Parcelamento — só cartão de crédito */}
        {form.paymentMethod === 'credit' && (
          <div className="bg-surface-800 rounded-xl p-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.hasInstallment}
                onChange={(e) => set('hasInstallment', e.target.checked)}
                className="w-4 h-4 accent-brand-500 rounded" />
              <span className="text-sm font-medium text-slate-300">Compra parcelada?</span>
            </label>
            {form.hasInstallment && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Parcela atual" type="number" min={1} value={form.installCurrent}
                  onChange={(e) => set('installCurrent', Number(e.target.value))} />
                <Input label="Total de parcelas" type="number" min={2} max={60} value={form.installTotal}
                  onChange={(e) => set('installTotal', Number(e.target.value))} />
              </div>
            )}
          </div>
        )}

        <label className="flex items-center gap-3 cursor-pointer">
          <input type="checkbox" checked={form.isRecurring}
            onChange={(e) => set('isRecurring', e.target.checked)}
            className="w-4 h-4 accent-brand-500 rounded" />
          <span className="text-sm font-medium text-slate-300">Cobrança recorrente (mensal)</span>
        </label>

        <TextArea label="Observação (opcional)" value={form.note}
          onChange={(e) => set('note', e.target.value)} placeholder="Algum detalhe..." />

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-colors text-sm font-medium">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            {transaction ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
