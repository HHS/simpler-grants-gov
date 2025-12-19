variable "name" {
  type        = string
  description = "The name of the backend resource. This will be used to prefix the names of the other backend resources."
}

variable "enable_dynamodb_lock_table" {
  type        = bool
  description = "Whether to create a DynamoDB table for state locking. Set to false when using S3 native locking (use_lockfile = true in backend config). Defaults to false as S3 native locking is now the recommended approach."
  default     = false
}
