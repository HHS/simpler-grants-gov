variable "service_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.service_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}

variable "image_tag" {
  type        = string
  description = "The tag of the image to deploy"
}

variable "image_repository_name" {
  type        = string
  description = "The name of the container image repository"
}

variable "desired_instance_count" {
  type        = number
  description = "Number of instances of the task definition to place and keep running."
  default     = 1
}

variable "cpu" {
  type        = number
  default     = 256
  description = "Number of cpu units used by the task, expessed as an integer value, e.g 512 "
}

variable "memory" {
  type        = number
  default     = 512
  description = "Amount (in MiB) of memory used by the task. e.g. 2048"
}


variable "container_port" {
  type        = number
  description = "The port number on the container that's bound to the user-specified"
  default     = 8000
}

variable "vpc_id" {
  type        = string
  description = "Uniquely identifies the VPC."
}

variable "subnet_ids" {
  type        = list(any)
  description = "Private subnet id from vpc module"
}

variable "db_vars" {
  description = "Variables for integrating the app service with a database"
  type = object({
    security_group_ids         = list(string)
    access_policy_arn          = string
    app_access_policy_arn      = string
    migrator_access_policy_arn = string
    connection_info = object({
      host        = string
      port        = string
      user        = string
      db_name     = string
      schema_name = string
    })
  })
  default = null
}
