variable "app_name" {
  type = string
}

variable "certificate_arn" {
  type        = string
  description = "The ARN of the certificate to use for the application"
  default     = null
}

variable "default_region" {
  description = "default region for the project"
  type        = string
}

variable "domain_name" {
  type        = string
  description = "The fully qualified domain name for the application"
  default     = null
}

variable "enable_command_execution" {
  type        = bool
  description = "Enables the ability to manually execute commands on running service containers using AWS ECS Exec"
  default     = false
}

variable "enable_https" {
  type        = bool
  description = "Whether to enable HTTPS for the application"
  default     = false
}

variable "enable_identity_provider" {
  type        = bool
  description = "Enables identity provider"
  default     = false
}

variable "enable_notifications" {
  type        = bool
  description = "Enables notifications"
  default     = false
}

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
  type        = string
}

variable "extra_identity_provider_callback_urls" {
  type        = list(string)
  description = "List of additional URLs that the identity provider will redirect the user to after a successful sign-in. Used for local development."
  default     = []
}

variable "extra_identity_provider_logout_urls" {
  type        = list(string)
  description = "List of additional URLs that the identity provider will redirect the user to after signing out. Used for local development."
  default     = []
}

variable "has_database" {
  type = bool
}

variable "has_incident_management_service" {
  type = bool
}

variable "network_name" {
  description = "Human readable identifier of the network / VPC"
  type        = string
}

variable "project_name" {
  type = string
}

variable "service_cpu" {
  type    = number
  default = 256
}

variable "service_desired_instance_count" {
  type    = number
  default = 1
}

variable "service_memory" {
  type    = number
  default = 512
}

variable "service_override_extra_environment_variables" {
  type        = map(string)
  description = <<EOT
    Map that overrides the default extra environment variables defined in environment-variables.tf.
    Map from environment variable name to environment variable value
  EOT
  default     = {}
}
