variable "is_temporary" {
  description = "Whether the service is meant to be spun up temporarily (e.g. for automated infra tests). This is used to disable deletion protection."
  type        = bool
  default     = false
}

variable "name" {
  type        = string
  description = "Name of the AWS S3 bucket. Needs to be globally unique across all regions."
}

variable "service_principals_with_access" {
  description = <<-EOT
  Storage access should generally be controlled via attaching the `access_policy_arn`
  output to an IAM role, but there are some situations where that may not be possible.
  Generally when an AWS service doesn't have a way to assume a particular IAM role for operations.

  This list of AWS service principals (e.g., bedrock.amazonaws.com) will be used to configure
  resources (e.g., the bucket's KMS key) such that the services will be able
  to access the bucket's objects.
  EOT
  type        = list(string)
  default     = []
}
