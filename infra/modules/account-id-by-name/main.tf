# account-id-by-name
#
# Pure (provider-less) resolver that maps an account NAME to its AWS account ID
# by reading the infra/accounts/<account_name>.<account_id>.s3.tfbackend file.
#
# It deliberately uses NO aws provider so its output can be referenced from a
# provider block (e.g. `allowed_account_ids`) without creating a dependency
# cycle, and reused by the aws-account-guard module for a friendly error.

variable "account_name" {
  type        = string
  description = "Account name matching infra/accounts/<account_name>.<account_id>.s3.tfbackend."
}

variable "accounts_dir" {
  type        = string
  description = "Path to the infra/accounts directory, e.g. \"$${path.module}/../accounts\" from a top-level root or \"$${path.module}/../../accounts\" from an app root."
}

locals {
  _backend_files = tolist(fileset(var.accounts_dir, "${var.account_name}.*.s3.tfbackend"))

  account_id = (
    length(local._backend_files) == 1
    ? regex("\\.(\\d+)\\.s3\\.tfbackend$", local._backend_files[0])[0]
    : "UNKNOWN"
  )
}

output "account_id" {
  description = "AWS account ID for account_name, or \"UNKNOWN\" if it could not be resolved from infra/accounts."
  value       = local.account_id
}
