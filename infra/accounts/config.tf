# AWS Config recorder override for Security Hub compliance (Config.1)
#
# This resource takes over management of the AWS Config recorder originally
# created by the NewRelic module to meet Security Hub requirements:
# - Enable IAM resource recording (includeGlobalResourceTypes)
# - Use AWS Config service-linked role instead of custom role
#
# To apply this change:
# 1. Remove the recorder from NewRelic module state:
#    terraform state rm module.newrelic-aws-cloud-integrations.aws_config_configuration_recorder.newrelic_recorder
# 2. Import into this resource:
#    terraform import aws_config_configuration_recorder.main newrelic_configuration_recorder-simpler-grants-gov
# 3. Apply the changes:
#    terraform apply

resource "aws_config_configuration_recorder" "main" {
  name     = "newrelic_configuration_recorder-simpler-grants-gov"
  role_arn = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/config.amazonaws.com/AWSServiceRoleForConfig"

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}
