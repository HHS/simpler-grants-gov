data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

output "access_policy_arn" {
  description = "The ARN of the IAM policy for accessing the Bedrock Data Automation project"
  value       = aws_iam_policy.bedrock_access.arn
}

output "bda_project_arn" {
  description = "The ARN of the Bedrock Data Automation project"
  value       = awscc_bedrock_data_automation_project.bda_project.project_arn
}

# aws bedrock data automation requires users to use cross Region inference support
# when processing files. the following like the profile ARNs for different inference
# profiles
# https://docs.aws.amazon.com/bedrock/latest/userguide/bda-cris.html
# TODO(https://github.com/navapbc/template-infra/issues/993) Add GovCloud Support
output "bda_profile_arn" {
  description = "The profile ARN associated with the BDA project"
  value       = "arn:aws:bedrock:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:data-automation-profile/us.data-automation-v1"
}

output "bda_blueprint_arns" {
  value = [
    for key, bp in awscc_bedrock_blueprint.bda_blueprint : bp.blueprint_arn
  ]
}

output "bda_blueprint_names" {
  value = [
    for key, bp in awscc_bedrock_blueprint.bda_blueprint : bp.blueprint_name
  ]
}

output "bda_blueprint_arn_to_name" {
  value = {
    for key, bp in awscc_bedrock_blueprint.bda_blueprint : bp.blueprint_arn => bp.blueprint_name
  }
}
