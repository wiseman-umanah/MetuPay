// Shared by the Vercel functions in this folder (files starting with _ aren't routes).
import { createFoidApi } from '../server/foid.js'

export const foidApi = createFoidApi(process.env)
