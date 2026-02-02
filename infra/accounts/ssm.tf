#===================================
# AWS Systems Manager (SSM)
#===================================

# SSM.7: Block public sharing of SSM documents
# This prevents SSM documents from being shared publicly
resource "aws_ssm_service_setting" "block_public_sharing" {
  setting_id    = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:servicesetting/ssm/documents/console/public-sharing-permission"
  setting_value = "Disable"
}
