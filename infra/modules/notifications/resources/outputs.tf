output "app_id" {
  value = aws_pinpoint_app.app.application_id
}

output "access_policy_arn" {
  value = aws_iam_policy.access.arn
}
