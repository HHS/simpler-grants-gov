# aws-account-guard
#
# Short-circuits `terraform plan`/`apply` when the active AWS credentials point
# at a different account than the one this configuration is meant for. This
# guards against, e.g., running an apply for an infra-dev layer (account
# 061664787759) while an AWS profile for the shared account (315341936575) is
# active — the classic "forgot to switch AWS_PROFILE" mistake.
#
# The expected account id is passed in (resolve it with the account-id-by-name
# module). The check is a data-source postcondition, so it fails during the plan
# phase before any resource changes. It complements the provider's native
# `allowed_account_ids` (which also covers destroy); this one adds a clearer,
# context-rich error message.

terraform {
  # No version pin so the caller's aws provider version flows through.
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

data "aws_caller_identity" "current" {
  lifecycle {
    postcondition {
      condition = self.account_id == var.expected_account_id
      error_message = join(" ", [
        "Wrong AWS account:",
        "the active credentials belong to account ${self.account_id},",
        "but ${var.context} must be deployed to account ${var.expected_account_id}.",
        "Set the correct AWS profile / SSO role (e.g. export AWS_PROFILE=...) and retry.",
      ])
    }
  }
}
