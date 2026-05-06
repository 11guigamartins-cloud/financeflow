import React, { createContext, useContext, useEffect, useReducer, useState } from 'react'
import type {
  AppState, Card, Transaction, Bill, User, BankAccount, Income,
  BillPayment, InvoicePayment, Boleto,
} from '../types'
import { supabase } from '../lib/supabase'
import {
  loadAllData,
  toCard, toBankAccount, toTransaction, toIncome, toBill,
  toBillPayment, toInvoicePayment, toBoleto,
  fromCard, fromBankAccount, fromTransaction, fromIncome, fromBill,
  fromBillPayment, fromInvoicePayment, fromBoleto,
} from '../lib/db'
import { useAuth } from './AuthContext'

const EMPTY: AppState = {
  users: [], cards: [], bankAccounts: [], transactions: [],
  incomes: [], bills: [], billPayments: [], invoicePayments: [], boletos: [],
  activeUserId: null,
}

// ─── Reducer (otimista — atualiza local imediatamente) ────────────────────────

type Action =
  | { type: 'INIT'; data: Omit<AppState, 'activeUserId'> }
  | { type: 'SET_ACTIVE_USER'; userId: string }
  | { type: 'ADD_USER'; user: User }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'ADD_CARD'; card: Card }
  | { type: 'UPDATE_CARD'; card: Card }
  | { type: 'DELETE_CARD'; cardId: string }
  | { type: 'ADD_BANK_ACCOUNT'; account: BankAccount }
  | { type: 'UPDATE_BANK_ACCOUNT'; account: BankAccount }
  | { type: 'DELETE_BANK_ACCOUNT'; accountId: string }
  | { type: 'SET_BANK_BALANCE'; accountId: string; balance: number }
  | { type: 'ADD_TRANSACTION'; transaction: Transaction }
  | { type: 'UPDATE_TRANSACTION'; transaction: Transaction }
  | { type: 'DELETE_TRANSACTION'; transactionId: string }
  | { type: 'ADD_INCOME'; income: Income }
  | { type: 'UPDATE_INCOME'; income: Income }
  | { type: 'DELETE_INCOME'; incomeId: string }
  | { type: 'ADD_BILL'; bill: Bill }
  | { type: 'UPDATE_BILL'; bill: Bill }
  | { type: 'DELETE_BILL'; billId: string }
  | { type: 'UPSERT_BILL_PAYMENT'; payment: BillPayment }
  | { type: 'UPSERT_INVOICE_PAYMENT'; payment: InvoicePayment }
  | { type: 'ADD_BOLETO'; boleto: Boleto }
  | { type: 'UPDATE_BOLETO'; boleto: Boleto }
  | { type: 'DELETE_BOLETO'; boletoId: string }

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'INIT':
      return { ...state, ...action.data }
    case 'SET_ACTIVE_USER':
      return { ...state, activeUserId: action.userId || null }

    case 'ADD_USER':
      return { ...state, users: [...state.users, action.user] }
    case 'UPDATE_USER':
      return { ...state, users: state.users.map((u) => u.id === action.user.id ? action.user : u) }

    case 'ADD_CARD':
      return { ...state, cards: [...state.cards, action.card] }
    case 'UPDATE_CARD':
      return { ...state, cards: state.cards.map((c) => c.id === action.card.id ? action.card : c) }
    case 'DELETE_CARD':
      return {
        ...state,
        cards: state.cards.filter((c) => c.id !== action.cardId),
        transactions: state.transactions.filter((t) => t.cardId !== action.cardId),
      }

    case 'ADD_BANK_ACCOUNT':
      return { ...state, bankAccounts: [...state.bankAccounts, action.account] }
    case 'UPDATE_BANK_ACCOUNT':
      return { ...state, bankAccounts: state.bankAccounts.map((a) => a.id === action.account.id ? action.account : a) }
    case 'DELETE_BANK_ACCOUNT':
      return { ...state, bankAccounts: state.bankAccounts.filter((a) => a.id !== action.accountId) }
    case 'SET_BANK_BALANCE':
      return {
        ...state,
        bankAccounts: state.bankAccounts.map((a) => a.id === action.accountId ? { ...a, balance: action.balance } : a),
      }

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.transaction, ...state.transactions] }
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map((t) => t.id === action.transaction.id ? action.transaction : t) }
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.transactionId) }

    case 'ADD_INCOME':
      return { ...state, incomes: [action.income, ...state.incomes] }
    case 'UPDATE_INCOME':
      return { ...state, incomes: state.incomes.map((i) => i.id === action.income.id ? action.income : i) }
    case 'DELETE_INCOME':
      return { ...state, incomes: state.incomes.filter((i) => i.id !== action.incomeId) }

    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.bill] }
    case 'UPDATE_BILL':
      return { ...state, bills: state.bills.map((b) => b.id === action.bill.id ? action.bill : b) }
    case 'DELETE_BILL':
      return { ...state, bills: state.bills.filter((b) => b.id !== action.billId) }

    case 'UPSERT_BILL_PAYMENT': {
      const exists = state.billPayments.find((p) => p.id === action.payment.id)
      return {
        ...state,
        billPayments: exists
          ? state.billPayments.map((p) => p.id === action.payment.id ? action.payment : p)
          : [...state.billPayments, action.payment],
      }
    }

    case 'UPSERT_INVOICE_PAYMENT': {
      const exists = state.invoicePayments.find((p) => p.id === action.payment.id)
      return {
        ...state,
        invoicePayments: exists
          ? state.invoicePayments.map((p) => p.id === action.payment.id ? action.payment : p)
          : [...state.invoicePayments, action.payment],
      }
    }

    case 'ADD_BOLETO':
      return { ...state, boletos: [...state.boletos, action.boleto] }
    case 'UPDATE_BOLETO':
      return { ...state, boletos: state.boletos.map((b) => b.id === action.boleto.id ? action.boleto : b) }
    case 'DELETE_BOLETO':
      return { ...state, boletos: state.boletos.filter((b) => b.id !== action.boletoId) }

    default: return state
  }
}

// ─── Public dispatch API (igual ao antigo, mas async por trás) ────────────────

type PublicAction =
  | { type: 'SET_ACTIVE_USER'; userId: string }
  | { type: 'ADD_USER'; user: Omit<User, 'id'> }
  | { type: 'UPDATE_USER'; user: User }
  | { type: 'ADD_CARD'; card: Omit<Card, 'id'> }
  | { type: 'UPDATE_CARD'; card: Card }
  | { type: 'DELETE_CARD'; cardId: string }
  | { type: 'ADD_BANK_ACCOUNT'; account: Omit<BankAccount, 'id'> }
  | { type: 'UPDATE_BANK_ACCOUNT'; account: BankAccount }
  | { type: 'DELETE_BANK_ACCOUNT'; accountId: string }
  | { type: 'SET_BANK_BALANCE'; accountId: string; balance: number }
  | { type: 'ADD_TRANSACTION'; transaction: Omit<Transaction, 'id'> }
  | { type: 'UPDATE_TRANSACTION'; transaction: Transaction }
  | { type: 'DELETE_TRANSACTION'; transactionId: string }
  | { type: 'ADD_INCOME'; income: Omit<Income, 'id'> }
  | { type: 'UPDATE_INCOME'; income: Income }
  | { type: 'DELETE_INCOME'; incomeId: string }
  | { type: 'ADD_BILL'; bill: Omit<Bill, 'id'> }
  | { type: 'UPDATE_BILL'; bill: Bill }
  | { type: 'DELETE_BILL'; billId: string }
  | { type: 'UPSERT_BILL_PAYMENT'; payment: Omit<BillPayment, 'id'> & { id?: string } }
  | { type: 'UPSERT_INVOICE_PAYMENT'; payment: Omit<InvoicePayment, 'id'> & { id?: string } }
  | { type: 'ADD_BOLETO'; boleto: Omit<Boleto, 'id'> }
  | { type: 'UPDATE_BOLETO'; boleto: Boleto }
  | { type: 'DELETE_BOLETO'; boletoId: string }

interface FinanceContextValue {
  state: AppState
  dispatch: (a: PublicAction) => void
  ready: boolean
  activeUser: User | undefined
  getUserCards: (userId: string) => Card[]
  getCardById: (cardId: string) => Card | undefined
  getUserById: (userId: string) => User | undefined
  getBankAccountById: (id: string) => BankAccount | undefined
  getUserBankAccounts: (userId: string) => BankAccount[]
  getTotalBankBalance: (userId?: string) => number
  getTransactionsForMonth: (monthKey: string, userId?: string) => Transaction[]
  getInstallmentTransactions: () => Transaction[]
  getTotalForMonth: (monthKey: string, userId?: string) => number
  getCardUsageForMonth: (cardId: string, monthKey: string) => number
  getIncomesForMonth: (monthKey: string, userId?: string) => Income[]
  getTotalIncomeForMonth: (monthKey: string, userId?: string) => number
  getBillPayment: (billId: string, monthKey: string) => BillPayment | undefined
  getInvoicePayment: (cardId: string, monthKey: string) => InvoicePayment | undefined
}

const FinanceContext = createContext<FinanceContextValue | null>(null)

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth()
  const [state, dispatchInternal] = useReducer(reducer, EMPTY)
  const [ready, setReady] = useState(false)
  const householdId = profile?.household_id

  // Carrega dados quando o usuário loga / muda
  useEffect(() => {
    if (!householdId) {
      dispatchInternal({ type: 'INIT', data: { ...EMPTY } })
      setReady(false)
      return
    }
    setReady(false)
    loadAllData(householdId).then((data) => {
      dispatchInternal({ type: 'INIT', data })
      // ativa o usuário logado por padrão
      if (profile) dispatchInternal({ type: 'SET_ACTIVE_USER', userId: profile.id })
      setReady(true)
    })
  }, [householdId, profile?.id])

  // ─── dispatch async wrapper ────────────────────────────────────────────────
  function dispatch(a: PublicAction) {
    if (!householdId) return
    void runAction(a)
  }

  async function runAction(a: PublicAction) {
    if (!householdId) return
    const hh = householdId
    switch (a.type) {

      case 'SET_ACTIVE_USER':
        dispatchInternal(a); return

      case 'ADD_CARD': {
        const { data } = await supabase.from('cards').insert({ ...toCard(a.card), household_id: hh }).select().single()
        if (data) dispatchInternal({ type: 'ADD_CARD', card: fromCard(data) })
        return
      }
      case 'UPDATE_CARD': {
        const { id, ...rest } = a.card
        await supabase.from('cards').update(toCard(rest)).eq('id', id)
        dispatchInternal(a); return
      }
      case 'DELETE_CARD':
        await supabase.from('cards').delete().eq('id', a.cardId)
        dispatchInternal(a); return

      case 'ADD_BANK_ACCOUNT': {
        const { data } = await supabase.from('bank_accounts').insert({ ...toBankAccount(a.account), household_id: hh }).select().single()
        if (data) dispatchInternal({ type: 'ADD_BANK_ACCOUNT', account: fromBankAccount(data) })
        return
      }
      case 'UPDATE_BANK_ACCOUNT': {
        const { id, ...rest } = a.account
        await supabase.from('bank_accounts').update(toBankAccount(rest)).eq('id', id)
        dispatchInternal(a); return
      }
      case 'DELETE_BANK_ACCOUNT':
        await supabase.from('bank_accounts').delete().eq('id', a.accountId)
        dispatchInternal(a); return
      case 'SET_BANK_BALANCE':
        await supabase.from('bank_accounts').update({ balance: a.balance }).eq('id', a.accountId)
        dispatchInternal(a); return

      case 'ADD_TRANSACTION': {
        const { data } = await supabase.from('transactions').insert({ ...toTransaction(a.transaction), household_id: hh }).select().single()
        if (data) dispatchInternal({ type: 'ADD_TRANSACTION', transaction: fromTransaction(data) })
        return
      }
      case 'UPDATE_TRANSACTION': {
        const { id, ...rest } = a.transaction
        await supabase.from('transactions').update(toTransaction(rest)).eq('id', id)
        dispatchInternal(a); return
      }
      case 'DELETE_TRANSACTION':
        await supabase.from('transactions').delete().eq('id', a.transactionId)
        dispatchInternal(a); return

      case 'ADD_INCOME': {
        const { data } = await supabase.from('incomes').insert({ ...toIncome(a.income), household_id: hh }).select().single()
        if (data) dispatchInternal({ type: 'ADD_INCOME', income: fromIncome(data) })
        return
      }
      case 'UPDATE_INCOME': {
        const { id, ...rest } = a.income
        await supabase.from('incomes').update(toIncome(rest)).eq('id', id)
        dispatchInternal(a); return
      }
      case 'DELETE_INCOME':
        await supabase.from('incomes').delete().eq('id', a.incomeId)
        dispatchInternal(a); return

      case 'ADD_BILL': {
        const { data } = await supabase.from('bills').insert({ ...toBill(a.bill), household_id: hh }).select().single()
        if (data) dispatchInternal({ type: 'ADD_BILL', bill: fromBill(data) })
        return
      }
      case 'UPDATE_BILL': {
        const { id, ...rest } = a.bill
        await supabase.from('bills').update(toBill(rest)).eq('id', id)
        dispatchInternal(a); return
      }
      case 'DELETE_BILL':
        await supabase.from('bills').delete().eq('id', a.billId)
        dispatchInternal(a); return

      case 'UPSERT_BILL_PAYMENT': {
        const { id, ...rest } = a.payment
        const payload = { ...toBillPayment(rest), household_id: hh }
        const { data } = await supabase
          .from('bill_payments')
          .upsert({ ...payload, ...(id ? { id } : {}) }, { onConflict: 'bill_id,month_key' })
          .select().single()
        if (data) dispatchInternal({ type: 'UPSERT_BILL_PAYMENT', payment: fromBillPayment(data) })
        return
      }
      case 'UPSERT_INVOICE_PAYMENT': {
        const { id, ...rest } = a.payment
        const payload = { ...toInvoicePayment(rest), household_id: hh }
        const { data } = await supabase
          .from('invoice_payments')
          .upsert({ ...payload, ...(id ? { id } : {}) }, { onConflict: 'card_id,month_key' })
          .select().single()
        if (data) dispatchInternal({ type: 'UPSERT_INVOICE_PAYMENT', payment: fromInvoicePayment(data) })
        return
      }

      case 'ADD_BOLETO': {
        const { data } = await supabase.from('boletos').insert({ ...toBoleto(a.boleto), household_id: hh }).select().single()
        if (data) dispatchInternal({ type: 'ADD_BOLETO', boleto: fromBoleto(data) })
        return
      }
      case 'UPDATE_BOLETO': {
        const { id, ...rest } = a.boleto
        await supabase.from('boletos').update(toBoleto(rest)).eq('id', id)
        dispatchInternal(a); return
      }
      case 'DELETE_BOLETO':
        await supabase.from('boletos').delete().eq('id', a.boletoId)
        dispatchInternal(a); return

      case 'UPDATE_USER': {
        await supabase.from('profiles').update({
          display_name: a.user.name, color: a.user.color, avatar: a.user.avatar,
        }).eq('id', a.user.id)
        dispatchInternal(a); return
      }

      case 'ADD_USER':
        // criar novo usuário = convidar pessoa pro household. Tratado em outro fluxo.
        return
    }
  }

  // ─── selectors (idênticos à versão anterior) ──────────────────────────────
  const activeUser = state.users.find((u) => u.id === state.activeUserId)

  const getUserCards = (userId: string) => state.cards.filter((c) => c.userId === userId)
  const getCardById = (cardId: string) => state.cards.find((c) => c.id === cardId)
  const getUserById = (userId: string) => state.users.find((u) => u.id === userId)

  const getBankAccountById = (id: string) => state.bankAccounts.find((a) => a.id === id)
  const getUserBankAccounts = (userId: string) => state.bankAccounts.filter((a) => a.userId === userId)
  const getTotalBankBalance = (userId?: string) =>
    state.bankAccounts.filter((a) => userId ? a.userId === userId : true)
      .reduce((s, a) => s + a.balance, 0)

  const getTransactionsForMonth = (monthKey: string, userId?: string) => {
    const [y, m] = monthKey.split('-').map(Number)
    return state.transactions.filter((t) => {
      const d = new Date(t.date)
      const matches = d.getFullYear() === y && d.getMonth() + 1 === m
      return userId ? matches && t.userId === userId : matches
    })
  }

  const getInstallmentTransactions = () =>
    state.transactions.filter((t) => t.installment && t.installment.current === 1)

  const getTotalForMonth = (monthKey: string, userId?: string) =>
    getTransactionsForMonth(monthKey, userId).reduce((sum, t) => sum + t.amount, 0)

  const getCardUsageForMonth = (cardId: string, monthKey: string) => {
    const [y, m] = monthKey.split('-').map(Number)
    return state.transactions
      .filter((t) => {
        const d = new Date(t.date)
        return t.cardId === cardId && d.getFullYear() === y && d.getMonth() + 1 === m
      })
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const getIncomesForMonth = (monthKey: string, userId?: string) => {
    const [y, m] = monthKey.split('-').map(Number)
    return state.incomes.filter((i) => {
      const d = new Date(i.date)
      const matches = d.getFullYear() === y && d.getMonth() + 1 === m
      return userId ? matches && i.userId === userId : matches
    })
  }

  const getTotalIncomeForMonth = (monthKey: string, userId?: string) =>
    getIncomesForMonth(monthKey, userId)
      .filter((i) => i.status === 'received')
      .reduce((sum, i) => sum + i.amount, 0)

  const getBillPayment = (billId: string, monthKey: string) =>
    state.billPayments.find((p) => p.billId === billId && p.monthKey === monthKey)
  const getInvoicePayment = (cardId: string, monthKey: string) =>
    state.invoicePayments.find((p) => p.cardId === cardId && p.monthKey === monthKey)

  return (
    <FinanceContext.Provider value={{
      state, dispatch, ready, activeUser,
      getUserCards, getCardById, getUserById,
      getBankAccountById, getUserBankAccounts, getTotalBankBalance,
      getTransactionsForMonth, getInstallmentTransactions,
      getTotalForMonth, getCardUsageForMonth,
      getIncomesForMonth, getTotalIncomeForMonth,
      getBillPayment, getInvoicePayment,
    }}>
      {children}
    </FinanceContext.Provider>
  )
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
