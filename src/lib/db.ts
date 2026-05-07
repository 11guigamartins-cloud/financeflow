import { supabase } from './supabase'
import type {
  Card, BankAccount, Transaction, Income, Bill,
  BillPayment, InvoicePayment, Boleto, User,
} from '../types'

// ════════════════════════════════════════════════════════════════════
// Mappers (snake_case ↔ camelCase)
// ════════════════════════════════════════════════════════════════════

// ─── Profile / User ────────────────────────────────────────────────────────
export const fromProfile = (r: any): User => ({
  id: r.id, name: r.display_name, color: r.color, avatar: r.avatar,
})

// ─── Card ──────────────────────────────────────────────────────────────────
export const fromCard = (r: any): Card => ({
  id: r.id, userId: r.user_id, name: r.name, bank: r.bank,
  lastFourDigits: r.last_four_digits, type: r.type, network: r.network,
  limit: r.card_limit ?? undefined,
  closingDay: r.closing_day ?? undefined,
  dueDay: r.due_day ?? undefined, color: r.color,
  bankAccountId: r.bank_account_id ?? undefined,
})
export const toCard = (c: Omit<Card, 'id'>) => ({
  user_id: c.userId, name: c.name, bank: c.bank,
  last_four_digits: c.lastFourDigits, type: c.type, network: c.network,
  card_limit: c.limit ?? null, closing_day: c.closingDay ?? null,
  due_day: c.dueDay ?? null, color: c.color,
  bank_account_id: c.bankAccountId ?? null,
})

// ─── BankAccount ───────────────────────────────────────────────────────────
export const fromBankAccount = (r: any): BankAccount => ({
  id: r.id, userId: r.user_id, name: r.name, bank: r.bank,
  type: r.type, balance: Number(r.balance), color: r.color,
})
export const toBankAccount = (a: Omit<BankAccount, 'id'>) => ({
  user_id: a.userId, name: a.name, bank: a.bank,
  type: a.type, balance: a.balance, color: a.color,
})

// ─── Transaction ───────────────────────────────────────────────────────────
export const fromTransaction = (r: any): Transaction => ({
  id: r.id, userId: r.user_id, cardId: r.card_id ?? undefined,
  bankAccountId: r.bank_account_id ?? undefined,
  paymentMethod: r.payment_method,
  description: r.description, amount: Number(r.amount), date: r.date,
  category: r.category,
  installment: r.installment_total
    ? { total: r.installment_total, current: r.installment_current, amountPerInstallment: Number(r.installment_amount) }
    : undefined,
  isRecurring: r.is_recurring, note: r.note ?? undefined,
})
export const toTransaction = (t: Omit<Transaction, 'id'>) => ({
  user_id: t.userId, card_id: t.cardId ?? null,
  bank_account_id: t.bankAccountId ?? null,
  payment_method: t.paymentMethod,
  description: t.description, amount: t.amount, date: t.date,
  category: t.category,
  installment_total: t.installment?.total ?? null,
  installment_current: t.installment?.current ?? null,
  installment_amount: t.installment?.amountPerInstallment ?? null,
  is_recurring: t.isRecurring, note: t.note ?? null,
})

// ─── Income ────────────────────────────────────────────────────────────────
export const fromIncome = (r: any): Income => ({
  id: r.id, userId: r.user_id, description: r.description,
  amount: Number(r.amount), date: r.date, category: r.category,
  bankAccountId: r.bank_account_id ?? undefined,
  isRecurring: r.is_recurring, status: r.status, note: r.note ?? undefined,
})
export const toIncome = (i: Omit<Income, 'id'>) => ({
  user_id: i.userId, description: i.description, amount: i.amount,
  date: i.date, category: i.category,
  bank_account_id: i.bankAccountId ?? null,
  is_recurring: i.isRecurring, status: i.status, note: i.note ?? null,
})

// ─── Bill ──────────────────────────────────────────────────────────────────
export const fromBill = (r: any): Bill => ({
  id: r.id, userId: r.user_id, name: r.name, amount: Number(r.amount),
  dueDay: r.due_day, category: r.category, cardId: r.card_id ?? undefined,
  isActive: r.is_active, note: r.note ?? undefined,
})
export const toBill = (b: Omit<Bill, 'id'>) => ({
  user_id: b.userId, name: b.name, amount: b.amount,
  due_day: b.dueDay, category: b.category, card_id: b.cardId ?? null,
  is_active: b.isActive, note: b.note ?? null,
})

// ─── BillPayment ───────────────────────────────────────────────────────────
export const fromBillPayment = (r: any): BillPayment => ({
  id: r.id, billId: r.bill_id, monthKey: r.month_key,
  amount: Number(r.amount), isPaid: r.is_paid,
  paidDate: r.paid_date ?? undefined,
  bankAccountId: r.bank_account_id ?? undefined,
  note: r.note ?? undefined,
})
export const toBillPayment = (p: Omit<BillPayment, 'id'>) => ({
  bill_id: p.billId, month_key: p.monthKey, amount: p.amount,
  is_paid: p.isPaid, paid_date: p.paidDate ?? null,
  bank_account_id: p.bankAccountId ?? null, note: p.note ?? null,
})

// ─── InvoicePayment ────────────────────────────────────────────────────────
export const fromInvoicePayment = (r: any): InvoicePayment => ({
  id: r.id, cardId: r.card_id, monthKey: r.month_key,
  amount: Number(r.amount), isPaid: r.is_paid,
  paidDate: r.paid_date ?? undefined,
  bankAccountId: r.bank_account_id ?? undefined,
  note: r.note ?? undefined,
})
export const toInvoicePayment = (p: Omit<InvoicePayment, 'id'>) => ({
  card_id: p.cardId, month_key: p.monthKey, amount: p.amount,
  is_paid: p.isPaid, paid_date: p.paidDate ?? null,
  bank_account_id: p.bankAccountId ?? null, note: p.note ?? null,
})

// ─── Boleto ────────────────────────────────────────────────────────────────
export const fromBoleto = (r: any): Boleto => ({
  id: r.id, userId: r.user_id, description: r.description,
  amount: Number(r.amount), dueDate: r.due_date,
  barcode: r.barcode ?? undefined, isPaid: r.is_paid,
  paidDate: r.paid_date ?? undefined,
  bankAccountId: r.bank_account_id ?? undefined,
  note: r.note ?? undefined,
})
export const toBoleto = (b: Omit<Boleto, 'id'>) => ({
  user_id: b.userId, description: b.description, amount: b.amount,
  due_date: b.dueDate, barcode: b.barcode ?? null, is_paid: b.isPaid,
  paid_date: b.paidDate ?? null,
  bank_account_id: b.bankAccountId ?? null, note: b.note ?? null,
})

// ════════════════════════════════════════════════════════════════════
// Bulk loader — fetch all data for the current household
// ════════════════════════════════════════════════════════════════════

export async function loadAllData(householdId: string) {
  const [users, cards, accounts, transactions, incomes, bills, billPayments, invoicePayments, boletos] = await Promise.all([
    supabase.from('profiles').select('*').eq('household_id', householdId),
    supabase.from('cards').select('*').eq('household_id', householdId),
    supabase.from('bank_accounts').select('*').eq('household_id', householdId),
    supabase.from('transactions').select('*').eq('household_id', householdId).order('date', { ascending: false }),
    supabase.from('incomes').select('*').eq('household_id', householdId).order('date', { ascending: false }),
    supabase.from('bills').select('*').eq('household_id', householdId),
    supabase.from('bill_payments').select('*').eq('household_id', householdId),
    supabase.from('invoice_payments').select('*').eq('household_id', householdId),
    supabase.from('boletos').select('*').eq('household_id', householdId).order('due_date'),
  ])

  return {
    users:           (users.data ?? []).map(fromProfile),
    cards:           (cards.data ?? []).map(fromCard),
    bankAccounts:    (accounts.data ?? []).map(fromBankAccount),
    transactions:    (transactions.data ?? []).map(fromTransaction),
    incomes:         (incomes.data ?? []).map(fromIncome),
    bills:           (bills.data ?? []).map(fromBill),
    billPayments:    (billPayments.data ?? []).map(fromBillPayment),
    invoicePayments: (invoicePayments.data ?? []).map(fromInvoicePayment),
    boletos:         (boletos.data ?? []).map(fromBoleto),
  }
}
