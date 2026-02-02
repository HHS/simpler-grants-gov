variable "app_name" {
  type = string
}

variable "enable_notifications" {
  type        = bool
  description = "Enable notifications for the application"
  default     = false

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

variable "has_search" {
  type    = bool
  default = false
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

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
  type        = string
}

variable "has_database" {
  type    = bool
  default = true
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
  default = 3
}

variable "database_instance_count" {
  description = "Number of database instances. Should be 2+ for production environments."
  type        = number
  default     = 1
}

variable "database_enable_http_endpoint" {
  description = "Enable HTTP endpoint (data API). Enables the Query Editor in the AWS Console."
  type        = bool
  default     = false
}

variable "database_max_capacity" {
  description = "Maximum capacity of the Aurora Serverless v2 cluster"
  type        = number
}

variable "database_min_capacity" {
  description = "Minimum capacity of the Aurora Serverless v2 cluster"
  type        = number
}

variable "instance_cpu" {
  description = "CPU units for the ECS container instances"
  type        = number
  default     = 1024
}

variable "instance_memory" {
  description = "Memory in MiB for the ECS container instances"
  type        = number
  default     = 4096
}

variable "instance_desired_instance_count" {
  description = "Number of desired ECS container instances for the service"
  type        = number
  default     = 1
}

variable "instance_scaling_max_capacity" {
  description = "Maximum number of ECS container instances for the service"
  type        = number
}

variable "instance_scaling_min_capacity" {
  description = "Minimum number of ECS container instances for the service"
  type        = number
}

variable "service_override_extra_environment_variables" {
  type        = map(string)
  description = <<EOT
    Map that overrides the default extra environment variables defined in environment-variables.tf.
    Map from environment variable name to environment variable value
  EOT
  default     = {}
}

variable "database_engine_version" {
  type        = string
  description = "Postgres database engine version"
  default     = "17.5"
}
