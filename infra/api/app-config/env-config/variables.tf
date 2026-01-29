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

variable "has_search" {
  type    = bool
  default = false
}

variable "domain_name" {
  type        = string
  description = "The fully qualified domain name for the application"
  default     = null
}

variable "s3_cdn_domain_name" {
  type        = string
  description = "The domain name for the S3 CDN, used for static assets"
  default     = null
}

variable "mtls_domain_name" {
  type        = string
  description = "The domain name for the mTLS side-by-side ALB for the API"
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

variable "feature_flag_overrides" {
  type        = map(string)
  description = "Map of overrides for feature flags"
  default     = {}
  validation {
    condition     = length(setsubtract(keys(var.feature_flag_overrides), keys(local.feature_flag_defaults))) == 0
    error_message = "All features in feature_flag_overrides must be declared in feature_flag_defaults."
  }
}

variable "has_database" {
  type = bool
}

variable "search_data_instance_type" {
  type    = string
  default = "or1.medium.search"
}

variable "search_master_instance_type" {
  type    = string
  default = "m6g.large.search"
}

variable "search_engine_version" {
  type = string
}

variable "search_data_instance_count" {
  type    = number
  default = 3
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

variable "service_memory" {
  type    = number
  default = 2048
}

variable "service_desired_instance_count" {
  type    = number
  default = 1
}

variable "search_data_volume_size" {
  type    = number
  default = 20
}

variable "search_availability_zone_count" {
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
  default     = 2048
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

variable "has_incident_management_service" {
  type = bool
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

variable "secondary_domain_names" {
  type        = list(string)
  description = "A list of domain names the ALB can also use"
  default     = []
}
