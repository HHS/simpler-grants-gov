# AWS Multi-Account Migration Plan
**Project:** simpler-grants-gov  
**Issue:** [#689 — Create Plan for Separating Accounts in AWS](https://github.com/HHS/simpler-grants-gov/issues/689)  
**Author:** Sean Thomas / Nava PBC  
**Date:** April 2026

---

## Overview

Today, all environments (dev, staging, training, grantee1, prod) live in a **single AWS account** (the "beta" account). This plan migrates to a 5-account structure aligned with FedRAMP requirements, security best practices, and the nava-platform-template account model.

### Target Account Structure

| Account | Purpose | Migration Type |
|---|---|---|
| **Security** | GuardDuty aggregation, CloudTrail org logs, SecurityHub, Config | New account |
| **Dev** | dev environment + team sandbox workloads | Migrate from current account |
| **Training** | Isolated training/UAT environment | Migrate from current account |
| **Stage** | Staging environment, mirrors prod | Migrate from current account |
| **Prod** | Production (keep in existing beta account, rename) | Rename/retag only |

> **grantee1 environment:** Not included in the 5-account structure. Recommend migrating grantee1 into the Dev account (or deprecating if the pilot has concluded) before this migration begins.

---

## AWS Control Tower — Should We Use It?

This is the first decision to make. It materially changes scope, timeline, and long-term architecture.

### What Control Tower Is

AWS Control Tower is AWS's managed service for setting up and governing a multi-account environment. When enabled, it:

- Automatically configures AWS Organizations with opinionated OU structure
- Creates a **Log Archive account** (org-level CloudTrail + Config logs → S3)
- Creates an **Audit account** (Security Hub, GuardDuty aggregation, Config aggregator) — this is essentially our "security account"
- Applies pre-built **guardrails** (preventive SCPs + detective Config rules) that are FedRAMP-aligned and maintained by AWS
- Sets up **AWS IAM Identity Center** (SSO) for centralized human access across all accounts
- Provides **Account Factory** for consistently vending new accounts via a self-service portal or Terraform

### Account Structure With vs. Without Control Tower

| Approach | Accounts | Notes |
|---|---|---|
| **Without CT** | 5 accounts | Security, Dev, Training, Stage, Prod — manually configured |
| **With CT** | 7 accounts | CT creates Log Archive + Audit automatically; our "Security" account merges into the Audit account, or we keep it as a 7th |

### Recommendation: Use Control Tower

For a FedRAMP system, Control Tower is the right long-term answer:

- The Audit account it creates covers everything we'd manually build in a security account (GuardDuty, SecurityHub, Config, CloudTrail org trail)
- Its guardrails are continuously updated by AWS as FedRAMP standards evolve — we don't maintain SCPs by hand
- IAM Identity Center is required for FedRAMP anyway (no shared root credentials, centralized human access auditing)
- Account Factory makes future account vending consistent and auditable
- AWS explicitly supports enrolling existing accounts into Control Tower — so the existing prod/beta account can be enrolled without rebuilding it

**The tradeoff:** Control Tower adds 2 weeks to Phase 0 and creates 2 additional managed accounts (Log Archive + Audit). Those accounts are largely automated and low-maintenance.

**If the team decides against Control Tower now:** The manual Organizations + SCP approach in this plan is still sound. But plan to migrate to Control Tower for FedRAMP authorization — it's harder to retrofit later than to start with it.

---

## Current State Summary

- **IaC:** Terraform v1.14+ with S3 backend + DynamoDB state locking
- **Auth:** GitHub Actions OIDC (no static credentials) — one IAM role per account
- **Applications:** `api`, `frontend`, `analytics`, `nofos` — each with per-environment configs in `infra/{app}/app-config/{env}.tf`
- **Region:** `us-east-1` exclusively
- **Networking:** Per-environment VPC with public/private/database subnets across 3 AZs
- **ECR:** Container images built and stored; pulled at deploy time

---

## Guiding Principles

1. **Prod is never the migration guinea pig.** Prod stays where it is; we just rename the account. All migration work is validated in lower environments first.
2. **Each account is bootstrapped identically.** Use the existing `infra/accounts/` Terraform module to provision each new account consistently.
3. **No downtime for running environments.** All migrations are blue/green or additive — stand up in the new account, verify, then decommission in the old account.
4. **Region lockdown happens early.** Unused regions are disabled at the AWS Organization level via SCP (or Control Tower guardrail) before any application workloads are created.
5. **ECR stays centralized (for now).** Images continue to be built and stored in the prod (existing) account. Cross-account ECR pull permissions are granted to each new account. A future ticket can move ECR to a dedicated build/artifacts account.

---

## Phase 0 — Prerequisites & AWS Organizations Setup
**Duration: 2 weeks (without Control Tower) / 4 weeks (with Control Tower) | Risk: Low**

This phase has no application impact. It establishes the organizational foundation everything else depends on.

### 0.1 AWS Organizations

Enable AWS Organizations on the existing prod/beta account (or a new management account). Key decisions:
- Designate the **management (root) account** — this should NOT be the prod account in the long run, but using the existing account as management is acceptable short-term for speed
- Create an **Organizational Unit (OU) structure**:

Without Control Tower:
```
Root
├── Security OU
├── Workloads OU
│   ├── Production OU
│   └── Non-Production OU
└── (future: Sandbox OU)
```

With Control Tower (CT creates this automatically):
```
Root
├── Security OU
│   ├── Audit account (CT-managed)
│   └── Log Archive account (CT-managed)
├── Workloads OU
│   ├── Production OU  →  Prod account (enroll existing)
│   └── Non-Production OU  →  Dev, Training, Stage accounts
└── Sandbox OU (optional future use)
```

### 0.2 Disable Unused Regions

**Without Control Tower:** Apply a Service Control Policy (SCP) at the root OU level that denies all actions outside approved regions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "DenyNonApprovedRegions",
      "Effect": "Deny",
      "NotAction": [
        "iam:*", "organizations:*", "route53:*",
        "budgets:*", "waf:*", "cloudfront:*",
        "sts:*", "support:*", "trustedadvisor:*",
        "health:*", "account:*"
      ],
      "Resource": "*",
      "Condition": {
        "StringNotEquals": {
          "aws:RequestedRegion": ["us-east-1"]
        }
      }
    }
  ]
}
```

**With Control Tower:** Enable the built-in **"Disallow actions as a root user"** and **"Deny access to AWS based on the requested AWS Region"** guardrails from the CT console. This is a checkbox, not manual SCP authoring.

> If a DR region (e.g., `us-west-2`) is ever needed, add it to the allow-list.

### 0.3 If Using Control Tower: Additional Setup Steps

1. Enable Control Tower in the management account (this takes ~60 minutes and is non-reversible without significant effort)
2. Control Tower automatically creates Log Archive + Audit accounts and configures CloudTrail, Config, and SecurityHub across the org
3. Enable IAM Identity Center (SSO) and configure identity source (IdP or AWS managed)
4. Enroll the existing prod/beta account into Control Tower via Account Factory → "Enroll account"
   - Warning: CT will apply its CloudTrail and Config baseline to the existing account — verify this doesn't conflict with any existing CloudTrail trails or Config recorders before enrolling
5. Create new accounts (dev, training, stage) via Account Factory for consistent provisioning

### 0.4 Code Changes: Phase 0

**File:** `infra/project-config/main.tf` — add org ID, OU IDs, and account ID variables  
**New:** `infra/accounts/management/main.tf` — Terraform for org-level SCPs (if not using CT guardrails)

### 0.5 Checklist Before Phase 0 Complete
- [ ] AWS Organizations enabled with OU structure defined
- [ ] Region-deny SCP or CT guardrail applied and tested
- [ ] Billing alerts configured per account (Cost Anomaly Detection)
- [ ] IAM Identity Center configured (if using CT)
- [ ] grantee1 environment disposition decided (migrate to dev or decommission)

---

## Phase 1 — Security Account
**Duration: 2 weeks (without CT) / Absorbed into Phase 0 (with CT) | Risk: Low | Depends on: Phase 0**

**With Control Tower:** Skip this phase. CT's Audit account already provides GuardDuty org admin, SecurityHub aggregation, AWS Config aggregation, and the org-level CloudTrail. The "security account" in the 5-account design maps to the CT Audit account.

**Without Control Tower:** Build the security account from scratch.

### What Gets Built (Without CT)
- GuardDuty (org-level delegated admin → aggregates findings from all accounts)
- AWS Security Hub (org-level aggregation)
- AWS Config (org-level aggregator)
- CloudTrail organization trail (logs to a central S3 bucket here)
- No VPC, no applications, no databases

### Terraform Changes (Without CT)

**New files:**
```
infra/accounts/security/
  main.tf          # Bootstrap: S3 backend, OIDC role for GitHub Actions
  guardduty.tf     # GuardDuty delegated admin
  securityhub.tf   # SecurityHub aggregator
  config.tf        # AWS Config aggregator
  cloudtrail.tf    # Org-level CloudTrail
```

**Existing file refactor:**
- `infra/accounts/main.tf` — refactor to a reusable module; each account directory calls it

### CI/CD Changes
New workflow to manage the security account's Terraform:
```yaml
# .github/workflows/cd-security-account.yml
```

---

## Phase 2 — Rename/Retag the Prod Account
**Duration: 1 week | Risk: Very Low | Runs in parallel with Phase 1**

The existing "beta" account becomes the official **prod** account. No infrastructure moves.

### Changes Required

**AWS Console / CLI:**
```bash
aws iam update-account-alias --account-alias simpler-grants-prod
```
Update account tags in Organizations.

**Code changes:**
- `infra/project-config/main.tf` — update account alias references
- `README.md` / runbooks — update references from "beta account" to "prod account"
- GitHub Actions secrets — rename secrets referencing "beta" to "prod" (add new, keep old until all phases done)
- `.github/workflows/cd-api.yml`, `cd-frontend.yml`, etc. — update comments only; no functional changes since environment names stay the same

---

## Phase 3 — Dev Account
**Duration: 4 weeks | Risk: Medium | Depends on: Phases 0, 1**

Dev is the first full application migration. It validates the entire account bootstrap + migration playbook before touching higher environments.

### What Moves
- `dev` environment (ECS services, Aurora, OpenSearch, ALB, VPC, Secrets Manager, etc.)
- `grantee1` environment (if being kept — moves here rather than being decommissioned)

### Step-by-Step

**Week 1 — Bootstrap the Dev Account**
1. Create the AWS account via Organizations / Account Factory
2. Apply `infra/accounts/dev/main.tf`:
   - S3 backend bucket + DynamoDB lock table
   - GitHub Actions OIDC role
   - Confirm region restrictions are active (SCP/CT guardrail covers this)
3. Apply `infra/networks/` for the dev VPC (CIDR: `10.x.0.0/20`, non-conflicting second octet)
4. Grant the dev account ECR pull access to the prod account's ECR registry (cross-account ECR resource policy)

**Week 2 — Migrate Dev Application Infrastructure**
1. Apply `infra/api/database/` for dev in the new account
2. Apply `infra/api/service/` for dev — new ECS cluster, ALB, services
3. Run database migrations
4. Smoke-test the new environment
5. Do NOT yet cut DNS over

**Weeks 2–3 — Update GitHub Actions**

The workflows need to know which AWS account to target per environment. Current approach uses a single OIDC role. New approach maps environment names to account IDs.

**File: `.github/workflows/cd-api.yml`** (and frontend, analytics, nofos)

Current pattern (simplified):
```yaml
- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ vars.AWS_ACCOUNT_ID }}:role/simpler-grants-github-actions
    aws-region: us-east-1
```

New pattern — map environment to account:
```yaml
- name: Set AWS account for environment
  id: account
  run: |
    case "${{ inputs.environment }}" in
      dev)       echo "account_id=${{ vars.AWS_ACCOUNT_ID_DEV }}" >> $GITHUB_OUTPUT ;;
      staging)   echo "account_id=${{ vars.AWS_ACCOUNT_ID_STAGE }}" >> $GITHUB_OUTPUT ;;
      training)  echo "account_id=${{ vars.AWS_ACCOUNT_ID_TRAINING }}" >> $GITHUB_OUTPUT ;;
      prod)      echo "account_id=${{ vars.AWS_ACCOUNT_ID_PROD }}" >> $GITHUB_OUTPUT ;;
    esac

- uses: aws-actions/configure-aws-credentials@v4
  with:
    role-to-assume: arn:aws:iam::${{ steps.account.outputs.account_id }}:role/simpler-grants-github-actions
    aws-region: us-east-1
```

**GitHub repository variables to add:**
- `AWS_ACCOUNT_ID_DEV`
- `AWS_ACCOUNT_ID_STAGE`
- `AWS_ACCOUNT_ID_TRAINING`
- `AWS_ACCOUNT_ID_PROD`

**Week 3 — Terraform Backend Config per Account**

Each account gets its own `.tfbackend` file. Current pattern has a single `backend.conf`. New pattern:

```
infra/api/service/dev.s3.tfbackend
infra/api/service/staging.s3.tfbackend
infra/api/service/training.s3.tfbackend
infra/api/service/prod.s3.tfbackend
```

Each file points to the S3 bucket in that account:
```hcl
# dev.s3.tfbackend
bucket         = "simpler-grants-{dev-account-id}-us-east-1-tf"
key            = "api/service/dev/terraform.tfstate"
region         = "us-east-1"
dynamodb_table = "simpler-grants-{dev-account-id}-us-east-1-tf"
encrypt        = true
```

Update `Makefile` to pass the correct backend config based on environment:
```makefile
infra-update-app-service:
  terraform -chdir=infra/$(APP)/service init \
    -backend-config=$(ENVIRONMENT).s3.tfbackend \
    -reconfigure
  terraform -chdir=infra/$(APP)/service apply ...
```

**Week 4 — DNS Cutover & Decommission**
1. Set TTL to 60 seconds on `api.dev.simpler.grants.gov` 24 hours before cutover
2. Update DNS to point to new ALB in dev account
3. Monitor for 48 hours
4. Decommission dev resources in prod account (`terraform destroy` for dev workspaces)

### Files Changed Summary (Dev Phase)

| File | Change Type |
|---|---|
| `infra/accounts/dev/main.tf` | New — account bootstrap |
| `infra/networks/dev.tf` or separate workspace | New — VPC for dev account |
| `infra/{app}/service/dev.s3.tfbackend` | New — per-account backend config (4 apps × 1 file) |
| `.github/workflows/cd-api.yml` | Update — account-to-env mapping |
| `.github/workflows/cd-frontend.yml` | Update — account-to-env mapping |
| `.github/workflows/cd-analytics.yml` | Update — account-to-env mapping |
| `.github/workflows/cd-metabase.yml` | Update — account-to-env mapping |
| `.github/workflows/deploy.yml` | Update — account-to-env mapping |
| `.github/workflows/check-ci-cd-auth.yml` | Update — test auth against each account |
| `Makefile` | Update — pass backend config file per env |
| `infra/project-config/main.tf` | Update — add account ID mappings |

---

## Phase 4 — Training Account
**Duration: 3 weeks | Risk: Medium | Can start after Phase 3 Week 3**

Training is lower risk than staging — it has no external integrations whose failure would block users. It also validates the migration playbook a second time before touching staging.

### What Moves
- `training` environment

### Steps
Follow the same playbook as Phase 3, replacing `dev` with `training`. By this point the GitHub Actions account-mapping is already in place from Phase 3, so that work is largely done.

1. Bootstrap training account (S3 backend, OIDC, VPC) — 1 week
2. Apply training application infrastructure + run smoke tests — 1 week
3. DNS cutover, 48-hour monitoring window, decommission from prod account — 1 week

### New Files
- `infra/accounts/training/main.tf`
- `infra/{app}/service/training.s3.tfbackend`

---

## Phase 5 — Stage Account
**Duration: 4 weeks | Risk: Medium-High | Depends on: Phases 3, 4**

Staging mirrors production. It's used for pre-release validation and the prod deploy pipeline depends on it. Extra care is needed.

### What Moves
- `staging` environment

### Special Considerations
- Staging databases may need a data refresh from prod after the move — plan a data sync window
- The CI/CD pipeline gate (staging green → allow prod deploy) must remain intact through cutover
- Validate all feature flags, Secrets Manager values, and environment variables are correctly migrated before DNS cutover
- Run a full smoke test + regression pass before cutting DNS

### Steps
1. Bootstrap stage account — 1 week
2. Apply staging application infrastructure + migrate/sync data — 1 week
3. Run full regression and verify prod deploy gate still works — 1 week
4. DNS cutover, 48-hour monitoring, decommission from prod account — 1 week

### New Files
- `infra/accounts/stage/main.tf`
- `infra/{app}/service/staging.s3.tfbackend`

---

## Phase 6 — Cleanup & Hardening
**Duration: 2 weeks | Risk: Low | Depends on: All phases**

- Remove all migrated environment Terraform state and resources from the prod account (only `prod` workloads remain)
- Enable AWS Cost Anomaly Detection per account
- Audit and tighten IAM permissions per account (least privilege)
- Update all documentation, runbooks, and onboarding guides
- Add `account_id` assertions to CI to prevent accidental cross-environment deploys
- Verify GuardDuty, SecurityHub, and Config findings are aggregating correctly to the security/audit account
- Tag audit: ensure all resources across all accounts have consistent tags (`Environment`, `Project`, `ManagedBy=Terraform`)

---

## Overall Timeline

### Without Control Tower (~17 weeks)

```
Weeks 1–2    Phase 0   AWS Organizations + SCP + Region Disable
Weeks 2–4    Phase 1   Security Account
Weeks 2–3    Phase 2   Rename Prod Account (parallel with Phase 1)
Weeks 4–8    Phase 3   Dev Account Migration
Weeks 7–10   Phase 4   Training Account (starts after Phase 3 Week 3)
Weeks 10–14  Phase 5   Stage Account Migration
Weeks 14–16  Phase 6   Cleanup & Hardening
                        ~17 weeks total (~4.5 months)
```

### With Control Tower (~19 weeks)

```
Weeks 1–4    Phase 0   AWS Organizations + Control Tower + IAM Identity Center
Weeks 3–4    Phase 2   Rename Prod Account (parallel; enroll in CT)
             Phase 1   Security account absorbed into CT Audit account — no separate phase needed
Weeks 5–9    Phase 3   Dev Account Migration
Weeks 8–11   Phase 4   Training Account (starts after Phase 3 Week 3)
Weeks 11–15  Phase 5   Stage Account Migration
Weeks 15–17  Phase 6   Cleanup & Hardening
                        ~19 weeks total (~5 months)
                        (2 extra weeks upfront, but saves ~2 weeks of manual security account work)
```

### Engineering Effort Estimate

| Phase | Without CT | With CT |
|---|---|---|
| Phase 0 | 2 eng-weeks | 4 eng-weeks |
| Phase 1 (Security) | 2 eng-weeks | 0 (absorbed by CT) |
| Phase 2 (Rename) | 0.5 eng-weeks | 0.5 eng-weeks |
| Phase 3 (Dev) | 4 eng-weeks | 4 eng-weeks |
| Phase 4 (Training) | 3 eng-weeks | 3 eng-weeks |
| Phase 5 (Stage) | 4 eng-weeks | 4 eng-weeks |
| Phase 6 (Cleanup) | 2 eng-weeks | 2 eng-weeks |
| **Total** | **~17–18 eng-weeks** | **~17–18 eng-weeks** |

Total effort is similar either way — CT shifts work from Phase 1 into Phase 0. The difference is quality: CT provides a governed, auditable foundation; manual gives more flexibility.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Prod disruption during rename | Low | High | Rename is non-functional; no infrastructure changes |
| GitHub Actions OIDC misconfiguration | Medium | High | Test auth (`check-ci-cd-auth.yml`) against each account before migrating workloads |
| Terraform state corruption on migration | Low | High | Take state backups before each migration; never manually edit state — use `terraform state mv` |
| ECR cross-account pull failures | Medium | Medium | Test ECR pull from each new account before any ECS deploy |
| DNS cutover causes downtime | Low | High | Lower TTL to 60s 24h before cutover; keep old ALB alive during 48-hour monitoring window |
| Secrets not migrated | Medium | Medium | Audit Secrets Manager and Parameter Store in prod account before any decommission |
| SCP too restrictive (breaks IAM/global services) | Low | Medium | Use `NotAction` pattern (see Phase 0 SCP) to exempt global services |
| Control Tower enrollment breaks existing prod resources | Medium | High | Test enrollment in a non-prod account first; review CT's CloudTrail/Config impact before enrolling prod |

---

## Decisions Needed Before Starting

1. **Control Tower: yes or no?** Use CT for a governed FedRAMP-aligned landing zone (recommended), or use manual Organizations + SCPs for speed. This decision changes Phase 0 scope from 2 weeks to 4 weeks.

2. **Management account:** Use the existing prod/beta account as the org management account, or create a dedicated management account? A dedicated management account is more correct for FedRAMP (management account should have no workloads) but adds scope.

3. **grantee1 environment:** Decommission or migrate to the dev account?

4. **ECR strategy:** Keep ECR in prod account with cross-account pull (short-term fine), or move to a dedicated shared services/build account?

5. **DR region:** Will `us-west-2` ever be needed for disaster recovery? If yes, update the region allow-list in Phase 0.

6. **Terraform workspace strategy:** Confirm whether the current codebase uses Terraform workspaces or directory-per-environment before writing per-account backend configs — the backend key structure must not collide.

---

## Appendix: Key Files Reference

| File/Directory | Purpose |
|---|---|
| `infra/accounts/` | Account-level bootstrap (S3 backend, OIDC) |
| `infra/project-config/main.tf` | Central project config, region, org info |
| `infra/networks/` | VPC / subnet configuration per environment |
| `infra/{app}/app-config/{env}.tf` | Per-app, per-environment resource sizing and feature flags |
| `infra/{app}/service/` | ECS service, ALB, CloudFront |
| `infra/{app}/database/` | Aurora, OpenSearch |
| `.github/workflows/cd-{app}.yml` | Per-app deployment workflows |
| `.github/workflows/deploy.yml` | Reusable deployment orchestration |
| `.github/workflows/check-ci-cd-auth.yml` | Validates OIDC auth per account |
| `Makefile` | Make targets for infra setup and deploy |
