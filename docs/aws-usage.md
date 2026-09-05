# AWS usage and safety controls

The application uses DynamoDB `Query` operations for collection reads. Transaction and report routes require a date range, return an opaque cursor, and never use `Scan`. CSV imports use `BatchWriteItem` in groups of at most 25 with bounded retries; a row appears in `importedCount` only after DynamoDB acknowledges it. Re-imports preserve parser-provided stable IDs but are not server-side deduplicated when the source omits an ID.

`DYNAMODB_USERS_TABLE` is required for profile storage. It intentionally has no fallback to `DYNAMODB_TABLE`.

The public contact endpoint limits requests per process and forwarded client address, rejects bodies larger than 8 KiB, accepts a honeypot field, and supports idempotency keys. These are best-effort protections on stateless hosting, not a replacement for hosting/WAF rate limits. Configure an edge rate rule before relying on the endpoint for higher traffic.

Monitor DynamoDB command counts, BatchWrite retries, SES send volume, and request latency in the hosting and AWS dashboards. Do not log authorization tokens, contact messages, or transaction details.
