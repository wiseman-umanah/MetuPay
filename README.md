# MetuPay

A tiny example app that signs people up with **Continue with FOID**: one phone-sized screen, one
*Sign up with FOID* button, then *Welcome &lt;name&gt;*.

It's a Vite app with no separate backend. Vite's own server does the server-side part
(`server/foid.js`, a Vite plugin), in both `pnpm dev` and `pnpm start` (`vite preview`).

```
click "Sign up with FOID"        @foid/react opens the FOID popup (PKCE made in the browser)
  → person signs up / signs in,
    verifies NIN etc., approves  all inside FOID's popup
  → browser gets a one-time code
  → POST /api/foid/exchange      Vite server: @foid/node swaps the code (with the client secret)
                                 for the person's name, sets an HttpOnly session cookie
  → /welcome                     "Welcome Ada Obi"
```

The client secret only ever lives on the server. The browser gets the client ID (public) and a one-time code.

## Run it

MetuPay uses hosted FOID by default (the SDKs point at https://foid-iy7u.onrender.com and
https://usefoid.pages.dev), so you only need a client ID and secret.

1. In the [FOID business console](https://admin-foid.pages.dev), go to **Apps → Create a test app**. Name it
   `MetuPay` and leave **Allowed origins** and **Redirect URIs** empty: test apps accept `http://localhost` on any port.
   Keep the scopes at `profile` (the name). Copy the client ID and the client secret (the secret is shown once).
2. Set up and start MetuPay:

   ```bash
   cp .env.example .env      # paste FOID_CLIENT_ID and FOID_CLIENT_SECRET
   pnpm install
   pnpm dev                  # http://localhost:5400
   ```

To use FOID running on your own machine instead, set `FOID_API_URL=http://localhost:8000` and
`FOID_APP_URL=http://localhost:5173` in `.env`.

To run the production build: `pnpm build && pnpm start`. The same `/api` routes are served by `vite preview`.

## Files

| File | What it does |
|---|---|
| `src/App.jsx` | The whole UI: the welcome screen with `<ContinueWithFoid text="signup_with" />`, then *Welcome &lt;name&gt;* |
| `server/foid.js` | The server side, as a Vite plugin: `/api/foid/exchange`, `/api/me`, `/api/logout` |
| `vite.config.js` | Loads `.env`, plugs in the server, passes only the client ID and popup URL to the browser |
| `vendor/` | The FOID SDKs (`@foid/react`, `@foid/node`) packed from the FOID repo. Swap them for the npm versions once those are published |

To refresh the SDKs after changing them in the FOID repo:

```bash
(cd ../FOID/sdks/react && npm pack --pack-destination ../../../MetuPay/vendor)
(cd ../FOID/sdks/node  && npm pack --pack-destination ../../../MetuPay/vendor)
rm -rf node_modules/@foid && pnpm install --force
```

Sessions are kept in memory, so they reset when the server restarts. That's fine for a demo; a real app
would use its own session store.
