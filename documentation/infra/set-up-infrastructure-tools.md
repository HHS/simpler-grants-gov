# Set up infrastructure developer tools

If you are contributing to infrastructure, you will need to complete these setup steps.

## Prerequisites

### Install Terraform

[Terraform](https://www.terraform.io/) is an infrastructure as code (IaC) tool that allows you to build, change, and version infrastructure safely and efficiently. This includes both low-level components like compute instances, storage, and networking, as well as high-level components like DNS entries and SaaS features.

You may need different versions of Terraform since different projects may require different versions of Terraform. The best way to manage Terraform versions is with [Terraform Version Manager](https://github.com/tfutils/tfenv).

To install via [Homebrew](https://brew.sh/)

```bash
brew install tfenv
```

Then install the version of Terraform you need.

```bash
tfenv install 1.4.6
```

If you are unfamiliar with Terraform, check out this [basic introduction to Terraform](./intro-to-terraform.md).

### Install AWS CLI

The [AWS Command Line Interface (AWS CLI)](https://aws.amazon.com/cli/) is a unified tool to manage your AWS services. With just one tool to download and configure, you can control multiple AWS services from the command line and automate them through scripts. Install the AWS commmand line tool by following the instructions found here:

- [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

### Install Go

The [Go programming language](https://go.dev/dl/) is required to run [Terratest](https://terratest.gruntwork.io/), the unit test framework for Terraform.

### Install GitHub CLI

The [GitHub CLI](https://cli.github.com/) is useful for automating certain operations for GitHub such as with GitHub actions. This is needed to run [check-github-actions-auth.sh](../../bin/check-github-actions-auth)

```bash
brew install gh
```

### Install linters

We have several optional utilities for running infrastructure linters locally. These are run as part of the CI pipeline, therefore, it is often simpler to test them locally first.
- [Shellcheck](https://github.com/koalaman/shellcheck)
- [actionlint](https://github.com/rhysd/actionlint)
- [lychee](https://github.com/lycheeverse/lychee)

```bash
brew install shellcheck
brew install actionlint
brew install lychee
```

## AWS Authentication

This project uses AWS IAM Identity Center (SSO) for local access. Each environment lives in a
specific AWS account, so you need one named profile per account, and the correct profile must be
active before you run any AWS CLI, Terraform, or `bin/` command.

### Which account is my environment in?

| Environment | Account name | Profile |
| --- | --- | --- |
| `infra-dev`, `infra-grantee1`, `infra-grantee2`, `infra-sgg1` | `dev` | `dev` |
| `infra-staging` | `staging` | `staging` |
| `infra-training` | `training` | `training` |
| `prod`, `shared`, `grantee1`, `grantee2`, `grantor1` | `simpler-grants-gov` | `prod` |

The source of truth for this mapping is `account_names_by_environment` in
[`infra/api/app-config/main.tf`](../../infra/api/app-config/main.tf).

You'll need each account's numeric ID to configure its profile. Sign in to the
[AWS access portal](https://grants-sso.awsapps.com/start) — it lists every account you have access
to, with its ID, right on the landing page. In the repo, the same IDs appear in the
`infra/accounts/<account_name>.<account_id>.s3.tfbackend` filenames.

Profiles are named after the **account**, not the environment — one profile serves every environment
in that account. Note that the environment prefix `infra-` is what tells you an environment lives in
its own account.

### One-time set up

Configure one shared SSO session plus one profile per account you need. Either edit
`~/.aws/config` directly, or use the interactive `aws configure sso`.

#### Option A: edit `~/.aws/config` directly

This is usually quicker than answering the interactive prompts four times. Replace each
`<... account ID>` placeholder with the numeric ID shown for that account in the
[AWS access portal](https://grants-sso.awsapps.com/start).

```ini
[sso-session grants-sso]
sso_start_url = https://grants-sso.awsapps.com/start
sso_region = us-east-1
sso_registration_scopes = sso:account:access

[profile dev]
sso_session = grants-sso
sso_account_id = <dev account ID>
sso_role_name = AdministratorAccess
region = us-east-1

[profile staging]
sso_session = grants-sso
sso_account_id = <staging account ID>
sso_role_name = AdministratorAccess
region = us-east-1

[profile training]
sso_session = grants-sso
sso_account_id = <training account ID>
sso_role_name = AdministratorAccess
region = us-east-1

[profile prod]
sso_session = grants-sso
sso_account_id = <simpler-grants-gov account ID>
sso_role_name = AWSAdministratorAccess
region = us-east-1
```

Two things to watch:

- `region` must be `us-east-1` for every profile — that is the project's
  `default_region` in [`infra/project-config/main.tf`](../../infra/project-config/main.tf).
- The `sso_role_name` is not the same in every account. The per-environment accounts grant
  `AdministratorAccess`; the shared `simpler-grants-gov` account grants `AWSAdministratorAccess`.
  If a profile fails with a "role not found" error, open the
  [AWS access portal](https://grants-sso.awsapps.com/start) in a browser and use the exact role name
  listed for that account.

#### Option B: interactive

```bash
aws configure sso --profile staging
```

Answer the prompts with:

- **SSO session name**: `grants-sso`
- **SSO start URL**: `https://grants-sso.awsapps.com/start`
- **SSO region**: `us-east-1`
- **SSO registration scopes**: `sso:account:access`
- **CLI default client Region**: `us-east-1`

then pick the account and role from the browser list. Repeat for `--profile dev`,
`--profile training`, and `--profile prod`. After the first run the `grants-sso` session is reused,
so later runs only ask which account and role to use.

### Ongoing use

```bash
# Log in once per session. This covers every profile on the grants-sso session.
aws sso login --sso-session grants-sso

# Point your shell at the account holding the environment you're working in.
export AWS_PROFILE=staging

# Confirm you are where you think you are before running anything that writes.
aws sts get-caller-identity
```

`aws sts get-caller-identity` should report the ID of the account you meant to be in. SSO credentials
expire after a few hours; re-run `aws sso login --sso-session grants-sso` when you get an
expired-token error.

If you switch accounts often, [direnv](https://direnv.net/) can set `AWS_PROFILE` per directory so
you don't have to remember.

### Getting the profile wrong

`AWS_PROFILE` must be **exported**, not just assigned. The Make targets and `bin/` scripts shell out
to `aws` and `terraform` as child processes, and those only inherit exported variables. A bare
`AWS_PROFILE=staging` on its own line sets a shell-local variable that child processes never see.

The environment-scoped Terraform root modules (`networks`, `<app>/service`, `<app>/database`) refuse
to run against the wrong account — see
[Account safety guards](../../infra/README.md#-account-safety-guards). A wrong profile there
fails fast with:

```
Wrong AWS account: the active credentials belong to account <X>, but <...> must be deployed to account <Y>
```

Export the right profile and retry.

**The `bin/` scripts have no such guard.** `bin/run-command`, `bin/run-database-migrations`, and
friends pass no `--profile` and never check the account — they use whatever credentials are ambient.
With the wrong profile exported they will happily act on the wrong environment, or fail with
`Unable to locate credentials` if none is set. Run `aws sts get-caller-identity` first.

### References

- [Configuration basics][1]
- [Named profiles for the AWS CLI][2]
- [Configuration and credential file settings][3]
- [Configuring IAM Identity Center authentication][4]

[1]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html
[2]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
[3]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
[4]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html
