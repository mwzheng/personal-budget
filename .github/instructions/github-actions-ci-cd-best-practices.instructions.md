---
applyTo: ".github/workflows/*.yml,.github/workflows/*.yaml"
description: "Comprehensive guide for building robust, secure, and efficient CI/CD pipelines using GitHub Actions. Covers workflow structure, jobs, steps, environment variables, secret management, caching, matrix strategies, testing, and deployment strategies."
---

# GitHub Actions CI/CD Best Practices

## Core Concepts and Structure

### 1. Workflow Structure

- Use descriptive names for workflow files (e.g., `build-and-test.yml`, `deploy-prod.yml`)
- Choose appropriate triggers: `push`, `pull_request`, `workflow_dispatch`, `schedule`, `repository_dispatch`, `workflow_call`
- Use `concurrency` to prevent simultaneous runs for shared resources
- Set explicit `permissions` (least privilege); default to `contents: read`
- Use reusable workflows (`workflow_call`) to reduce duplication across projects

### 2. Jobs

- Each job should represent a distinct pipeline phase (build, test, lint, deploy)
- Use `needs` to define inter-job dependencies
- Use `outputs` to pass data between jobs
- Use `if` conditions for conditional execution (branch, event type, prior job status)
- Set `timeout-minutes` for long-running jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    outputs:
      artifact_path: ${{ steps.package_app.outputs.path }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci && npm run build
      - name: Package application
        id: package_app
        run: |
          zip -r dist.zip dist
          echo "path=dist.zip" >> "$GITHUB_OUTPUT"
      - uses: actions/upload-artifact@v3
        with:
          name: my-app-build
          path: dist.zip

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main'
    environment: staging
    steps:
      - uses: actions/download-artifact@v3
        with:
          name: my-app-build
      - run: echo "Deploying ${{ needs.build.outputs.artifact_path }} to staging..."
```

### 3. Steps and Actions

- Pin actions to a commit SHA or major version tag (`@v4`); never use `main` or `latest`
- Give every step a descriptive `name` for log readability
- Combine shell commands with `&&` or multi-line `|` for efficiency
- Never hardcode sensitive data in `env`; use `secrets` context
- Audit marketplace actions before use; prefer `actions/` org; use Dependabot for updates

## Security Best Practices

### 1. Secret Management

- Store all sensitive data in GitHub Secrets (encrypted at rest)
- Use environment-specific secrets with approval rules for deployment environments
- Access via `secrets.<SECRET_NAME>`; never print or construct secrets dynamically

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://prod.example.com
    steps:
      - name: Deploy to production
        env:
          PROD_API_KEY: ${{ secrets.PROD_API_KEY }}
        run: ./deploy-script.sh
```

### 2. OIDC for Cloud Authentication

- Use OIDC for credential-less authentication with AWS, Azure, GCP (short-lived tokens)
- Configure trust policies in cloud provider to trust GitHub's OIDC issuer
- Prefer over storing long-lived access keys as secrets

### 3. Least Privilege for `GITHUB_TOKEN`

- Default to `contents: read`; add write permissions only where necessary
- Define `permissions` at workflow or job level

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write

jobs:
  lint:
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v4
      - run: npm run lint
```

### 4. Dependency Review and SAST

- Integrate SCA tools (`dependency-review-action`, Snyk, Trivy) to scan for vulnerable dependencies
- Integrate SAST tools (CodeQL, SonarQube) to scan source code; block PRs on critical findings
- Enable GitHub secret scanning; use pre-commit hooks (`git-secrets`) for local leak prevention

### 5. Immutable Infrastructure

- Ensure reproducible builds in Dockerfiles
- Sign container images (Notary, Cosign); enforce that only signed images deploy to production

## Optimization and Performance

### 1. Caching

- Cache dependencies and build outputs with `actions/cache@v3`
- Use `hashFiles` in cache keys (e.g., `hashFiles('**/package-lock.json')`)
- Use `restore-keys` for fallback to older compatible caches

```yaml
- name: Cache Node.js modules
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ./node_modules
    key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}-${{ github.run_id }}
    restore-keys: |
      ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}-
      ${{ runner.os }}-node-
```

### 2. Matrix Strategies

- Use `strategy.matrix` for parallel testing across OS, language versions, browsers
- Use `include`/`exclude` to fine-tune combinations
- Set `fail-fast: false` for comprehensive reporting; `true` for quick feedback

```yaml
jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest]
        node-version: [16.x, 18.x, 20.x]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm test
```

### 3. Fast Checkout

- Use `fetch-depth: 1` (shallow clone) by default; only use `0` when full history is needed
- Skip submodules (`submodules: false`) and LFS (`lfs: false`) unless required

### 4. Artifacts

- Use `actions/upload-artifact` / `actions/download-artifact` to pass data between jobs
- Set `retention-days` to manage storage costs
- Upload test reports, coverage, and security scan results as artifacts

### 5. Self-Hosted Runners

- Use when GitHub-hosted runners don't meet hardware, cost, or network access needs
- Secure and maintain runner infrastructure; use runner groups for organization

## Testing in CI/CD

### 1. Unit Tests

- Run on every push/PR; parallelize for fast feedback
- Enforce code coverage thresholds (Istanbul, Coverage.py, JaCoCo)
- Publish test results as artifacts or GitHub Checks annotations

### 2. Integration Tests

- Use `services` to provision temporary databases, message queues, caches via Docker
- Run after unit tests; manage test data setup and cleanup
- Optimize execution time; consider running less frequently than unit tests

### 3. End-to-End Tests

- Use Cypress, Playwright, or Selenium against a staging environment
- Mitigate flakiness: explicit waits, robust selectors (`data-testid`), retries
- Capture screenshots and video recordings on failure

### 4. Performance and Load Tests

- Use k6, Gatling, Locust, or JMeter; run nightly/weekly or on major merges
- Define thresholds (response time, throughput, error rate); fail builds if exceeded
- Compare against established baselines

### 5. Test Reporting

- Publish results as GitHub Checks/Annotations for inline PR feedback
- Upload detailed reports (JUnit XML, HTML, coverage) as artifacts
- Add workflow status badges to README

## Deployment Strategies

### Environments

- **Staging**: Mirror production; use environment protection rules with approval; auto-deploy on develop/release branch merges; run smoke tests post-deploy
- **Production**: Require manual approvals and strict branch protection; monitor during and after deployment; have an expedited hotfix pipeline

### Deployment Types

- **Rolling**: Gradually replace instances; configure `maxSurge`/`maxUnavailable`
- **Blue/Green**: Deploy new version alongside old; switch traffic atomically; instant rollback
- **Canary**: Roll out to small user subset (5-10%); monitor before full rollout
- **Feature Flags**: Deploy code but toggle features via flag management (LaunchDarkly, Unleash)

### Rollback

- Implement automated rollbacks triggered by monitoring alerts or failed health checks
- Keep previous build artifacts and images readily available
- Maintain runbooks for manual rollback procedures
- Conduct blameless post-incident reviews

## Workflow Review Checklist

- [ ] Descriptive workflow name; appropriate triggers with path/branch filters
- [ ] `concurrency` set for critical workflows
- [ ] `permissions` set to least privilege (`contents: read` default)
- [ ] Actions pinned to SHA or major version tag
- [ ] Secrets accessed only via `secrets` context; OIDC used for cloud auth
- [ ] SCA and SAST tools integrated; secret scanning enabled
- [ ] Caching configured with `hashFiles`-based keys
- [ ] `fetch-depth: 1` used unless full history needed
- [ ] Matrix strategy used for parallel testing where applicable
- [ ] Test reports and coverage uploaded as artifacts
- [ ] Environment protection rules with approvals for staging/production
- [ ] Rollback strategy documented and tested
- [ ] `timeout-minutes` set for long-running jobs

## Troubleshooting

### Workflow Not Triggering

- Verify `on` triggers match the event; check `branches`/`paths` filters
- Review all `if` conditions; use `always()` debug step to print `${{ toJson(github) }}`
- Check if `concurrency` is blocking; verify branch protection rules

### Permission Errors

- Review `permissions` block at workflow and job levels
- Verify secrets are configured in correct scope (repo/org/environment)
- For OIDC: double-check cloud provider trust policy configuration

### Cache Issues

- Validate cache keys use `hashFiles` correctly and change only when dependencies change
- Verify `path` matches where dependencies are installed
- Use `actions/cache/restore` with `lookup-only: true` to debug misses

### Long Running Workflows

- Profile execution times in workflow run summary
- Combine `run` commands; install only necessary dependencies
- Leverage caching and matrix parallelization
- Consider larger runners or breaking into smaller workflows

### Flaky Tests

- Ensure test isolation; clean up state between runs
- Use explicit waits instead of `sleep`; use stable selectors (`data-testid`)
- Standardize CI environment to match local development
- Capture screenshots/video on failure for diagnosis

### Deployment Failures

- Review deployment and application logs immediately
- Validate env vars, ConfigMaps, and secrets match target environment
- Run post-deployment health checks; trigger rollback if they fail
- Verify network connectivity between deployed components
