import type { Card } from '../../types'
import { formatCurrency } from '../../utils/formatters'

interface Props {
  card: Card
  usage?: number
  onClick?: () => void
  compact?: boolean
}

const NETWORK_LOGOS: Record<string, string> = {
  visa: 'VISA',
  mastercard: '●● MC',
  elo: 'ELO',
  amex: 'AMEX',
  hipercard: 'HIPER',
  other: '',
}

export function CreditCardVisual({ card, usage = 0, onClick, compact = false }: Props) {
  const usagePercent = card.limit ? Math.min((usage / card.limit) * 100, 100) : 0
  const usageColor = usagePercent > 80 ? '#ef4444' : usagePercent > 60 ? '#f97316' : '#22c55e'

  if (compact) {
    return (
      <div
        onClick={onClick}
        className={`bg-gradient-to-br ${card.color} rounded-xl p-4 cursor-pointer hover:scale-105 transition-transform shadow-card`}
      >
        <div className="flex justify-between items-start mb-6">
          <span className="text-white/70 text-xs font-medium">{card.bank}</span>
          <span className="text-white font-bold text-xs">{NETWORK_LOGOS[card.network]}</span>
        </div>
        <p className="text-white font-mono text-sm tracking-widest mb-1">•••• {card.lastFourDigits}</p>
        <p className="text-white/70 text-xs">{card.name}</p>
      </div>
    )
  }

  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 cursor-pointer hover:scale-[1.02] transition-all shadow-card relative overflow-hidden group`}
    >
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5" />
      <div className="absolute -right-4 -bottom-8 w-24 h-24 rounded-full bg-white/5" />

      <div className="relative">
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-white/60 text-xs font-medium uppercase tracking-wider">{card.bank}</p>
            <p className="text-white font-semibold text-sm mt-0.5">{card.name}</p>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-xs">{card.type === 'credit' ? 'Crédito' : 'Débito'}</p>
            <p className="text-white font-bold text-sm">{NETWORK_LOGOS[card.network]}</p>
          </div>
        </div>

        <p className="text-white font-mono text-xl tracking-widest mb-6">
          •••• •••• •••• {card.lastFourDigits}
        </p>

        {card.limit && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-white/60 mb-1">
              <span>Utilizado: {formatCurrency(usage)}</span>
              <span>Limite: {formatCurrency(card.limit)}</span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-1.5">
              <div
                className="h-1.5 rounded-full transition-all"
                style={{ width: `${usagePercent}%`, backgroundColor: usageColor }}
              />
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            {card.closingDay && (
              <p className="text-white/60 text-xs">Fecha dia {card.closingDay}</p>
            )}
            {card.dueDay && (
              <p className="text-white/60 text-xs">Vence dia {card.dueDay}</p>
            )}
          </div>
          <div
            className="text-xs font-bold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: `${usageColor}33`, color: usageColor }}
          >
            {usagePercent.toFixed(0)}% usado
          </div>
        </div>
      </div>
    </div>
  )
}
