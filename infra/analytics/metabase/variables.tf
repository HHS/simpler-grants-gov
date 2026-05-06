variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "image_tag" {
  type        = string
  description = "image tag to deploy to the environment"
  default     = null
}
variable "fargate_cpu" {
  type        = number
  default     = 512
  description = "Total CPU for all the containers in the task definiton, must be equal to or less than the total cpu allocated for the app and fluentbit container"
}

variable "fargate_memory" {
  type        = number
  default     = 512
  description = "Total memory for all the containers in the task definiton, must be equal to or less than the total memory allocated for the app and fluentbit container"
}
