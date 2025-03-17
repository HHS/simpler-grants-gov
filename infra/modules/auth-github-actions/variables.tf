variable "allowed_actions" {
  type        = list(string)
  description = "List of IAM actions to allow GitHub Actions to perform"
}

variable "github_actions_role_name" {
  type        = string
  description = "The name to use for the IAM role GitHub actions will assume."
}

variable "github_repository" {
  type        = string
  description = "The GitHub repository in 'org/repo' format to provide access to AWS account resources. Example: navapbc/template-infra"
}
