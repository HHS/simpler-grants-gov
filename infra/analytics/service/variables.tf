variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
  default     = null
}

variable "deploy_github_ref" {
  type        = string
  description = "github ref to deploy"
  default     = null
}

variable "deploy_github_sha" {
  type        = string
  description = "github sha to deploy"
  default     = null
}
