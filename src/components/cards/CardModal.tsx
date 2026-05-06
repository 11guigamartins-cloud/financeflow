import { useState } from 'react'
import { Modal } from '../ui/Modal'
import { Input, Select } from '../ui/FormField'
import { useFinance } from '../../contexts/FinanceContext'
import type { Card } from '../../types'
import { CARD_COLORS, BANK_LIST } from '../../utils/constants'

interface Props {
  isOpen: boolean
  onClose: () => void
  card?: Card
}

const EMPTY: Omit<Card, 'id'> = {
  userId: '',
  name: '',
  bank: 'Nubank',
  lastFourDigits: '',
  type: 'credit',
  network: 'mastercard',
  limit: undefined,
  closingDay: undefined,
  dueDay: undefined,
  color: CARD_COLORS[0],
}

export function CardModal({ isOpen, onClose, card }: Props) {
  const { state, dispatch } = useFinance()
  const [form, setForm] = useState<Omit<Card, 'id'>>(
    card ? { ...card } : { ...EMPTY, userId: state.users[0]?.id ?? '' }
  )

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (card) {
      dispatch({ type: 'UPDATE_CARD', card: { ...form, id: card.id } })
    } else {
      dispatch({ type: 'ADD_CARD', card: form })
    }
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={card ? 'Editar Cartão' : 'Novo Cartão'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select label="Titular" value={form.userId} onChange={(e) => set('userId', e.target.value)} required>
          {state.users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </Select>

        <Input label="Nome do cartão" value={form.name} onChange={(e) => set('name', e.target.value)}
          placeholder="Ex: Nubank Roxinho" required />

        <div className="grid grid-cols-2 gap-4">
          <Select label="Banco" value={form.bank} onChange={(e) => set('bank', e.target.value)}>
            {BANK_LIST.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
          <Input label="Últimos 4 dígitos" value={form.lastFourDigits}
            onChange={(e) => set('lastFourDigits', e.target.value.slice(0, 4))}
            placeholder="0000" maxLength={4} pattern="\d{4}" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select label="Tipo" value={form.type} onChange={(e) => set('type', e.target.value as Card['type'])}>
            <option value="credit">Crédito</option>
            <option value="debit">Débito</option>
          </Select>
          <Select label="Bandeira" value={form.network} onChange={(e) => set('network', e.target.value as Card['network'])}>
            <option value="visa">Visa</option>
            <option value="mastercard">Mastercard</option>
            <option value="elo">Elo</option>
            <option value="amex">Amex</option>
            <option value="hipercard">Hipercard</option>
            <option value="other">Outra</option>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="Limite (R$)" type="number" value={form.limit ?? ''} min={0}
            onChange={(e) => set('limit', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="5000" />
          <Input label="Fecha dia" type="number" value={form.closingDay ?? ''} min={1} max={31}
            onChange={(e) => set('closingDay', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="19" />
          <Input label="Vence dia" type="number" value={form.dueDay ?? ''} min={1} max={31}
            onChange={(e) => set('dueDay', e.target.value ? Number(e.target.value) : undefined)}
            placeholder="26" />
        </div>

        {/* Color picker */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-slate-300">Cor do cartão</label>
          <div className="flex gap-2 flex-wrap">
            {CARD_COLORS.map((c) => (
              <button
                key={c} type="button"
                onClick={() => set('color', c)}
                className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c} border-2 transition-all ${
                  form.color === c ? 'border-white scale-110' : 'border-transparent'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-colors text-sm font-medium">
            Cancelar
          </button>
          <button type="submit"
            className="flex-1 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-sm transition-colors">
            {card ? 'Salvar' : 'Adicionar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
