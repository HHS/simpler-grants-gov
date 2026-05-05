variable "name" {
  type        = string
  description = "Name of the DynamoDB table"
}

variable "enable_point_in_time_recovery" {
  type        = bool
  description = "Enable point-in-time recovery for the DynamoDB table"
  default     = true
}
