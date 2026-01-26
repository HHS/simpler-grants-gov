# Compliance

We use [Checkov](https://www.checkov.io/) and [tfsec](https://aquasecurity.github.io/tfsec/) static analysis tools to check for compliance with infrastructure policies.

## Setup

To run these tools locally, first install them by running the following commands.

* Install `checkov`

    ```bash
    brew install checkov
    ```

* Install `tfsec`

    ```bash
    brew install tfsec
    ```

## Check compliance

```bash
make infra-check-compliance
```

## Pre-Commit

If you use [pre-commit](https://www.checkov.io/4.Integrations/pre-commit.html), you can optionally add `checkov` to your own pre-commit hook by following the instructions [here](https://www.checkov.io/4.Integrations/pre-commit.html).
