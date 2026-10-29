output "account_id" {
  description = "The AWS account ID of the active credentials (validated to match expected_account_id)."
  value       = data.aws_caller_identity.current.account_id
}
