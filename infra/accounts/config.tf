# AWS Config recorder for Security Hub compliance (Config.1)
#
# This resource was originally managed by the NewRelic module but has been moved here
# to maintain Security Hub compliance. The recorder is configured with:
# - Service-linked role (AWSServiceRoleForConfig)
# - Global resource recording enabled (includeGlobalResourceTypes: true)
#
# We use ignore_changes to prevent Terraform from modifying the manually-configured
# compliant settings.

resource "aws_config_configuration_recorder" "main" {
  name     = "newrelic_configuration_recorder-simpler-grants-gov"
  role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig"

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  lifecycle {
    ignore_changes = all
  }
}

# Move the resource from NewRelic module management to local management
moved {
  from = module.newrelic-aws-cloud-integrations.aws_config_configuration_recorder.newrelic_recorder
  to   = aws_config_configuration_recorder.main
}
