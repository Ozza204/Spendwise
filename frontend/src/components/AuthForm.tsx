import { useState, type FormEvent } from 'react'
import { signIn, signUp } from '../lib/auth'

type AuthFormProps = {
  mode: 'login' | 'signup'
  onModeChange: (mode: 'login' | 'signup') => void
}

export function AuthForm({ mode, onModeChange }: AuthFormProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setNotice(null)

    if (mode === 'signup' && !username.trim()) {
      setError('Enter a username.')
      return
    }
    if (mode === 'signup' && password !== confirmation) {
      setError('Passwords do not match.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        const signedIn = await signUp(username, email, password)
        if (!signedIn) {
          setNotice('Check your email for a confirmation link. After confirming, you can sign in.')
          setPassword('')
          setConfirmation('')
        }
      } else {
        await signIn(email, password)
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Authentication failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="brand">SpendWise</div>
        <h1>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">
          {mode === 'signup' ? 'Start with a secure account.' : 'Sign in to your account.'}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <label>
              Username
              <input
                autoComplete="username"
                required
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            </label>
          )}
          <label>
            Email address
            <input
              autoComplete="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {mode === 'signup' && (
            <label>
              Confirm password
              <input
                autoComplete="new-password"
                required
                type="password"
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
              />
            </label>
          )}
          {error && <p className="message error" role="alert">{error}</p>}
          {notice && <p className="message success" role="status">{notice}</p>}
          <button className="primary-button" disabled={busy} type="submit">
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'signup' ? 'Already have an account?' : 'New to SpendWise?'}{' '}
          <button
            className="text-button"
            type="button"
            onClick={() => onModeChange(mode === 'signup' ? 'login' : 'signup')}
          >
            {mode === 'signup' ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </main>
  )
}
