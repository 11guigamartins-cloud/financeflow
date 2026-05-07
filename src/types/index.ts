// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string
  name: string
  color: string
  avatar: string
}

// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardType = 'credit' | 'debit' | 'both'
export type CardNetwork = 'visa' | 'mastercard' | 'elo' | 'amex' | 'hipercard' | 'other'

export interface Card {
  id: string
  userId: string
  name: string
  bank: string
  lastFourDigits: string
  type: CardType
  network: CardNetwork
  limit?: number
  closingDay?: number
  dueDay?: number
  color: string
  bankAccountId?: string
}

// ─── Bank Accounts ────────────────────────────────────────────────────────────

export type BankAccountType = 'checking' | 'savings' | 'investment'

export interface BankAccount {
  id: string
  userId: string
  name: string
  bank: string
  type: BankAccountType
  balance: number
  color: string
}

// ─── Categories ───────────────────────────────────────────────────────────────

export type CategoryId =
  | 'food'
  | 'transport'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'shopping'
  | 'utilities'
  | 'housing'
  | 'travel'
  | 'subscriptions'
  | 'investment'
  | 'other'

export type IncomeCategoryId =
  | 'salary'
  | 'freelance'
  | 'investment_return'
  | 'gift'
  | 'rental'
  | 'bonus'
  | 'other_income'

export interface Category {
  id: CategoryId
  label: string
  icon: string
  color: string
}

export interface IncomeCategory {
  id: IncomeCategoryId
  label: string
  icon: string
  color: string
}

// ─── Payment Method ───────────────────────────────────────────────────────────

export type PaymentMethod = 'credit' | 'debit' | 'pix' | 'cash'

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface Installment {
  total: number
  current: number
  amountPerInstallment: number
}

export interface Transaction {
  id: string
  userId: string
  cardId?: string          // required only for credit/debit card
  bankAccountId?: string   // required for pix/debit, optional for cash
  paymentMethod: PaymentMethod
  description: string
  amount: number
  date: string
  category: CategoryId
  installment?: Installment
  isRecurring: boolean
  note?: string
}

// ─── Income ───────────────────────────────────────────────────────────────────

export type IncomeStatus = 'received' | 'pending'

export interface Income {
  id: string
  userId: string
  description: string
  amount: number
  date: string
  category: IncomeCategoryId
  bankAccountId?: string
  isRecurring: boolean
  status: IncomeStatus
  note?: string
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export interface Bill {
  id: string
  userId: string
  name: string
  amount: number
  dueDay: number
  category: CategoryId
  cardId?: string
  isActive: boolean
  note?: string
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export interface BillPayment {
  id: string
  billId: string
  monthKey: string       // 'yyyy-MM'
  amount: number
  isPaid: boolean
  paidDate?: string
  bankAccountId?: string
  note?: string
}

export interface InvoicePayment {
  id: string
  cardId: string
  monthKey: string       // 'yyyy-MM'
  amount: number         // total fatura
  isPaid: boolean
  paidDate?: string
  bankAccountId?: string
  note?: string
}

export interface Boleto {
  id: string
  userId: string
  description: string
  amount: number
  dueDate: string
  barcode?: string
  isPaid: boolean
  paidDate?: string
  bankAccountId?: string
  note?: string
}

// ─── Summary helpers ──────────────────────────────────────────────────────────

export interface AppState {
  users: User[]
  cards: Card[]
  bankAccounts: BankAccount[]
  transactions: Transaction[]
  incomes: Income[]
  bills: Bill[]
  billPayments: BillPayment[]
  invoicePayments: InvoicePayment[]
  boletos: Boleto[]
  activeUserId: string | null
}
