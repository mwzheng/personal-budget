# SAM deploy (DynamoDB + Cognito)

This document explains how to deploy the CloudFormation/SAM template that provisions the DynamoDB table and Cognito User Pool for Personal Budget.

Prerequisites
- AWS CLI v2 configured (credentials in ~/.aws/credentials or env vars)
- AWS SAM CLI installed (https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)

Local deploy (developer machine)

1. From the repository root, make the script executable (only once):

   chmod +x infra/deploy-sam.sh

2. Deploy to dev (example):

   infra/deploy-sam.sh personal-budget-resources personal-budget-infra dev us-east-1

   The script will create a per-account S3 artifact bucket if you do not pass one as the last parameter. To specify an existing bucket, pass it as the 5th argument.

CI / OIDC
- For CI, prefer using GitHub Actions OIDC to assume a role (see infra/oidc-role.yml) and run `sam deploy` with a pre-provisioned S3 bucket for artifacts.

Notes
- The SAM template is at infra/template.yaml and exposes outputs: TransactionsTableName, UserPoolId, UserPoolClientId.
- If you previously used the Serverless Framework (`infra/serverless.yml`), this SAM template intentionally keeps the same resource names (ServiceName/Stage) so in-place updates are possible when using the same stack name and parameters. Take care when deploying to production: backup data and enable PITR if needed.

Troubleshooting
- If sam deploy fails with permission errors, ensure the principal has CloudFormation, S3, DynamoDB, and Cognito permissions (or use the OIDC role example in infra/oidc-role.yml).
- For first-time deploy guidance: `sam deploy --guided` will walk through creating an S3 bucket and configuration; the script automates that for common cases.
