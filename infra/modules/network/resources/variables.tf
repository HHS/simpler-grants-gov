variable "enable_command_execution" {
  type        = bool
  description = "Whether the application(s) in this network need ECS Exec access. Determines whether to create VPC endpoints needed by ECS Exec."
  default     = false
}

variable "enable_notifications" {
  type        = bool
  description = "Whether the application(s) in this network need AWS Pinpoint access."
  default     = false
}

variable "has_database" {
  type        = bool
  description = "Whether the application(s) in this network have a database. Determines whether to create VPC endpoints needed by the database layer."
  default     = false
}

variable "has_external_non_aws_service" {
  type        = bool
  description = "Whether the application(s) in this network need to call external non-AWS services. Determines whether or not to create NAT gateways."
  default     = false
}

variable "name" {
  type        = string
  description = "Name to give the VPC. Will be added to the VPC under the 'network_name' tag."
}
