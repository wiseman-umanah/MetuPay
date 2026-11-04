import { useEffect, useState } from 'react'
import { ContinueWithFoid, FoidProvider } from '@foid/react'
import Dashboard from './Dashboard.jsx'
import * as Icon from './icons.jsx'

const newNonce = () => crypto.randomUUID().replaceAll('-', '')
const go = (path) => window.history.replaceState(null, '', path)

export default function App() {
  const [name, setName] = useState(undefined) // undefined = checking, null = signed out
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [nonce, setNonce] = useState(newNonce)

  // Already signed in? (session cookie set by our Vite server)
  useEffect(() => {
    fetch('/api/me').then((r) => (r.ok ? r.json() : null)).then((me) => {
      setName(me?.name ?? null)
      go(me ? '/welcome' : '/')
    }).catch(() => setName(null))
  }, [])

  // The SDK opened the FOID popup, the person signed up / signed in and approved.
  // We get a one-time code; our server swaps it for who they are.
  async function onSuccess({ code, codeVerifier }) {
    setBusy(true)
    setError('')
    try {
      const r = await fetch('/api/foid/exchange', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, codeVerifier, nonce }),
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.message || 'Sign-in failed. Try again.')
      setName(data.name)
      go('/welcome')
    } catch (e) {
      setError(e.message)
    } finally {
      setBusy(false)
      setNonce(newNonce())
    }
  }

  function onError(e) {
    // Closing the popup or pressing Cancel isn't an error worth shouting about.
    if (e.code !== 'popup_closed' && e.code !== 'access_denied') setError(e.message)
  }

  async function signOut() {
    await fetch('/api/logout', { method: 'POST' })
    setName(null)
    go('/')
  }

  return (
    <main className="phone">
      {name === undefined ? null : name ? (
        <Dashboard name={name} onSignOut={signOut} />
      ) : (
        <section className="signin">
          <div className="blob blob-a" aria-hidden="true" />
          <div className="blob blob-b" aria-hidden="true" />

          <header className="brand">
            <span className="logo" aria-hidden="true">M</span>
            <span>MetuPay</span>
          </header>

          {/* Decorative cards */}
          <div className="art" aria-hidden="true">
            <div className="mini-card back" />
            <div className="mini-card front">
              <div className="mc-top"><span className="chip" /><span className="mc-brand">MetuPay</span></div>
              <div className="mc-num">5399 •••• •••• 2026</div>
              <div className="mc-bottom"><span>₦ NGN</span><span className="mc-dots"><i /><i /></span></div>
            </div>
            <div className="float-pill pill-a"><Icon.ArrowIn /> +₦45,000.00</div>
            <div className="float-pill pill-b"><Icon.Bolt /> Bills paid</div>
          </div>

          <div className="hero">
            <h1>Hello,<br />Welcome to <span className="accent">MetuPay</span></h1>
            <p>Send, receive and pay bills in seconds.</p>
          </div>

          <ul className="perks">
            <li><Icon.Send /> Free transfers</li>
            <li><Icon.Bolt /> Instant bills</li>
            <li><Icon.Piggy /> Smart savings</li>
          </ul>

          <div className="actions">
            <FoidProvider clientId={__FOID_CLIENT_ID__} foidUrl={__FOID_APP_URL__ || undefined}>
              <ContinueWithFoid text="signup_with" width="100%" scope="profile" nonce={nonce}
                disabled={busy || !__FOID_CLIENT_ID__} onSuccess={onSuccess} onError={onError} />
            </FoidProvider>
            {busy && <p className="note">Signing you in…</p>}
            {error && <p className="note error" role="alert">{error}</p>}
            {!__FOID_CLIENT_ID__ && <p className="note error">Add FOID_CLIENT_ID to .env and restart.</p>}
            <p className="fine"><Icon.Shield /> Verify once with FOID. No forms, no paperwork.</p>
          </div>
        </section>
      )}
    </main>
  )
}
