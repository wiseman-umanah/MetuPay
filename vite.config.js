import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { foidServer } from './server/foid.js'

export default defineConfig(({ mode }) => {
  // '' = load every variable from .env, not only VITE_* ones. They stay on the server unless listed below.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  return {
    plugins: [react(), foidServer(env)],
    // The only values the browser gets: both are public (the client ID is visible in the sign-in URL anyway).
    define: {
      __FOID_CLIENT_ID__: JSON.stringify(env.FOID_CLIENT_ID || ''),
      // Blank = the SDK's default (the hosted FOID app). Set it only when running FOID yourself.
      __FOID_APP_URL__: JSON.stringify(env.FOID_APP_URL || null),
    },
    server: { port: 5400 },
    preview: { port: 5400 },
  }
})
