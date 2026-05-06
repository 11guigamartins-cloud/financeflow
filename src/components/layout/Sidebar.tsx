import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight,
  Layers, FileText, BarChart2, Wallet, TrendingUp, CheckSquare,
  LogOut, UserPlus, Copy, Check, X,
} from 'lucide-react'
import { useFinance } from '../../contexts/FinanceContext'
import { useAuth } from '../../contexts/AuthContext'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/income',        icon: TrendingUp,      label: 'Entradas'         },
  { to: '/cards',         icon: CreditCard,      label: 'Cartões & Contas' },
  { to: '/transactions',  icon: ArrowLeftRight,  label: 'Transações'       },
  { to: '/installments',  icon: Layers,          label: 'Parcelamentos'    },
  { to: '/bills',         icon: FileText,        label: 'Contas Fixas'     },
  { to: '/payments',      icon: CheckSquare,     label: 'Pagamentos'       },
  { to: '/reports',       icon: BarChart2,       label: 'Relatórios'       },
]

function InviteModal({ householdId, onClose }: { householdId: string; onClose: () => void }) {
  const link = `${window.location.origin}/login?invite=${householdId}`
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-surface-900 border border-white/10 rounded-2xl w-full max-w-sm">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Convidar parceiro(a)</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            Envie este link para quem quiser adicionar ao seu household. Ao criar conta por este link, a pessoa entra automaticamente na sua casa.
          </p>
          <div className="bg-surface-800 border border-white/10 rounded-xl p-3 flex items-center gap-2">
            <p className="text-xs text-slate-300 flex-1 break-all font-mono leading-relaxed">{link}</p>
            <button onClick={copy}
              className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={copy}
            className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
            {copied ? <><Check className="w-4 h-4" /> Link copiado!</> : <><Copy className="w-4 h-4" /> Copiar link</>}
          </button>
        </div>
      </div>
    </div>
  )
}

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps = {}) {
  const { state, dispatch } = useFinance()
  const { profile, signOut } = useAuth()
  const [showInvite, setShowInvite] = useState(false)

  return (
    <>
      <aside className="h-full w-64 bg-surface-900 border-r border-white/10 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-none">Finance</span>
              <span className="text-brand-400 font-bold text-lg leading-none">Flow</span>
              <p className="text-xs text-slate-500 mt-0.5">Gestão inteligente</p>
            </div>
          </div>
        </div>

        {/* User switcher */}
        <div className="p-4 border-b border-white/10">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide font-medium">Visualizando</p>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: 'SET_ACTIVE_USER', userId: '' })}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                !state.activeUserId
                  ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:bg-white/5 border border-transparent'
              }`}
            >
              Todos
            </button>
            {state.users.map((u) => (
              <button
                key={u.id}
                onClick={() => dispatch({ type: 'SET_ACTIVE_USER', userId: u.id })}
                title={u.name}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all border ${
                  state.activeUserId === u.id
                    ? 'border-opacity-40 text-white'
                    : 'border-transparent text-slate-400 hover:bg-white/5'
                }`}
                style={
                  state.activeUserId === u.id
                    ? { backgroundColor: `${u.color}22`, borderColor: u.color, color: u.color }
                    : {}
                }
              >
                {u.avatar}
              </button>
            ))}
          </div>
          {state.activeUserId && (
            <p className="text-center text-xs text-slate-500 mt-2">
              {state.users.find((u) => u.id === state.activeUserId)?.name}
            </p>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-400 border border-brand-500/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer — perfil + ações */}
        <div className="p-4 border-t border-white/10 space-y-2">
          {/* Usuário logado */}
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-white/5 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
              style={{ backgroundColor: profile?.color ?? '#0ea5e9' }}>
              {profile?.avatar ?? '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{profile?.display_name ?? '...'}</p>
              <p className="text-xs text-slate-500">Conta ativa</p>
            </div>
            <button onClick={() => signOut()}
              title="Sair"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Convidar */}
          {profile?.household_id && (
            <button
              onClick={() => setShowInvite(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-brand-400 hover:bg-brand-500/10 transition-colors">
              <UserPlus className="w-3.5 h-3.5" />
              Convidar parceiro(a)
            </button>
          )}
        </div>
      </aside>

      {showInvite && profile?.household_id && (
        <InviteModal householdId={profile.household_id} onClose={() => setShowInvite(false)} />
      )}
    </>
  )
}
