output "ssm_parameter_arns" {
  description = "Map of feature flag keys to their ARNs"
  value       = { for key, param in aws_ssm_parameter.feature_flags : key => param.arn }
}
