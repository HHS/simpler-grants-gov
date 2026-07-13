variable "account_name" {
  type        = string
  description = "Human-readable name of the AWS account being configured (e.g. \"dev\", \"staging\"). Used to make the New Relic linked-account name unique per account. Passed via TF_VAR_account_name by the setup scripts; falls back to the account id if unset."
  default     = ""
}

data "aws_ssm_parameter" "newrelic_account_id" {
  name = "/new-relic-account-id"
}

locals {
  # New Relic linked-account names must be unique within the New Relic account.
  newrelic_link_name_full = (
    local.is_admin_account
    ? "simpler-grants-gov"
    : "simpler-grants-gov-${coalesce(var.account_name, data.aws_caller_identity.current.account_id)}"
  )

  newrelic_link_name = length(local.newrelic_link_name_full) > 24 ? substr(local.newrelic_link_name_full, 0, 24) : local.newrelic_link_name_full
}

module "newrelic-aws-cloud-integrations" {
  source = "github.com/newrelic/terraform-provider-newrelic//examples/modules/cloud-integrations/aws?ref=v3.58.1"

  newrelic_account_id     = data.aws_ssm_parameter.newrelic_account_id.value
  newrelic_account_region = "US"
  name                    = local.newrelic_link_name

  # checkov:skip=CKV_TF_1: I would rather not use a commit hash
}
