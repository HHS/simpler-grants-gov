variable "certificate_arn" {
  type        = string
  description = "The ARN of the certificate to use for the application"
  default     = null
}

variable "container_port" {
  type        = number
  description = "The port number on the container that's bound to the user-specified"
  default     = 8000
}

variable "cpu" {
  type        = number
  default     = 256
  description = "Number of cpu units used by the task, expressed as an integer value, e.g 512"
}

variable "db_vars" {
  description = "Variables for integrating the app service with a database"
  type = object({
    security_group_ids         = list(string)
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

variable "desired_instance_count" {
  type        = number
  description = "Number of instances of the task definition to place and keep running."
  default     = 1
}

variable "domain_name" {
  type        = string
  description = "The fully qualified domain name for the application"
  default     = null
}

variable "enable_command_execution" {
  type        = bool
  default     = false
  description = "Whether the service should enable ECS Exec, such as for debugging"
}

variable "enable_waf" {
  type        = bool
  description = "Whether to enable WAF protection for the load balancer"
  default     = false
}

variable "extra_environment_variables" {
  type        = map(string)
  description = "Additional environment variables to pass to the service container. Map from environment variable name to the value."
  default     = {}
}

variable "extra_policies" {
  description = "Map of extra IAM policies to attach to the service's task role. The map's keys define the resource name in terraform."
  type        = map(string)
  default     = {}
}

variable "file_upload_jobs" {
  type = map(object({
    source_bucket = string
    path_prefix   = string
    task_command  = list(string)
  }))
  description = <<EOT
    Configurations for jobs that trigger on a file upload event.
    Each configuration is a map from the job name to an object defining the
    event's source bucket ( the bucket the file was uploaded to), a
    path prefix filter ( only files that match the path prefix will trigger
    the job), and the task command to run ( this overrides the CMD entrypoint
    in the container).

    To reference the file path and bucket that triggered the event, the task
    command can optionally include the placeholder values`<object_key>`
    and`<bucket_name>`. For example if task_command is:

      ["python", "etl.py", "<object_key>"]

    Then if an object was uploaded to s3://somebucket/path/to/file.txt, the
    task will execute the command:

      python etl.py path/to/file.txt
  EOT
  default     = {}
}

variable "hosted_zone_id" {
  type        = string
  description = "The Route53 hosted zone id for the domain"
  default     = null
}

variable "image_repository_arn" {
  type        = string
  description = "The name of the container image repository"
}

variable "image_repository_url" {
  type        = string
  description = "The name of the container image repository"
}

variable "image_tag" {
  type        = string
  description = "The tag of the image to deploy"
}

variable "is_temporary" {
  description = "Whether the service is meant to be spun up temporarily (e.g. for automated infra tests). This is used to disable deletion protection for the load balancer."
  type        = bool
  default     = false
}

variable "memory" {
  type        = number
  default     = 512
  description = "Amount (in MiB) of memory used by the task. e.g. 2048"
}

variable "network_name" {
  type        = string
  description = "The name of the network within which the service will run"

}

variable "project_name" {
  type        = string
  description = "The name of the project"
}

variable "scheduled_jobs" {
  description = "Variable for configuration of the step functions scheduled job"
  type = map(object({
    task_command        = list(string)
    schedule_expression = string
  }))
  default = {}
}

variable "secrets" {
  type = set(object({
    name      = string
    valueFrom = string
  }))
  description = "List of configurations for defining environment variables that pull from SSM parameter store"
  default     = []
}

variable "service_name" {
  description = "name of the service, to be used for infra structure resource naming"
  validation {
    condition     = can(regex("^[-_\\da-z]+$", var.service_name))
    error_message = "use only lower case letters, numbers, dashes, and underscores"
  }
}

variable "ephemeral_write_volumes" {
  type        = set(string)
  description = "A set of absolute paths in the container to be mounted as writable for the life of the task. These need to be declared with `VOLUME` instructions in the container build file."
  default     = []
}
