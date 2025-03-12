data "aws_ssm_parameter" "newrelic_account_id" {
  name = "/new-relic-account-id"
}

module "newrelic-aws-cloud-integrations" {
  source = "github.com/newrelic/terraform-provider-newrelic//examples/modules/cloud-integrations/aws?ref=v3.58.1"

  newrelic_account_id     = data.aws_ssm_parameter.newrelic_account_id.value
  newrelic_account_region = "US"
  name                    = "simpler-grants-gov"

  # checkov:skip=CKV_TF_1: I would rather not use a commit hash
}
