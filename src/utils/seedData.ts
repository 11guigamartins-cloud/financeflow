import { v4 as uuid } from 'uuid'
import type { AppState } from '../types'
import { format, subDays, subMonths } from 'date-fns'

const d = (daysAgo: number) => format(subDays(new Date(), daysAgo), 'yyyy-MM-dd')
const dm = (monthsAgo: number, day: number) => {
  const base = subMonths(new Date(), monthsAgo)
  base.setDate(day)
  return format(base, 'yyyy-MM-dd')
}

const USER_GUIGA = uuid()
const USER_NAM = uuid()
const CARD_NU = uuid()
const CARD_ITAU = uuid()
const CARD_INTER = uuid()
const CARD_C6 = uuid()
const ACC_GUIGA_NU = uuid()
const ACC_GUIGA_BB = uuid()
const ACC_NAM_INTER = uuid()

export const SEED: AppState = {
  activeUserId: USER_GUIGA,
  users: [
    { id: USER_GUIGA, name: 'Guiga',    color: '#0ea5e9', avatar: 'G' },
    { id: USER_NAM,   name: 'Namorada', color: '#f97316', avatar: 'N' },
  ],
  cards: [
    {
      id: CARD_NU, userId: USER_GUIGA, name: 'Nubank Roxinho', bank: 'Nubank',
      lastFourDigits: '4321', type: 'credit', network: 'mastercard',
      limit: 5000, closingDay: 19, dueDay: 26, color: 'from-violet-600 to-purple-700',
    },
    {
      id: CARD_ITAU, userId: USER_GUIGA, name: 'Itaú Platinum', bank: 'Itaú',
      lastFourDigits: '8877', type: 'credit', network: 'visa',
      limit: 8000, closingDay: 10, dueDay: 17, color: 'from-amber-500 to-orange-600',
    },
    {
      id: CARD_INTER, userId: USER_NAM, name: 'Inter Gold', bank: 'Inter',
      lastFourDigits: '5566', type: 'credit', network: 'mastercard',
      limit: 4000, closingDay: 15, dueDay: 22, color: 'from-amber-400 to-orange-500',
    },
    {
      id: CARD_C6, userId: USER_NAM, name: 'C6 Carbon', bank: 'C6 Bank',
      lastFourDigits: '1122', type: 'credit', network: 'mastercard',
      limit: 6000, closingDay: 5, dueDay: 12, color: 'from-slate-600 to-gray-800',
    },
  ],
  bankAccounts: [
    {
      id: ACC_GUIGA_NU, userId: USER_GUIGA, name: 'Conta Nubank', bank: 'Nubank',
      type: 'checking', balance: 3450.00, color: '#8b5cf6',
    },
    {
      id: ACC_GUIGA_BB, userId: USER_GUIGA, name: 'Conta BB', bank: 'Banco do Brasil',
      type: 'checking', balance: 1280.50, color: '#eab308',
    },
    {
      id: ACC_NAM_INTER, userId: USER_NAM, name: 'Conta Inter', bank: 'Inter',
      type: 'checking', balance: 2100.00, color: '#f97316',
    },
  ],
  incomes: [
    // Guiga - this month
    {
      id: uuid(), userId: USER_GUIGA, description: 'Salário', amount: 5500,
      date: dm(0, 5), category: 'salary', bankAccountId: ACC_GUIGA_BB,
      isRecurring: true, status: 'received',
    },
    {
      id: uuid(), userId: USER_GUIGA, description: 'Freelance Design', amount: 800,
      date: dm(0, 12), category: 'freelance', bankAccountId: ACC_GUIGA_NU,
      isRecurring: false, status: 'received',
    },
    // Namorada - this month
    {
      id: uuid(), userId: USER_NAM, description: 'Salário', amount: 4200,
      date: dm(0, 5), category: 'salary', bankAccountId: ACC_NAM_INTER,
      isRecurring: true, status: 'received',
    },
    {
      id: uuid(), userId: USER_NAM, description: '13º Salário', amount: 4200,
      date: dm(0, 10), category: 'bonus', bankAccountId: ACC_NAM_INTER,
      isRecurring: false, status: 'pending',
    },
    // Last month - Guiga
    {
      id: uuid(), userId: USER_GUIGA, description: 'Salário', amount: 5500,
      date: dm(1, 5), category: 'salary', bankAccountId: ACC_GUIGA_BB,
      isRecurring: true, status: 'received',
    },
    // Last month - Namorada
    {
      id: uuid(), userId: USER_NAM, description: 'Salário', amount: 4200,
      date: dm(1, 5), category: 'salary', bankAccountId: ACC_NAM_INTER,
      isRecurring: true, status: 'received',
    },
    // 2 months ago
    {
      id: uuid(), userId: USER_GUIGA, description: 'Salário', amount: 5500,
      date: dm(2, 5), category: 'salary', bankAccountId: ACC_GUIGA_BB,
      isRecurring: true, status: 'received',
    },
    {
      id: uuid(), userId: USER_NAM, description: 'Salário', amount: 4200,
      date: dm(2, 5), category: 'salary', bankAccountId: ACC_NAM_INTER,
      isRecurring: true, status: 'received',
    },
  ],
  transactions: [
    // Guiga - this month
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'iFood', amount: 45.90, date: d(1), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Spotify', amount: 21.90, date: d(2), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, bankAccountId: ACC_GUIGA_NU, paymentMethod: 'pix', description: 'Uber', amount: 34.00, date: d(3), category: 'transport', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Netflix', amount: 44.90, date: d(4), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, paymentMethod: 'cash', description: 'Farmácia', amount: 89.50, date: d(5), category: 'health', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'Samsung Galaxy S24', amount: 599.00, date: d(6), category: 'shopping', isRecurring: false,
      installment: { total: 12, current: 1, amountPerInstallment: 599.00 } },
    { id: uuid(), userId: USER_GUIGA, bankAccountId: ACC_GUIGA_BB, paymentMethod: 'pix', description: 'Supermercado Extra', amount: 312.40, date: d(7), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'Academia Smart Fit', amount: 99.90, date: d(8), category: 'health', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Prime Video', amount: 19.90, date: d(9), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, paymentMethod: 'cash', description: 'Restaurante', amount: 78.00, date: d(10), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'AirPods Pro', amount: 250.00, date: d(11), category: 'shopping', isRecurring: false,
      installment: { total: 10, current: 1, amountPerInstallment: 250.00 } },
    { id: uuid(), userId: USER_GUIGA, bankAccountId: ACC_GUIGA_BB, paymentMethod: 'pix', description: 'Gasolina', amount: 150.00, date: d(12), category: 'transport', isRecurring: false },

    // Namorada - this month
    { id: uuid(), userId: USER_NAM, cardId: CARD_INTER, paymentMethod: 'credit', description: 'Salão de beleza', amount: 120.00, date: d(2), category: 'shopping', isRecurring: false },
    { id: uuid(), userId: USER_NAM, paymentMethod: 'cash', description: 'Farmácia', amount: 67.00, date: d(4), category: 'health', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Shein', amount: 189.90, date: d(5), category: 'shopping', isRecurring: false,
      installment: { total: 3, current: 1, amountPerInstallment: 63.30 } },
    { id: uuid(), userId: USER_NAM, bankAccountId: ACC_NAM_INTER, paymentMethod: 'pix', description: 'Supermercado', amount: 245.00, date: d(6), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Notebook Dell', amount: 466.67, date: d(7), category: 'education', isRecurring: false,
      installment: { total: 6, current: 1, amountPerInstallment: 466.67 } },
    { id: uuid(), userId: USER_NAM, bankAccountId: ACC_NAM_INTER, paymentMethod: 'pix', description: 'iFood', amount: 38.50, date: d(8), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Roupas Renner', amount: 310.00, date: d(9), category: 'shopping', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_INTER, paymentMethod: 'credit', description: 'Gym', amount: 89.90, date: d(10), category: 'health', isRecurring: true },

    // Last month - Guiga
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'iFood', amount: 52.00, date: dm(1, 15), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Spotify', amount: 21.90, date: dm(1, 10), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, bankAccountId: ACC_GUIGA_BB, paymentMethod: 'pix', description: 'Supermercado', amount: 280.00, date: dm(1, 12), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'Academia', amount: 99.90, date: dm(1, 5), category: 'health', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Netflix', amount: 44.90, date: dm(1, 8), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, bankAccountId: ACC_GUIGA_BB, paymentMethod: 'pix', description: 'Gasolina', amount: 140.00, date: dm(1, 20), category: 'transport', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'Samsung Galaxy S24', amount: 599.00, date: dm(1, 6), category: 'shopping', isRecurring: false,
      installment: { total: 12, current: 2, amountPerInstallment: 599.00 } },

    // Last month - Namorada
    { id: uuid(), userId: USER_NAM, bankAccountId: ACC_NAM_INTER, paymentMethod: 'pix', description: 'Supermercado', amount: 220.00, date: dm(1, 10), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Viagem Buzios', amount: 890.00, date: dm(1, 15), category: 'travel', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_INTER, paymentMethod: 'credit', description: 'Gym', amount: 89.90, date: dm(1, 5), category: 'health', isRecurring: true },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Roupas', amount: 250.00, date: dm(1, 18), category: 'shopping', isRecurring: false },

    // 2 months ago - Guiga
    { id: uuid(), userId: USER_GUIGA, paymentMethod: 'cash', description: 'iFood', amount: 61.00, date: dm(2, 14), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, bankAccountId: ACC_GUIGA_BB, paymentMethod: 'pix', description: 'Supermercado', amount: 295.00, date: dm(2, 11), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Spotify', amount: 21.90, date: dm(2, 10), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_NU, paymentMethod: 'credit', description: 'Netflix', amount: 44.90, date: dm(2, 8), category: 'subscriptions', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'Academia', amount: 99.90, date: dm(2, 5), category: 'health', isRecurring: true },
    { id: uuid(), userId: USER_GUIGA, cardId: CARD_ITAU, paymentMethod: 'credit', description: 'Samsung Galaxy S24', amount: 599.00, date: dm(2, 6), category: 'shopping', isRecurring: false,
      installment: { total: 12, current: 3, amountPerInstallment: 599.00 } },

    // 2 months ago - Namorada
    { id: uuid(), userId: USER_NAM, bankAccountId: ACC_NAM_INTER, paymentMethod: 'pix', description: 'iFood', amount: 44.50, date: dm(2, 12), category: 'food', isRecurring: false },
    { id: uuid(), userId: USER_NAM, cardId: CARD_INTER, paymentMethod: 'credit', description: 'Gym', amount: 89.90, date: dm(2, 5), category: 'health', isRecurring: true },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Shein', amount: 63.30, date: dm(2, 7), category: 'shopping', isRecurring: false,
      installment: { total: 3, current: 2, amountPerInstallment: 63.30 } },
    { id: uuid(), userId: USER_NAM, cardId: CARD_C6, paymentMethod: 'credit', description: 'Notebook Dell', amount: 466.67, date: dm(2, 8), category: 'education', isRecurring: false,
      installment: { total: 6, current: 2, amountPerInstallment: 466.67 } },
  ],
  bills: [
    { id: uuid(), userId: USER_GUIGA, name: 'Aluguel', amount: 1500, dueDay: 5, category: 'housing', isActive: true },
    { id: uuid(), userId: USER_GUIGA, name: 'Internet Vivo', amount: 99.90, dueDay: 10, category: 'utilities', isActive: true },
    { id: uuid(), userId: USER_GUIGA, name: 'Energia Elétrica', amount: 130, dueDay: 15, category: 'utilities', isActive: true },
    { id: uuid(), userId: USER_GUIGA, name: 'Água', amount: 45, dueDay: 20, category: 'utilities', isActive: true },
    { id: uuid(), userId: USER_NAM, name: 'Academia Premium', amount: 149.90, dueDay: 10, category: 'health', isActive: true },
    { id: uuid(), userId: USER_NAM, name: 'Plano de Saúde', amount: 290, dueDay: 20, category: 'health', isActive: true },
  ],
  billPayments: [],
  invoicePayments: [],
  boletos: [],
}
