variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
  default     = null
}

variable "domain" {
  type        = string
  description = "DNS domain of the website managed by HHS"
  default     = null
}
