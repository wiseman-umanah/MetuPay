// GET /api/me on Vercel. Locally, Vite serves the same route (server/foid.js).
import { foidApi } from './_foid.js'

export default (req, res) => foidApi.me(req, res)
