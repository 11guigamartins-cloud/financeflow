import type { Category, IncomeCategory } from '../types'

export const CATEGORIES: Category[] = [
  { id: 'food',          label: 'Alimentação',    icon: '🍔', color: '#f97316' },
  { id: 'transport',     label: 'Transporte',      icon: '🚗', color: '#3b82f6' },
  { id: 'entertainment', label: 'Lazer',           icon: '🎬', color: '#a855f7' },
  { id: 'health',        label: 'Saúde',           icon: '💊', color: '#22c55e' },
  { id: 'education',     label: 'Educação',        icon: '📚', color: '#06b6d4' },
  { id: 'shopping',      label: 'Compras',         icon: '🛍️', color: '#ec4899' },
  { id: 'utilities',     label: 'Utilidades',      icon: '💡', color: '#eab308' },
  { id: 'housing',       label: 'Moradia',         icon: '🏠', color: '#64748b' },
  { id: 'travel',        label: 'Viagens',         icon: '✈️', color: '#14b8a6' },
  { id: 'subscriptions', label: 'Assinaturas',     icon: '📱', color: '#8b5cf6' },
  { id: 'investment',    label: 'Investimentos',   icon: '📈', color: '#10b981' },
  { id: 'other',         label: 'Outros',          icon: '📦', color: '#6b7280' },
]

export const CATEGORY_MAP = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c])
) as Record<string, Category>

export const INCOME_CATEGORIES: IncomeCategory[] = [
  { id: 'salary',           label: 'Salário',          icon: '💰', color: '#22c55e' },
  { id: 'freelance',        label: 'Freelance',         icon: '💻', color: '#0ea5e9' },
  { id: 'investment_return',label: 'Renda de Invest.',  icon: '📈', color: '#10b981' },
  { id: 'bonus',            label: 'Bônus / 13º',       icon: '🎁', color: '#f97316' },
  { id: 'rental',           label: 'Aluguel Recebido',  icon: '🏘️', color: '#a855f7' },
  { id: 'gift',             label: 'Presente / Doação', icon: '🎀', color: '#ec4899' },
  { id: 'other_income',     label: 'Outra Entrada',     icon: '💵', color: '#64748b' },
]

export const INCOME_CATEGORY_MAP = Object.fromEntries(
  INCOME_CATEGORIES.map((c) => [c.id, c])
) as Record<string, IncomeCategory>

export const PAYMENT_METHOD_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  credit: { label: 'Cartão de Crédito', icon: '💳', color: '#a855f7' },
  debit:  { label: 'Cartão de Débito',  icon: '💳', color: '#0ea5e9' },
  pix:    { label: 'Pix',               icon: '⚡', color: '#22c55e' },
  cash:   { label: 'Dinheiro',          icon: '💵', color: '#eab308' },
}

export const CARD_COLORS = [
  'from-violet-600 to-purple-700',
  'from-sky-500 to-blue-700',
  'from-rose-500 to-pink-700',
  'from-emerald-500 to-green-700',
  'from-amber-500 to-orange-600',
  'from-yellow-400 to-yellow-600',   // Ourocard BB 🟡
  'from-slate-600 to-gray-800',
  'from-cyan-500 to-teal-700',
  'from-fuchsia-500 to-purple-700',
]

export const ACCOUNT_COLORS = [
  '#0ea5e9', // azul
  '#22c55e', // verde
  '#a855f7', // roxo
  '#f97316', // laranja
  '#eab308', // amarelo
  '#ec4899', // rosa
  '#14b8a6', // teal
  '#64748b', // cinza
]

export const BANK_LIST = [
  'Nubank',
  'Itaú',
  'Bradesco',
  'Santander',
  'Caixa',
  'Banco do Brasil',
  'Inter',
  'C6 Bank',
  'BTG Pactual',
  'XP',
  'Sicoob',
  'Neon',
  'PicPay',
  'Mercado Pago',
  'Outro',
]

export const USER_COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#ec4899']
