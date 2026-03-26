---
applyTo: "*"
description: "Foundational instructions covering core DevOps principles, culture (CALMS), and key metrics (DORA) to guide GitHub Copilot in understanding and promoting effective software delivery."
---

# DevOps Core Principles

## The CALMS Framework

### 1. Culture

- Foster collaborative, blameless culture with shared responsibility and continuous learning
- Break down silos between dev, ops, security, and business teams
- Conduct blameless post-mortems focused on systemic issues, not blame
- Establish fast feedback loops between all stages of delivery

### 2. Automation

- Automate the entire delivery lifecycle: build, test, integrate, deploy, monitor
- Use Infrastructure as Code (Terraform, Ansible, Pulumi) for consistency and repeatability
- Integrate security scans (SAST, DAST, SCA) directly into CI/CD pipelines
- Automate configuration management, monitoring, and alerting

### 3. Lean

- Eliminate waste: unnecessary approvals, manual handoffs, excessive documentation
- Maximize flow with small batch sizes (smaller commits, PRs, frequent deployments)
- Build quality in throughout the process rather than relying on end-of-cycle testing
- Use value stream mapping to identify bottlenecks

### 4. Measurement

- Track DORA metrics: deployment frequency, lead time, change failure rate, MTTR
- Collect comprehensive metrics, logs, and traces; centralize for analysis
- Create actionable dashboards; configure alerts for critical issues
- Use data to validate changes and drive improvement

### 5. Sharing

- Share common tools, platforms, and practices across teams
- Maintain clear, up-to-date documentation (runbooks, ADRs, architecture docs)
- Encourage cross-functional collaboration, pair programming, and knowledge sharing
- Include explanatory comments in code for complex logic

## DORA Metrics

### 1. Deployment Frequency

- **Definition**: How often the org successfully releases to production
- **Goal**: Multiple times per day (elite performers)
- Deploy small, incremental changes; use feature flags to decouple deployment from release
- Design CI/CD pipelines for frequent, safe, automated deployments

### 2. Lead Time for Changes

- **Definition**: Time from commit to production
- **Goal**: Less than one hour (elite performers)
- Reduce bottlenecks: smaller PRs, automated testing, faster builds, efficient reviews
- Use CI caching and parallelization to optimize build/test phases

### 3. Change Failure Rate

- **Definition**: Percentage of deployments causing service degradation
- **Goal**: 0\u201315% (elite performers)
- Invest in robust testing (unit, integration, E2E), automated rollbacks, and monitoring
- Implement pre-deployment health checks and post-deployment validation

### 4. Mean Time to Recovery (MTTR)

- **Definition**: Time to restore service after an incident
- **Goal**: Less than one hour (elite performers)
- Build with observability: structured logging, metrics exposition, distributed tracing
- Maintain automated rollback procedures and documented runbooks
