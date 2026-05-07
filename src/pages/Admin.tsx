import { useEffect, useState } from 'react'
import { Shield, Check, Clock, User } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface PendingUser {
  id: string
  display_name: string
  color: string
  avatar: string
  approved: boolean
  created_at: string
  email?: string
}

export function Admin() {
  const { profile } = useAuth()
  const [users, setUsers] = useState<PendingUser[]>([])
  const [loading, setLoading] = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('id, display_name, color, avatar, approved, created_at')
      .order('created_at', { ascending: false })
    setUsers((data as PendingUser[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function approve(userId: string) {
    setApproving(userId)
    await supabase.from('profiles').update({ approved: true }).eq('id', userId)
    setApproving(null)
    load()
  }

  if (!profile?.isAdmin) {
    return (
      <Layout title="Administração">
        <div className="text-center py-20 text-slate-500">Acesso restrito a administradores.</div>
      </Layout>
    )
  }

  const pending = users.filter((u) => !u.approved)
  const approved = users.filter((u) => u.approved)

  return (
    <Layout title="Administração" subtitle="Aprovação de usuários e controle de acesso">
      <div className="space-y-6 max-w-2xl">
        {/* Pending */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Aguardando aprovação</h3>
              <p className="text-xs text-slate-500">{pending.length} usuário{pending.length !== 1 ? 's' : ''} pendente{pending.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Carregando...</div>
          ) : pending.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">Nenhum usuário aguardando aprovação.</div>
          ) : (
            <div className="divide-y divide-white/5">
              {pending.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${u.color}33` }}>
                    {u.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{u.display_name}</p>
                    <p className="text-xs text-slate-500">
                      Cadastrado em {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => approve(u.id)}
                    disabled={approving === u.id}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-xl text-xs font-medium transition-colors disabled:opacity-50">
                    <Check className="w-3.5 h-3.5" />
                    {approving === u.id ? 'Aprovando...' : 'Aprovar'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved */}
        <div className="bg-surface-900 border border-white/10 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-white/10">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">Usuários ativos</h3>
              <p className="text-xs text-slate-500">{approved.length} usuário{approved.length !== 1 ? 's' : ''} com acesso</p>
            </div>
          </div>
          <div className="divide-y divide-white/5">
            {approved.map((u) => (
              <div key={u.id} className="flex items-center gap-4 p-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                  style={{ backgroundColor: `${u.color}33` }}>
                  {u.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white text-sm">{u.display_name}</p>
                  <p className="text-xs text-slate-500">
                    {u.id === profile.id ? 'Você (admin)' : `Desde ${new Date(u.created_at).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs">
                  <Check className="w-3 h-3" />
                  Ativo
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
