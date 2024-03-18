variable "name" {
  type        = string
  description = "The name of image repository."
}

variable "push_access_role_arn" {
  type        = string
  description = "The ARN of the role to grant push access to the repository. Use this to grant access to the role that builds and publishes release artifacts."
}

variable "app_account_ids" {
  type        = list(string)
  description = "A list of account ids to grant pull access to the repository. Use this to grant access to the application environment accounts in a multi-account setup."
  default     = []
}
