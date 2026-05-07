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

  async function loadProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    setProfile(data ?? null)
    return data ?? null
  }

  useEffect(() => {
    let cancelled = false
    let loadingDone = false

    function finishLoading() {
      if (!loadingDone && !cancelled) {
        loadingDone = true
        clearTimeout(safety)
        setLoading(false)
      }
    }

    // Safety net — if something unexpected hangs, never block the UI forever
    const safety = setTimeout(() => {
      console.warn('[Auth] safety timeout — forcing loading=false')
      finishLoading()
    }, 8000)

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return

      setSession(newSession)

      let profileResult: Profile | null = null
      if (newSession?.user) {
        try {
          profileResult = await loadProfile(newSession.user.id)
        } catch (e) {
          console.error('[Auth] loadProfile failed:', e)
        }
      } else {
        setProfile(null)
      }

      if (cancelled) return

      // INITIAL_SESSION fires with whatever token is cached in localStorage.
      // If the access token is expired, auth.uid() is null in Postgres → RLS
      // blocks the profile query → profileResult is null even though the user
      // is valid. In that case, Supabase will fire TOKEN_REFRESHED shortly after.
      // Keep loading=true so the spinner stays up rather than flashing a broken UI.
      // For every other event (TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT…) we know
      // the token is fresh, so we can finish loading regardless of the outcome.
      if (event === 'INITIAL_SESSION') {
        if (!newSession || profileResult !== null) {
          finishLoading()
        }
        // else: session exists but profile null → stale JWT, wait for TOKEN_REFRESHED
      } else {
        finishLoading()
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
    // Race against a 3 s timeout so a bad network never hangs the redirect
    try {
      await Promise.race([
        supabase.auth.signOut(),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error('signOut timeout')), 3000)
        ),
      ])
    } catch (e) {
      console.error('signOut failed/timed-out:', e)
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
