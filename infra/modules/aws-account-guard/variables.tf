variable "expected_account_id" {
  type        = string
  description = "AWS account ID that this configuration must be applied to (resolve with the account-id-by-name module)."
}

variable "context" {
  type        = string
  default     = "this configuration"
  description = "Human-readable description of what is being deployed, shown in the wrong-account error message."
}
