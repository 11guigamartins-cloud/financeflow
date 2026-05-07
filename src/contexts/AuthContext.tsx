import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User as AuthUser } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface Profile {
  id: string
  household_id: string
  display_name: string
  color: string
  avatar: string
  approved: boolean
  isAdmin: boolean
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

  async function loadProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (!data) { setProfile(null); return null }
    const p: Profile = {
      id: data.id,
      household_id: data.household_id,
      display_name: data.display_name,
      color: data.color,
      avatar: data.avatar,
      approved: data.approved ?? false,
      isAdmin: data.is_admin ?? false,
    }
    setProfile(p)
    return p
  }

  useEffect(() => {
    let cancelled = false

    const safety = setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 8000)

    // getSession() always returns a fresh, valid token (auto-refreshes if expired).
    // This is the single source of truth for the initial load — no concurrent
    // loadProfile calls from onAuthStateChange(INITIAL_SESSION).
    supabase.auth.getSession()
      .then(async ({ data }) => {
        if (cancelled) return
        setSession(data.session)
        if (data.session?.user) {
          try { await loadProfile(data.session.user.id) }
          catch (e) { console.error('[Auth] loadProfile:', e) }
        }
      })
      .catch((e) => console.error('[Auth] getSession:', e))
      .finally(() => {
        clearTimeout(safety)
        if (!cancelled) setLoading(false)
      })

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return

      // INITIAL_SESSION: already handled by getSession() above — skip to avoid
      // a concurrent loadProfile with a potentially stale cached token.
      // TOKEN_REFRESHED: background token renewal; profile hasn't changed, just
      // update the session reference so future requests use the new JWT.
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
        setSession(newSession)
        return
      }

      // SIGNED_IN (fresh login), SIGNED_OUT, USER_UPDATED
      setSession(newSession)
      if (newSession?.user) {
        try { await loadProfile(newSession.user.id) }
        catch (e) { console.error('[Auth] loadProfile:', e) }
      } else {
        setProfile(null)
      }
    })

    return () => {
      cancelled = true
      clearTimeout(safety)
      sub.subscription.unsubscribe()
    }
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
    // Race against 3 s so a bad network never hangs the redirect
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('signOut timeout')), 3000)
        ),
      ])
    } catch (e) {
      console.error('[Auth] signOut:', e)
    }
    setProfile(null)
    setSession(null)
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.includes('supabase')) localStorage.removeItem(k)
      })
    } catch {}
    window.location.href = '/login'
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
