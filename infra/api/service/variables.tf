variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
  default     = null
}

variable "submission_oldest_message_age_threshold_seconds" {
  description = "Age in seconds of the oldest submission message that triggers the alarm."
  type        = number
  default     = 900
}

variable "submission_memory_alarm_threshold_percent" {
  description = "Consumer memory utilization (percent) that triggers the alarm."
  type        = number
  default     = 80
}

variable "dlq_alarm_threshold" {
  description = "Number of visible messages on the scanner DLQ that triggers the buildup alarm."
  type        = number
  default     = 1
}
