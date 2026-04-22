output "access_policy_arn" {
  description = "The ARN of the IAM policy for sending SMS via AWS End User Messaging."
  value       = aws_iam_policy.sms_access.arn
}

output "configuration_set_name" {
  description = "The name of the SMS configuration set."
  value       = data.aws_cloudformation_stack.sms_config_set_outputs.outputs["ConfigSetName"]
}

output "configuration_set_arn" {
  description = "The ARN of the SMS configuration set."
  value       = data.aws_cloudformation_stack.sms_config_set_outputs.outputs["ConfigSetArn"]
}