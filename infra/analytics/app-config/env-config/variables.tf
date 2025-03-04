variable "project_name" {
  type = string
}

variable "app_name" {
  type = string
}

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
  type        = string
}

variable "account_name" {
  description = <<EOT
    Name of the AWS account that contains the resources for the application environment.
    The list of configured AWS accounts is stored in /infra/account as
    backend config files with the naming convention:
      <ACCOUNT_NAME>.<ACCOUNT_ID>.s3.tfbackend
    Provide the ACCOUNT_NAME for this variable.
    EOT
  type        = string
}

variable "network_name" {
  description = "Human readable identifier of the network / VPC"
  type        = string
}

variable "default_region" {
  description = "default region for the project"
  type        = string
}

variable "has_incident_management_service" {
  type = bool
}

variable "domain_name" {
  type        = string
  description = "The fully qualified domain name for the application"
  default     = null
}

variable "enable_https" {
  type        = bool
  description = "Whether to enable HTTPS for the application"
  default     = false
}

variable "certificate_arn" {
  type        = string
  description = "The ARN of the certificate to use for the application"
  default     = null
}

variable "has_database" {
  type    = bool
  default = true
}

variable "domain" {
  type        = string
  description = "DNS domain of the website managed by HHS"
  default     = null
}

variable "database_instance_count" {
  description = "Number of database instances. Should be 2+ for production environments."
  type        = number
  default     = 1
}

variable "service_cpu" {
  type    = number
  default = 256
}

variable "service_memory" {
  type    = number
  default = 512
}

variable "service_desired_instance_count" {
  type    = number
  default = 1
}

variable "service_override_extra_environment_variables" {
  type        = map(string)
  description = <<EOT
    Map that overrides the default extra environment variables defined in environment-variables.tf.
    Map from environment variable name to environment variable value
    EOT
  default     = {}
}

variable "enable_command_execution" {
  type        = bool
  description = "Enables the ability to manually execute commands on running service containers using AWS ECS Exec"
  default     = false
}
