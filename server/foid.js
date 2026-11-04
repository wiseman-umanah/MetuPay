// MetuPay's server side. The same code runs in two places:
//   - locally: as a Vite plugin, so `vite` (dev) and `vite preview` are the whole backend
//   - on Vercel: as serverless functions in api/ (Vercel doesn't run Vite's server)
//
//   POST /api/foid/exchange  { code, codeVerifier, nonce }  → swaps the one-time sign-in code for
//                            who signed in (@foid/node, with the client secret), starts a session
//   GET  /api/me             → { name } for the signed-in person, or 401
//   POST /api/logout         → ends the session
//
// The session is a signed cookie (HMAC-SHA256), not server memory, so it works on serverless too.
// The browser only ever holds the one-time code; the client secret stays on the server.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto'
import { Foid, FoidError } from '@foid/node'

const COOKIE = 'metupay_session'
const SESSION_SECONDS = 8 * 60 * 60

export function createFoidApi(env = process.env) {
  const foid = new Foid({
    clientId: env.FOID_CLIENT_ID || undefined,
    clientSecret: env.FOID_CLIENT_SECRET || undefined,
    baseUrl: env.FOID_API_URL || undefined,
  })
  // SESSION_SECRET if set; otherwise derived from the client secret, so there's nothing extra to configure.
  const key = createHash('sha256').update(env.SESSION_SECRET || `metupay-session:${env.FOID_CLIENT_SECRET || ''}`).digest()

  const sign = (data) => createHmac('sha256', key).update(data).digest('base64url')
  const send = (res, status, body, headers = {}) => {
    res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...headers })
    res.end(JSON.stringify(body))
  }
  const cookie = (req, value, maxAge) => {
    const https = req.headers['x-forwarded-proto'] === 'https' || req.socket?.encrypted
    return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${https ? '; Secure' : ''}`
  }
  const sessionOf = (req) => {
    const raw = new RegExp(`(?:^|;\\s*)${COOKIE}=([\\w-]+\\.[\\w-]+)`).exec(req.headers.cookie || '')?.[1]
    if (!raw) return null
    const [data, sig] = raw.split('.')
    const want = Buffer.from(sign(data)), got = Buffer.from(sig)
    if (want.length !== got.length || !timingSafeEqual(want, got)) return null
    try {
      const s = JSON.parse(Buffer.from(data, 'base64url').toString('utf8'))
      return s.exp > Date.now() / 1000 ? s : null
    } catch { return null }
  }
  // Vercel has usually parsed the JSON body already (req.body); Vite hands us the raw stream.
  const readJson = (req) => {
    if (req.body !== undefined) {
      return Promise.resolve(typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {})
    }
    return new Promise((resolve, reject) => {
      let raw = ''
      req.on('data', (chunk) => {
        raw += chunk
        if (raw.length > 10_000) { reject(new Error('too_large')); req.destroy() }
      })
      req.on('end', () => { try { resolve(JSON.parse(raw || '{}')) } catch (e) { reject(e) } })
      req.on('error', reject)
    })
  }

  async function exchange(req, res) {
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' })
    if (!env.FOID_CLIENT_ID || !env.FOID_CLIENT_SECRET) {
      return send(res, 500, { error: 'not_configured', message: 'Set FOID_CLIENT_ID and FOID_CLIENT_SECRET, then restart / redeploy.' })
    }
    let body
    try { body = await readJson(req) } catch { return send(res, 400, { error: 'bad_request', message: 'Expected a JSON body.' }) }
    const { code, codeVerifier, nonce } = body || {}
    if (typeof code !== 'string' || typeof codeVerifier !== 'string' || !code || !codeVerifier) {
      return send(res, 400, { error: 'bad_request', message: 'code and codeVerifier are required.' })
    }
    try {
      const result = await foid.oauth.exchange(code, codeVerifier)
      // The nonce we put in the sign-in request must come back unchanged: this result is for *this* sign-in.
      if (!nonce || result.nonce !== nonce) return send(res, 400, { error: 'nonce_mismatch', message: 'Sign-in could not be confirmed. Try again.' })
      const s = result.subject || {}
      const name = [s.first_name, s.last_name].filter(Boolean).join(' ') || 'there'
      const data = Buffer.from(JSON.stringify({ name, sub: result.subject_id, exp: Math.floor(Date.now() / 1000) + SESSION_SECONDS })).toString('base64url')
      send(res, 200, { name }, { 'Set-Cookie': cookie(req, `${data}.${sign(data)}`, SESSION_SECONDS) })
    } catch (e) {
      if (e instanceof FoidError) return send(res, e.status >= 500 ? 502 : 400, { error: e.code, message: e.description || e.message })
      console.error('[metupay] FOID exchange failed:', e)
      send(res, 502, { error: 'foid_unreachable', message: "Couldn't reach FOID. Try again in a moment." })
    }
  }

  function me(req, res) {
    if (req.method !== 'GET') return send(res, 405, { error: 'method_not_allowed' }, { Allow: 'GET' })
    const s = sessionOf(req)
    s ? send(res, 200, { name: s.name }) : send(res, 401, { error: 'signed_out' })
  }

  function logout(req, res) {
    if (req.method !== 'POST') return send(res, 405, { error: 'method_not_allowed' }, { Allow: 'POST' })
    send(res, 200, { ok: true }, { 'Set-Cookie': cookie(req, '', 0) })
  }

  const routes = { '/api/foid/exchange': exchange, '/api/me': me, '/api/logout': logout }
  return {
    exchange, me, logout,
    /** Connect-style middleware for Vite. */
    middleware(req, res, next) {
      const path = (req.url || '').split('?')[0]
      if (!path.startsWith('/api/')) return next()
      const route = routes[path]
      return route ? route(req, res) : send(res, 404, { error: 'not_found' })
    },
  }
}

/** Vite plugin: serves /api/* from `vite` and `vite preview`. */
export function foidServer(env) {
  const api = createFoidApi(env)
  return {
    name: 'metupay-foid-server',
    configureServer(server) { server.middlewares.use(api.middleware) },
    configurePreviewServer(server) { server.middlewares.use(api.middleware) },
  }
}
