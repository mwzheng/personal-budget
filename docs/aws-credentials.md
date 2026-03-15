# AWS credentials and region — where to set them

This document explains where to provide AWS credentials (access key, secret key) and AWS region for server-side use in this project. Do NOT commit secrets into version control.

## Environment variables (names)

- `AWS_ACCESS_KEY_ID` — the IAM access key id
- `AWS_SECRET_ACCESS_KEY` — the IAM secret access key
- `AWS_SESSION_TOKEN` — optional, for temporary credentials
- `AWS_REGION` — the AWS region (for example, `us-east-1`)

These environment variables are read by the AWS SDK's default credential/provider chain and by the example code snippets below.

## Local development

Options:

1. Use the AWS CLI (recommended for local dev):

   ```bash
   aws configure
   ```

   This stores credentials in `~/.aws/credentials` and the SDK will pick them up automatically.

2. Use a local `.env.local` (server-only) file in the project root (do NOT commit):

   ```env
   AWS_ACCESS_KEY_ID=YOUR_KEY_ID
   AWS_SECRET_ACCESS_KEY=YOUR_SECRET
   AWS_REGION=us-east-1
   # AWS_SESSION_TOKEN=...  # optional
   ```

   Then run your dev server as usual (the project uses Next.js so env vars will be available to server-side code).

## Vercel (recommended for production)

Set the same environment variables in the Vercel dashboard or via the Vercel CLI. Important: do NOT prefix them with `NEXT_PUBLIC_` — that would expose them to the browser. These values should be kept server-side.

- UI: Project → Settings → Environment Variables → Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION` for Production/Preview/Development as appropriate.

- CLI (example):

  ```bash
  # add to production environment
  vercel env add AWS_ACCESS_KEY_ID production
  vercel env add AWS_SECRET_ACCESS_KEY production
  vercel env add AWS_REGION production
  ```

You can also use `vercel env pull .env.local` to pull environment variables into your local `.env.local` file for development.

## Using the values in server-side code

Example (AWS SDK v3 — server only):

```ts
import { S3Client } from "@aws-sdk/client-s3";

// The SDK will use the environment variables automatically (preferred):
const s3 = new S3Client({ region: process.env.AWS_REGION });

// Or pass credentials explicitly (not recommended unless you need to override):
// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
//   },
// });
```

Notes:

- The AWS SDK v3 uses a standard provider chain: environment variables, `~/.aws/credentials`, EC2/ECS/Function roles, and so on. If you set the env variables they will be used.
- Never expose your keys in frontend code; do not use `NEXT_PUBLIC_` prefix for secret keys.

## CI / Deployments

- For serverless or CI environments, prefer provider-based identity (e.g., IAM roles or OIDC) over long-lived personal keys. If using long-lived keys, store them as encrypted environment variables in your CI provider.

## Security best practices

- Use least-privilege IAM policies (restrict S3/DynamoDB access to only what the app needs);
- Rotate keys regularly;
- Use temporary credentials where possible (STS, OIDC with your platform).
