variable "app_name" {
  type = string
}

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
  type        = string
}

variable "has_database" {
  type = bool
}

variable "has_incident_management_service" {
  type = bool
}
