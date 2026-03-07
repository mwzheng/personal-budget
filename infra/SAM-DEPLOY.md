# SAM Deploy — DynamoDB + Cognito

This document covers everything needed to provision (or redeploy) the AWS infrastructure for Personal Budget: a DynamoDB transactions table and a Cognito User Pool.

## What gets deployed

| Resource           | CloudFormation logical ID | Default name (dev)                       |
| ------------------ | ------------------------- | ---------------------------------------- |
| DynamoDB table     | `TransactionsTable`       | `personal-budget-infra-dev-transactions` |
| Cognito User Pool  | `CognitoUserPool`         | `personal-budget-infra-dev-userpool`     |
| Cognito App Client | `CognitoUserPoolClient`   | `personal-budget-infra-dev-client`       |

Stack outputs (`UserPoolId`, `UserPoolClientId`, `TransactionsTableName`) are printed after every deploy and can be viewed at any time with:

```bash
aws cloudformation describe-stacks \
  --stack-name personal-budget-resources \
  --query 'Stacks[0].Outputs' \
  --output table \
  --region us-east-1
```

---

## Prerequisites

### 1. Install AWS CLI v2

```bash
# Linux (x86_64) — no sudo required, installs to ~/.local
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
unzip -q /tmp/awscliv2.zip -d /tmp/awscli
/tmp/awscli/aws/install --install-dir ~/.local/aws-cli --bin-dir ~/.local/bin
export PATH="$HOME/.local/bin:$PATH"   # add to ~/.bashrc or ~/.zshrc to persist
aws --version  # aws-cli/2.x.x ...
```

For macOS or other platforms see: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html

### 2. Install AWS SAM CLI

```bash
# Linux (x86_64) — no sudo required, installs to ~/.local
curl -L "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" \
  -o /tmp/sam-cli.zip
unzip -q /tmp/sam-cli.zip -d /tmp/sam-cli
/tmp/sam-cli/install --install-dir ~/.local/sam-cli --bin-dir ~/.local/bin
sam --version  # SAM CLI, version 1.x.x
```

For macOS (`brew install aws-sam-cli`) or other platforms see:
https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html

### 3. Configure AWS credentials

```bash
aws configure
# prompts for: AWS Access Key ID, Secret Access Key, region (us-east-1), output format (json)
```

Or set environment variables directly:

```bash
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export AWS_DEFAULT_REGION=us-east-1
```

Verify credentials are working:

```bash
aws sts get-caller-identity
```

---

## Deploy

### Via npm/pnpm script (recommended)

From the repository root:

```bash
# Deploy / redeploy the dev stack
pnpm deploy:infra

# Deploy / redeploy the prod stack
pnpm deploy:infra:prod
```

These scripts call `infra/deploy-sam.sh` with the correct parameters (see `package.json`).

### Via the deploy script directly

```bash
# Usage: infra/deploy-sam.sh <stack-name> <service-name> <stage> <region> [s3-bucket]
chmod +x infra/deploy-sam.sh

# dev
infra/deploy-sam.sh personal-budget-resources personal-budget-infra dev us-east-1

# prod
infra/deploy-sam.sh personal-budget-resources personal-budget-infra prod us-east-1
```

The script will:

1. Validate that `aws` and `sam` CLIs are installed.
2. Validate that AWS credentials are active.
3. Auto-create an S3 artifact bucket named `<service>-<stage>-sam-artifacts-<account-id>-<region>` if it does not exist.
4. Run `sam deploy` and print the stack outputs on success.

To use an existing S3 bucket, pass it as the 5th argument:

```bash
infra/deploy-sam.sh personal-budget-resources personal-budget-infra dev us-east-1 my-existing-bucket
```

### First-time interactive deploy (guided mode)

If you prefer an interactive walkthrough that writes a `samconfig.toml`:

```bash
sam deploy --guided --template-file infra/template.yaml
```

---

## After deploy — configure the Next.js app

Copy the stack outputs into `.env.local` at the repository root:

```bash
# .env.local
NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
DYNAMODB_TABLE_NAME=personal-budget-infra-dev-transactions
AWS_REGION=us-east-1
```

---

## CI / GitHub Actions (OIDC)

For CI, use GitHub Actions OIDC to assume a role instead of storing long-lived keys as secrets.
See `infra/oidc-role.yml` for the example IAM role definition.

The deploy step in your workflow would look like:

```yaml
- name: Configure AWS credentials (OIDC)
  uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::<account-id>:role/personal-budget-github-actions
    aws-region: us-east-1

- name: Deploy infrastructure
  run: bash infra/deploy-sam.sh personal-budget-resources personal-budget-infra prod us-east-1 ${{ vars.SAM_ARTIFACT_BUCKET }}
```

---

## Troubleshooting

| Symptom                                       | Fix                                                                                                                                                    |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `aws: command not found`                      | Add `~/.local/bin` to `$PATH` or re-install.                                                                                                           |
| `sam: command not found`                      | Add `~/.local/bin` to `$PATH` or re-install.                                                                                                           |
| `Unable to locate credentials`                | Run `aws configure` or export `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.                                                                           |
| `403 / Access Denied` on deploy               | Ensure your IAM user/role has permissions for CloudFormation, S3, DynamoDB, and Cognito (or attach the policy from `infra/oidc-role.yml`).             |
| Stack stuck in `ROLLBACK_IN_PROGRESS`         | Delete the stack in the AWS Console or via `aws cloudformation delete-stack --stack-name personal-budget-resources --region us-east-1`, then redeploy. |
| Want to inspect the changeset before applying | Remove `--no-confirm-changeset` from `deploy-sam.sh` and run manually.                                                                                 |
