output "phone_pool_arn" {
  description = "The ARN of the SMS phone pool."
  value       = data.aws_cloudformation_stack.sms_phone_pool_outputs.outputs["PhonePoolArn"]
}

output "phone_pool_id" {
  description = "The ID of the SMS phone pool."
  value       = data.aws_cloudformation_stack.sms_phone_pool_outputs.outputs["PhonePoolId"]
}

output "phone_number_arn" {
  description = "The ARN of the SMS phone number."
  value       = data.aws_cloudformation_stack.sms_phone_pool_outputs.outputs["PhoneNumberArn"]
}

output "phone_number_id" {
  description = "The ID of the SMS phone number."
  value       = data.aws_cloudformation_stack.sms_phone_pool_outputs.outputs["PhoneNumberId"]
}