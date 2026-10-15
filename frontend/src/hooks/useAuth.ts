import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ensureProfile, type Profile } from '../lib/auth'
import { supabase } from '../lib/supabase'

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null)
  const [initializing, setInitializing] = useState(true)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    if (!supabase) {
      setInitializing(false)
      return
    }

    // Supabase sends INITIAL_SESSION after restoring a saved browser session.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setInitializing(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const user = session?.user
    if (!user) {
      setProfile(null)
      setProfileError(null)
      setProfileLoading(false)
      return
    }

    let active = true
    setProfile(null)
    setProfileError(null)
    setProfileLoading(true)
    ensureProfile(user)
      .then((result) => {
        if (active) setProfile(result)
      })
      .catch((error: unknown) => {
        if (active) setProfileError(error instanceof Error ? error.message : 'Could not load your profile.')
      })
      .finally(() => {
        if (active) setProfileLoading(false)
      })
    return () => { active = false }
  }, [session?.user.id, retryCount])

  return {
    session,
    initializing,
    profile,
    profileLoading,
    profileError,
    retryProfile: () => setRetryCount((count) => count + 1),
  }
}
