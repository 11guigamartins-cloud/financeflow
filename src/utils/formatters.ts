import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)

export const formatDate = (dateStr: string): string =>
  format(parseISO(dateStr), 'dd/MM/yyyy', { locale: ptBR })

export const formatMonthYear = (dateStr: string): string =>
  format(parseISO(dateStr), 'MMMM yyyy', { locale: ptBR })

export const formatShortDate = (dateStr: string): string =>
  format(parseISO(dateStr), 'dd MMM', { locale: ptBR })

export const getCurrentMonthKey = (): string =>
  format(new Date(), 'yyyy-MM')

export const getMonthKey = (date: Date): string =>
  format(date, 'yyyy-MM')

export const isInMonth = (dateStr: string, monthKey: string): boolean => {
  const date = parseISO(dateStr)
  const [y, m] = monthKey.split('-').map(Number)
  const ref = new Date(y, m - 1, 1)
  return isWithinInterval(date, { start: startOfMonth(ref), end: endOfMonth(ref) })
}

export const getLast12Months = (): string[] => {
  const months: string[] = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(format(d, 'yyyy-MM'))
  }
  return months
}

export const monthLabel = (monthKey: string): string => {
  const [y, m] = monthKey.split('-').map(Number)
  return format(new Date(y, m - 1, 1), 'MMM/yy', { locale: ptBR })
}

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1)
