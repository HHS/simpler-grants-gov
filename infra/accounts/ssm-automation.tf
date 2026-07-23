#===================================
# SSM Automation
#===================================

# SSM.6: Enable CloudWatch logging for SSM Automation
# This ensures SSM Automation execution logs are sent to CloudWatch

# CloudWatch Log Group for SSM Automation
resource "aws_cloudwatch_log_group" "ssm_automation" {
  #checkov:skip=CKV_AWS_158:KMS encryption to be added in future update
  name              = "/aws/ssm/automation"
  retention_in_days = 365
}

# SSM Service Setting to enable CloudWatch logging for Automation
resource "aws_ssm_service_setting" "automation_cloudwatch_logging" {
  setting_id    = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:servicesetting/ssm/automation/customer-script-log-destination"
  setting_value = "CloudWatch"
}

# Enable CloudWatch log group output for SSM Automation
resource "aws_ssm_service_setting" "automation_cloudwatch_logging_enabled" {
  setting_id    = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:servicesetting/ssm/automation/customer-script-log-group-name"
  setting_value = aws_cloudwatch_log_group.ssm_automation.name
}
