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

The [GitHub CLI](https://cli.github.com/) is useful for automating certain operations for GitHub such as with GitHub actions. This is needed to run [check-github-actions-auth.sh](/bin/check-github-actions-auth.sh)

```bash
brew install gh
```

### Install linters

We have several optional utilities for running infrastructure linters locally. These are run as part of the CI pipeline, therefore, it is often simpler to test them locally first.

* [Shellcheck](https://github.com/koalaman/shellcheck)
* [actionlint](https://github.com/rhysd/actionlint)
* [markdown-link-check](https://github.com/tcort/markdown-link-check)

```bash
brew install shellcheck
brew install actionlint
make infra-lint
```

## AWS Authentication

In order for Terraform to authenticate with your accounts you will need to configure your aws credentials using the AWS CLI or manually create your config and credentials file. If you need to manage multiple credentials or create named profiles for use with different environments you can add the `--profile` option.

There are multiple ways to authenticate, but we recommend creating a separate profile for your project in your AWS credentials file, and setting your local environment variable `AWS_PROFILE` to the profile name. We recommend using [direnv](https://direnv.net/) to manage local environment variables.
**Credentials should be located in ~/.aws/credentials** (Linux & Mac) or **%USERPROFILE%\.aws\credentials** (Windows)

### Examples

```bash
$ aws configure
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-2
Default output format [None]: json
```

**Using the above command will create a [default] profile.**  

```bash
$ aws configure --profile dev
AWS Access Key ID [None]: AKIAIOSFODNN7EXAMPLE
AWS Secret Access Key [None]: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
Default region name [None]: us-east-2
Default output format [None]: json
```

**Using the above command will create a [dev] profile.**  

Once you're done, verify access by running the following command to print out information about the AWS IAM user you authenticated as.

```bash
aws sts get-caller-identity
```

### References

- [Configuration basics][1]
- [Named profiles for the AWS CLI][2]
- [Configuration and credential file settings][3]

[1]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html
[2]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-profiles.html
[3]: https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
