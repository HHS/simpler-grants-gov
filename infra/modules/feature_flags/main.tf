resource "aws_ssm_parameter" "feature_flags" {
  # checkov:skip=CKV2_AWS_34:Feature flags values don't need to be encrypted
  for_each = var.feature_flags

  name        = "/service/${var.service_name}/feature-flag/${each.key}"
  value       = each.value
  type        = "String"
  description = "Feature flag for ${each.key} in ${var.service_name}"
}
