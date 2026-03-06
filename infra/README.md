# Infrastructure: Cognito + DynamoDB (Serverless template)

This folder contains a Serverless Framework template that provisions a Cognito User Pool (with a client) and a DynamoDB table for storing per-user transactions.

Quickstart (Serverless Framework):

1. Install Serverless CLI (or use npx):

   npm install -g serverless
   # or use:
   npx serverless

2. Configure AWS credentials locally, or configure OIDC in CI for deployments.

3. Deploy (example):

   npx serverless deploy --stage dev

Notes
- The DynamoDB table uses a composite key: pk (partition key) and sk (sort key). Use format pk = "user#<userId>" and sk = "date#<transactionId>" for efficient per-user queries.
- This template is a starter: add Lambda function definitions under the "functions:" section and attach appropriate IAM roles to grant access to the table and Cognito.
- For GitHub Actions deployment, prefer OIDC auth to avoid committing long-lived AWS credentials. See Serverless docs for OIDC configuration.

