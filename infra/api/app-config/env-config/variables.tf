variable "app_name" {
  type = string
}

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
  type        = string
}

variable "default_region" {
  description = "default region for the project"
  type        = string
}

variable "has_opensearch" {
  type = bool
}

variable "opensearch_dedicated_master_type" {
  type = string
}

variable "opensearch_instance_type" {
  type = string
}

variable "opensearch_engine_version" {
  type = number
}

variable "opensearch_volume_size" {
  type = number
}

variable "has_database" {
  type = bool
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

variable "has_incident_management_service" {
  type = bool
}

variable "domain" {
  type        = string
  description = "DNS domain of the website managed by HHS"
  default     = null
}

variable "service_override_extra_environment_variables" {
  type        = map(string)
  description = <<EOT
    Map that overrides the default extra environment variables defined in environment-variables.tf.
    Map from environment variable name to environment variable value
    EOT
  default     = {}
}

variable "load_transform_args" {
  type = list(string)
}
