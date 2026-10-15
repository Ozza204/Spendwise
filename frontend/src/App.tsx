import { useEffect, useState } from 'react'
import { AuthForm } from './components/AuthForm'
import { useAuth } from './hooks/useAuth'
import { signOut } from './lib/auth'
import { supabase } from './lib/supabase'
import './App.css'

function App() {
  const [path, setPath] = useState(window.location.pathname)
  const [logoutError, setLogoutError] = useState<string | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)
  const { session, initializing, profile, profileLoading, profileError, retryProfile } = useAuth()

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  function navigate(nextPath: string, replace = false) {
    window.history[replace ? 'replaceState' : 'pushState'](null, '', nextPath)
    setPath(nextPath)
  }

  useEffect(() => {
    if (initializing || !supabase) return
    if (!session && path !== '/login' && path !== '/signup') navigate('/login', true)
    if (session && path !== '/') navigate('/', true)
  }, [initializing, session, path])

  async function handleLogout() {
    setLoggingOut(true)
    setLogoutError(null)
    try {
      await signOut()
      navigate('/login', true)
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : 'Could not sign out.')
    } finally {
      setLoggingOut(false)
    }
  }

  if (!supabase) {
    return <main className="status-page" role="alert">Supabase is not configured. Add your project URL and publishable key to frontend/.env.local, then restart Vite.</main>
  }
  if (initializing) return <main className="status-page">Loading your session…</main>

  if (!session) {
    const mode = path === '/signup' ? 'signup' : 'login'
    return (
      <AuthForm
        key={mode}
        mode={mode}
        onModeChange={(nextMode) => navigate(nextMode === 'signup' ? '/signup' : '/login')}
      />
    )
  }

  return (
    <main className="app-page">
      <header className="app-header">
        <div className="brand">SpendWise</div>
        <button className="secondary-button" disabled={loggingOut} onClick={handleLogout} type="button">
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </button>
      </header>
      <section className="welcome-card">
        {profileLoading ? <p>Loading your profile…</p> : profile ? (
          <>
            <h1>Welcome, {profile.username}</h1>
            <p className="muted">Your account is ready.</p>
          </>
        ) : (
          <>
            <h1>Profile unavailable</h1>
            <p className="message error" role="alert">{profileError ?? 'Could not load your profile.'}</p>
            <button className="secondary-button" onClick={retryProfile} type="button">Try again</button>
          </>
        )}
        {logoutError && <p className="message error" role="alert">{logoutError}</p>}
      </section>
    </main>
  )
}

export default App
