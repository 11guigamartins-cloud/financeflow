import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User as AuthUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  household_id: string
  display_name: string
  color: string
  avatar: string
}

interface AuthContextValue {
  session: Session | null
  authUser: AuthUser | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, displayName: string, color: string, avatar: string, householdId?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  reloadProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile(userId: string) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data ?? null)
  }

  useEffect(() => {
    supabase.auth.getSession()
      .then(async ({ data }) => {
        setSession(data.session)
        if (data.session?.user) {
          try { await loadProfile(data.session.user.id) }
          catch (e) { console.error('loadProfile failed:', e) }
        }
      })
      .catch((e) => console.error('getSession failed:', e))
      .finally(() => setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      if (newSession?.user) {
        try { await loadProfile(newSession.user.id) }
        catch (e) { console.error('loadProfile failed:', e) }
      } else {
        setProfile(null)
      }
    })

    return () => sub.subscription.unsubscribe()
  }, [])

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message }
  }

  async function signUp(email: string, password: string, displayName: string, color: string, avatar: string, householdId?: string) {
    const { error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: {
          display_name: displayName, color, avatar,
          ...(householdId ? { household_id: householdId } : {}),
        },
      },
    })
    return { error: error?.message }
  }

  async function signOut() {
    await supabase.auth.signOut()
    setProfile(null)
  }

  async function reloadProfile() {
    if (session?.user) await loadProfile(session.user.id)
  }

  return (
    <AuthContext.Provider value={{
      session, authUser: session?.user ?? null, profile, loading,
      signIn, signUp, signOut, reloadProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
