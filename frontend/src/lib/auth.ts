import type { User } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Profile = {
  user_id: string
  username: string
}

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Add the project URL and publishable key to frontend/.env.local.')
  }
  return supabase
}

export async function signUp(username: string, email: string, password: string) {
  const chosenUsername = username.trim()
  if (!chosenUsername) throw new Error('Enter a username.')
  const { data, error } = await requireClient().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { username: chosenUsername },
      emailRedirectTo: `${window.location.origin}/`,
    },
  })
  if (error) throw error
  return data.session !== null
}

export async function signIn(email: string, password: string) {
  const { error } = await requireClient().auth.signInWithPassword({
    email: email.trim(),
    password,
  })
  if (error) throw error
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut()
  if (error) throw error
}

export async function ensureProfile(user: User): Promise<Profile> {
  const client = requireClient()
  const findProfile = () =>
    client.from('Users').select('user_id, username').eq('user_id', user.id).maybeSingle()

  const { data: existing, error: readError } = await findProfile()
  if (readError) throw new Error(`Could not load your profile: ${readError.message}`)
  if (existing) return existing

  const username = typeof user.user_metadata?.username === 'string'
    ? user.user_metadata.username.trim()
    : ''
  if (!username) {
    throw new Error('Your account has no username. A profile cannot be created automatically.')
  }

  // user_id must be unique. DO NOTHING on a conflict preserves an existing username.
  const { error: insertError } = await client
    .from('Users')
    .upsert({ user_id: user.id, username }, { onConflict: 'user_id', ignoreDuplicates: true })
  if (insertError) throw new Error(`Could not create your profile: ${insertError.message}`)

  const { data: profile, error: verifyError } = await findProfile()
  if (verifyError || !profile) {
    throw new Error(`Could not verify your profile: ${verifyError?.message ?? 'no row was returned'}`)
  }
  return profile
}
