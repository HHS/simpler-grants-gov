variable "name" {
  type        = string
  description = "Name of the SQS queue"
}

variable "visibility_timeout_seconds" {
  type        = number
  description = "The visibility timeout for the queue in seconds"
  default     = 30
}

variable "message_retention_seconds" {
  type        = number
  description = "The number of seconds Amazon SQS retains a message"
  default     = 345600 # 4 days default
}

variable "max_receive_count" {
  type        = number
  description = "The number of times a message can be received before being sent to the dead letter queue"
  default     = 3
}
