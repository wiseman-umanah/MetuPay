// MetuPay's server side — a Vite plugin, so `vite` (dev) and `vite preview` (production build)
// are the whole backend. No separate server to run.
//
//   POST /api/foid/exchange  { code, codeVerifier, nonce }  → swaps the one-time sign-in code for
//                            who signed in (@foid/node, with the client secret), starts a session
//   GET  /api/me             → { name } for the signed-in person, or 401
//   POST /api/logout         → ends the session
//
// The browser only ever holds the one-time code; the client secret stays here.
import { randomBytes } from 'node:crypto'
import { Foid, FoidError } from '@foid/node'

const COOKIE = 'metupay_session'
const SESSION_MS = 8 * 60 * 60 * 1000

export function foidServer(env) {
  const foid = new Foid({
    clientId: env.FOID_CLIENT_ID || undefined,
    clientSecret: env.FOID_CLIENT_SECRET || undefined,
    baseUrl: env.FOID_API_URL || undefined,
  })
  const sessions = new Map() // session id → { name, subjectId, expires }

  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
    res.end(JSON.stringify(body))
  }
  const sessionOf = (req) => {
    const id = /(?:^|;\s*)metupay_session=([\w-]+)/.exec(req.headers.cookie || '')?.[1]
    const s = id && sessions.get(id)
    if (s && s.expires > Date.now()) return { id, ...s }
    if (id) sessions.delete(id)
    return null
  }
  const readJson = (req) => new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk
      if (raw.length > 10_000) { reject(new Error('too_large')); req.destroy() }
    })
    req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch { reject(new Error('bad_json')) } })
    req.on('error', reject)
  })

  async function exchange(req, res) {
    if (!env.FOID_CLIENT_ID || !env.FOID_CLIENT_SECRET) {
      return send(res, 500, { error: 'not_configured', message: 'Set FOID_CLIENT_ID and FOID_CLIENT_SECRET in .env, then restart.' })
    }
    let body
    try { body = await readJson(req) } catch { return send(res, 400, { error: 'bad_request', message: 'Expected a JSON body.' }) }
    const { code, codeVerifier, nonce } = body
    if (typeof code !== 'string' || typeof codeVerifier !== 'string' || !code || !codeVerifier) {
      return send(res, 400, { error: 'bad_request', message: 'code and codeVerifier are required.' })
    }
    try {
      const result = await foid.oauth.exchange(code, codeVerifier)
      // The nonce we put in the sign-in request must come back unchanged: this result is for *this* sign-in.
      if (!nonce || result.nonce !== nonce) return send(res, 400, { error: 'nonce_mismatch', message: 'Sign-in could not be confirmed. Try again.' })
      const s = result.subject || {}
      const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || 'there'
      const id = randomBytes(24).toString('base64url')
      sessions.set(id, { name, subjectId: result.subject_id, expires: Date.now() + SESSION_MS })
      for (const [k, v] of sessions) if (v.expires <= Date.now()) sessions.delete(k)
      send(res, 200, { name }, { 'Set-Cookie': `${COOKIE}=${id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_MS / 1000}` })
    } catch (e) {
      if (e instanceof FoidError) return send(res, e.status >= 500 ? 502 : 400, { error: e.code, message: e.description || e.message })
      console.error('[metupay] FOID exchange failed:', e)
      send(res, 502, { error: 'foid_unreachable', message: `Couldn't reach FOID at ${env.FOID_API_URL || 'the FOID API'}.` })
    }
  }

  async function handle(req, res, next) {
    const path = (req.url || '').split('?')[0]
    if (!path.startsWith('/api/')) return next()
    if (req.method === 'POST' && path === '/api/foid/exchange') return exchange(req, res)
    if (req.method === 'GET' && path === '/api/me') {
      const s = sessionOf(req)
      return s ? send(res, 200, { name: s.name }) : send(res, 401, { error: 'signed_out' })
    }
    if (req.method === 'POST' && path === '/api/logout') {
      const s = sessionOf(req)
      if (s) sessions.delete(s.id)
      return send(res, 200, { ok: true }, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` })
    }
    send(res, 404, { error: 'not_found' })
  }

  return {
    name: 'metupay-foid-server',
    configureServer(server) { server.middlewares.use(handle) },
    configurePreviewServer(server) { server.middlewares.use(handle) },
  }
}
