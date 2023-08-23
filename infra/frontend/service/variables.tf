variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
  default     = null
}

variable "tfstate_bucket" {
  type = string
}

variable "tfstate_key" {
  type = string
}

variable "region" {
  type = string
}
