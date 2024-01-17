variable "network_name" {
  type        = string
  description = "Human readable identifier for the VPC"
  default     = "simpler-VPC"
}

variable "has_database" {
  type        = bool
  description = "whether the application has a database"
  default     = true
}
