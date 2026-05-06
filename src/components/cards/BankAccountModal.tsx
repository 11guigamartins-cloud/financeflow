import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Select } from '../ui/FormField'
import { useFinance } from '../../contexts/FinanceContext'
import type { BankAccount } from '../../types'
import { BANK_LIST, ACCOUNT_COLORS } from '../../utils/constants'

interface Props {
  isOpen: boolean
  onClose: () => void
  account?: BankAccount
}

export function BankAccountModal({ isOpen, onClose, account }: Props) {
  const { state, dispatch } = useFinance()
  const [form, setForm] = useState({
    userId:  account?.userId  ?? state.users[0]?.id ?? '',
    name:    account?.name    ?? '',
    bank:    account?.bank    ?? 'Nubank',
    type:    (account?.type   ?? 'checking') as BankAccount['type'],
    balance: account?.balance?.toString() ?? '0',
    color:   account?.color   ?? ACCOUNT_COLORS[0],
  })

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const base: Omit<BankAccount, 'id'> = {
      userId:  form.userId,
      name:    form.name,
      bank:    form.bank,
      type:    form.type,
      balance: Number(form.balance),
      color:   form.color,
    }
    if (account) dispatch({ type: 'UPDATE_BANK_ACCOUNT', account: { ...base, id: account.id } })
    else dispatch({ type: 'ADD_BANK_ACCOUNT', account: base })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={account ? 'Editar Conta' : 'Nova Conta Bancária'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Titular" value={form.userId} onChange={(e) => set('userId', e.target.value)}>
          {state.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
        </Select>

        <Input label="Nome da conta" value={form.name} onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Conta Corrente BB" required />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Banco" value={form.bank} onChange={(e) => set('bank', e.target.value)}>
            {BANK_LIST.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Select label="Tipo" value={form.type} onChange={(e) => set('type', e.target.value as BankAccount['type'])}>
            <option value="checking">Conta Corrente</option>
            <option value="savings">Poupança</option>
            <option value="investment">Investimentos</option>
          </Select>
        </div>

        <Input label="Saldo atual (R$)" type="number" step="0.01" value={form.balance}
          onChange={(e) => set('balance', e.target.value)} required />

        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Cor da conta</label>
          <div className="flex gap-2 flex-wrap">
            {ACCOUNT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set('color', c)}
                className={`w-8 h-8 rounded-lg border-2 transition-all ${
                  form.color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-colors text-sm">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            {account ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
