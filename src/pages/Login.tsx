import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Wallet, Mail, Lock, User as UserIcon } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const COLORS = ['#0ea5e9', '#f97316', '#a855f7', '#22c55e', '#ec4899', '#eab308']

export function Login() {
  const { signIn, signUp } = useAuth()
  const [searchParams] = useSearchParams()
  const inviteHouseholdId = searchParams.get('invite')

  const [mode, setMode] = useState<'signin' | 'signup'>(inviteHouseholdId ? 'signup' : 'signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [color, setColor] = useState(COLORS[1]) // laranja p/ namorada por padrão no convite
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)

    const result = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(
          email, password,
          displayName || email.split('@')[0],
          color,
          (displayName || email)[0]?.toUpperCase() || 'U',
          inviteHouseholdId ?? undefined,
        )

    setLoading(false)
    if (result.error) setError(result.error)
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-glow mb-4">
            <Wallet className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Finance<span className="text-brand-400">Flow</span>
          </h1>
          {inviteHouseholdId ? (
            <p className="text-sm text-emerald-400 mt-1">Você foi convidado(a)! Crie sua conta para entrar.</p>
          ) : (
            <p className="text-sm text-slate-500 mt-1">Gestão financeira inteligente</p>
          )}
        </div>

        <div className="bg-surface-900 border border-white/10 rounded-2xl p-6">
          {!inviteHouseholdId && (
            <div className="flex gap-1 bg-surface-800 rounded-xl p-1 mb-6">
              {(['signin', 'signup'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} type="button"
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    mode === m ? 'bg-brand-500/20 text-brand-400' : 'text-slate-400 hover:text-white'
                  }`}>
                  {m === 'signin' ? 'Entrar' : 'Criar conta'}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {(mode === 'signup') && (
              <>
                <Field icon={UserIcon} label="Seu nome" type="text" value={displayName}
                  onChange={setDisplayName} placeholder="Como te chamamos?" />
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Sua cor</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setColor(c)}
                        className={`w-9 h-9 rounded-xl transition-all ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-900 scale-110' : ''}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
              </>
            )}
            <Field icon={Mail} label="Email" type="email" value={email}
              onChange={setEmail} placeholder="voce@email.com" required />
            <Field icon={Lock} label="Senha" type="password" value={password}
              onChange={setPassword} placeholder="••••••••" required />

            {error && (
              <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors">
              {loading ? 'Aguarde...' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          {inviteHouseholdId
            ? 'Ao criar conta por este link, você entra no household de quem te convidou.'
            : mode === 'signup'
              ? 'Ao criar conta, você inicia uma "casa". Convide seu parceiro(a) depois.'
              : 'Use o email e senha que você cadastrou.'}
        </p>
      </div>
    </div>
  )
}

interface FieldProps {
  icon: React.ElementType
  label: string
  type: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
}
function Field({ icon: Icon, label, type, value, onChange, placeholder, required }: FieldProps) {
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full bg-surface-800 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500" />
      </div>
    </div>
  )
}
