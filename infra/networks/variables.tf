variable "aws_services_security_group_name_prefix" {
  type    = string
  default = "simpler"
}

variable "has_database" {
  type        = bool
  description = "whether the application has a database"
  default     = true
}
