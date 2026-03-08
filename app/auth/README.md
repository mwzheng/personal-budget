Authentication pages and setup for AWS Cognito

This folder contains the pages and helpers used for the Cognito hosted sign-in flow (login, register, callback, signout), and the client-side token exchange.

Local development notes:

- Set environment variables in `.env.local` (see `env.example`).
- `NEXT_PUBLIC_COGNITO_DOMAIN` should be the full Hosted UI URL, e.g. `https://<your-domain>.auth.us-east-1.amazoncognito.com`.
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` must match the App Client configured in Cognito (public client, `GenerateSecret: false`).
- Add `http://localhost:3000/auth/callback` to the Cognito App Client callback URLs for local development.
- Add `http://localhost:3000/auth/login` as an allowed sign-out URL for local development.

How the flow works (high level):

1. The login page redirects the user to the Cognito Hosted UI with `response_type=code`.
2. After authentication, Cognito redirects back to `/auth/callback` with an authorization code.
3. The callback page exchanges the code for `access_token`, `id_token`, and `refresh_token` and stores them client-side (sessionStorage) for API calls.
4. `lib/apiFetch.ts` attaches the `access_token` to API requests and performs a single silent refresh using `refresh_token` when a 401/403 is received.

See the project `README.md` for a summary of APIs and `infra/SAM-DEPLOY.md` for backend deploy instructions and `.env.local` values.
