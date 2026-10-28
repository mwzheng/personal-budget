# Authentication

The app uses the Cognito hosted sign-in flow through `/auth/login`, `/auth/callback`, and `/auth/signout`. Create Account starts Cognito's hosted signup screen from the login page.

## Local Configuration

Set the variables from `env.example` in `.env.local`:

- `NEXT_PUBLIC_COGNITO_DOMAIN` is the full hosted UI domain, such as `https://<your-domain>.auth.us-east-1.amazoncognito.com`.
- `NEXT_PUBLIC_COGNITO_CLIENT_ID` matches a public Cognito app client with no client secret.
- Set both `NEXT_PUBLIC_COGNITO_USER_POOL_ID` and the server-side `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`.
- Allow `http://localhost:3000/auth/callback` as a callback URL and `http://localhost:3000/auth/login` as a sign-out URL. Use the actual origin if running on another port.

The SAM template provisions the pool and public app client. It does not configure a hosted UI domain or OAuth callback/sign-out settings. Configure those in Cognito before using hosted sign-in. See [SAM deployment](../../infra/SAM-DEPLOY.md) for stack outputs.

## Hosted Sign-In Flow

1. Sign In starts the authorization-code flow with PKCE and an OAuth state value. Pending state and the PKCE verifier live in session storage.
2. Cognito redirects to `/auth/callback` with an authorization code. The callback checks state and exchanges the code for tokens.
3. `lib/auth/cognitoClient.ts` stores access, ID, and refresh tokens in local storage so sessions survive browser restarts. It migrates older session-storage tokens and uses session storage as a fallback when persistent storage is unavailable.
4. `lib/api/apiFetch.ts` attaches the access token to API requests and retries once after a silent refresh on a 401 or 403 response.
5. Sign-out clears stored authentication and uses Cognito's logout endpoint for hosted sessions.

## Browser Demo

Choose Continue with Demo on `/auth/login` to explore without AWS credentials. The session flag lives in session storage. Seeded reports, budgets, salary entries, retirement history, goals, and milestones live in local storage. `apiFetch` handles those demo requests in the browser, so edits do not reach DynamoDB. Sign-out clears the demo store, and starting another demo resets it.

FIRE calculations can be explored, but the browser demo does not implement saved FIRE scenario API requests. A browser demo session also does not authenticate direct requests made with curl or another HTTP client.

The development flags `DISABLE_AUTH=true` and `NEXT_PUBLIC_DISABLE_AUTH=true` are separate from Continue with Demo. The server flag resolves supported routes to the local demo user; the public flag skips client login redirects. Keep these flags disabled for normal authenticated use.
