#!/usr/bin/env bash
set -euo pipefail

STACK_NAME=${1:-personal-budget-resources}
SERVICE=${2:-personal-budget-infra}
STAGE=${3:-dev}
REGION=${4:-us-east-1}
S3_BUCKET=${5:-""}

echo "Stack: $STACK_NAME"
echo "Service: $SERVICE"
echo "Stage: $STAGE"
echo "Region: $REGION"

# Prerequisites
if ! command -v aws >/dev/null 2>&1; then
  echo "AWS CLI not found. Install AWS CLI v2 and configure credentials."
  exit 2
fi

if ! command -v sam >/dev/null 2>&1; then
  echo "AWS SAM CLI ('sam') not found. Install it from https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
  exit 2
fi

# Validate AWS credentials
if ! aws sts get-caller-identity --output text >/dev/null 2>&1; then
  echo "AWS credentials not configured. Run: aws configure or set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY"
  exit 2
fi

ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)

# If no S3 bucket specified, construct one and create if necessary
if [ -z "$S3_BUCKET" ]; then
  S3_BUCKET="${SERVICE}-${STAGE}-sam-artifacts-${ACCOUNT_ID}-${REGION}"
  echo "No S3 bucket specified — using: $S3_BUCKET"
  if aws s3api head-bucket --bucket "$S3_BUCKET" 2>/dev/null; then
    echo "S3 bucket $S3_BUCKET already exists"
  else
    echo "Creating S3 bucket $S3_BUCKET"
    if [ "$REGION" = "us-east-1" ]; then
      aws s3api create-bucket --bucket "$S3_BUCKET"
    else
      aws s3api create-bucket --bucket "$S3_BUCKET" --create-bucket-configuration LocationConstraint="$REGION"
    fi
    echo "Bucket created: $S3_BUCKET"
  fi
fi

# Deploy with SAM
sam deploy \
  --template-file infra/template.yaml \
  --stack-name "$STACK_NAME" \
  --region "$REGION" \
  --s3-bucket "$S3_BUCKET" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides ServiceName="$SERVICE" Stage="$STAGE" \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset

# Show stack outputs
echo "sam deploy finished. Stack outputs:"
aws cloudformation describe-stacks --stack-name "$STACK_NAME" --query 'Stacks[0].Outputs' --output table --region "$REGION"

# Reminder to set executable bit if needed
echo "Tip: make infra/deploy-sam.sh executable with: chmod +x infra/deploy-sam.sh"