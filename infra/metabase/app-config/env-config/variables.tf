variable "project_name" {
  description = "Project name to be used as a prefix for resources"
  type        = string
}

variable "app_name" {
  description = "Application name to be used as a prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment name (e.g., dev, staging, prod)"
  type        = string
}

variable "network_name" {
  description = "Name of the network"
  type        = string
}

variable "default_region" {
  description = "Default AWS region"
  type        = string
}

variable "service_cpu" {
  description = "CPU units for the Metabase service"
  type        = number
}

variable "service_memory" {
  description = "Memory (MB) for the Metabase service"
  type        = number
}

variable "service_desired_instance_count" {
  description = "Desired number of Metabase service instances"
  type        = number
  default     = 1
}

variable "instance_scaling_min_capacity" {
  description = "Minimum number of service instances for autoscaling"
  type        = number
  default     = 1
}

variable "instance_scaling_max_capacity" {
  description = "Maximum number of service instances for autoscaling"
  type        = number
  default     = 2
}

variable "enable_command_execution" {
  description = "Enable ECS Exec for debugging"
  type        = bool
  default     = false
}

variable "enable_https" {
  description = "Enable HTTPS"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for the service"
  type        = string
  default     = null
}

variable "service_override_extra_environment_variables" {
  description = "Additional environment variables to override defaults"
  type        = map(string)
  default     = {}
}

# Analytics database configuration - Metabase uses the analytics database
variable "analytics_database_cluster_name" {
  description = "Name of the analytics database cluster that Metabase will connect to"
  type        = string
}
