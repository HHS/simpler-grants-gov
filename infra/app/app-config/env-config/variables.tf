variable "app_name" {
  type = string
}

variable "environment" {
  description = "name of the application environment (e.g. dev, staging, prod)"
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

variable "has_database" {
  type = bool
}

variable "has_incident_management_service" {
  type = bool
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
