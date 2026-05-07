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
import { Admin } from './pages/Admin'

function ProtectedShell({ children }: { children: React.ReactNode }) {
  const { session, profile, loading, signOut } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }
  if (!session) return <Navigate to="/login" replace />
  if (profile && !profile.approved) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/20 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg">Aguardando aprovação</p>
          <p className="text-slate-400 text-sm">Sua conta foi criada com sucesso! Um administrador irá aprovar o seu acesso em breve.</p>
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 text-slate-300 rounded-xl font-medium transition-colors text-sm">
            Sair
          </button>
        </div>
      </div>
    )
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-lg">Sessão expirada</p>
          <p className="text-slate-400 text-sm">Sua sessão expirou. Faça o login novamente para continuar.</p>
          <button
            onClick={() => signOut()}
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl font-medium transition-colors">
            Fazer login novamente
          </button>
        </div>
      </div>
    )
  }
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
          <Route path="/admin"        element={<ProtectedShell><Admin /></ProtectedShell>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
