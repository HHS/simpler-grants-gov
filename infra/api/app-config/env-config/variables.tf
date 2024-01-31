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

variable "has_incident_management_service" {
  type = bool
}
