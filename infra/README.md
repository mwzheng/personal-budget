# Infrastructure (infra/)

This folder now uses AWS SAM for provisioning DynamoDB and Cognito resources.

Files of interest:
- infra/template.yaml — SAM template provisioning DynamoDB and Cognito
- infra/deploy-sam.sh — Non-interactive deploy script (creates artifact bucket if needed)
- infra/SAM-DEPLOY.md — Deployment instructions and CI notes
- infra/oidc-role.yml — Example IAM role for GitHub Actions OIDC (kept for CI guidance)

Legacy Serverless and CloudFormation deployment artifacts were removed to avoid duplication and confusion. Use infra/SAM-DEPLOY.md for all deploy guidance.
