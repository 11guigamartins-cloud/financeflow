import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { FinanceProvider } from './contexts/FinanceContext'
import { Dashboard } from './pages/Dashboard'
import { Cards } from './pages/Cards'
import { Transactions } from './pages/Transactions'
import { Installments } from './pages/Installments'
import { Bills } from './pages/Bills'
import { Reports } from './pages/Reports'
import { Income } from './pages/Income'
import { Payments } from './pages/Payments'
import { Login } from './pages/Login'

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  return <FinanceProvider>{children}</FinanceProvider>
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/"             element={<ProtectedShell><Dashboard /></ProtectedShell>} />
          <Route path="/income"       element={<ProtectedShell><Income /></ProtectedShell>} />
          <Route path="/cards"        element={<ProtectedShell><Cards /></ProtectedShell>} />
          <Route path="/transactions" element={<ProtectedShell><Transactions /></ProtectedShell>} />
          <Route path="/installments" element={<ProtectedShell><Installments /></ProtectedShell>} />
          <Route path="/bills"        element={<ProtectedShell><Bills /></ProtectedShell>} />
          <Route path="/payments"     element={<ProtectedShell><Payments /></ProtectedShell>} />
          <Route path="/reports"      element={<ProtectedShell><Reports /></ProtectedShell>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
