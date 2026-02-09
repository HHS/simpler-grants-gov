variable "aws_services_security_group_id" {
  type        = string
  description = "Security group ID for VPC endpoints that access AWS Services"
}

variable "image_repository_name" {
  type        = string
  description = "The name of the container image repository"
  default     = null
}

variable "container_port" {
  type        = number
  description = "The port number on the container that's bound to the user-specified"
  default     = 8000
}

variable "environment_name" {
  type        = string
  description = "The name of the environment"
  default     = ""
}

variable "hostname" {
  type        = string
  description = "The hostname to override the default AWS configuration"
  default     = null
}

variable "s3_buckets" {
  type = map(object({
    env_var = string
    public  = bool
    paths = list(object({
      path    = string
      env_var = string
    }))
  }))
  default = {}
}

variable "enable_drafts_bucket" {
  description = "does the service need a private S3 bucket for draft document storage"
  type        = bool
  default     = false
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

variable "certificate_arn" {
  description = "The ARN for the TLS certificate passed in from the app service layer"
  type        = string
  default     = null
}

variable "enable_autoscaling" {
  description = "Flag to enable or disable auto-scaling"
  type        = bool
  default     = false
}

variable "max_capacity" {
  description = "Maximum number of tasks for autoscaling"
  type        = number
  default     = 4
}

variable "min_capacity" {
  description = "Minimum number of tasks for autoscaling"
  type        = number
  default     = 2
}

variable "readonly_root_filesystem" {
  description = "Whether the container has a read-only root filesystem"
  type        = bool
  default     = true
}

variable "drop_linux_capabilities" {
  description = "Whether to drop linux parameters"
  type        = bool
  default     = true
}

variable "enable_api_gateway" {
  description = "Whether to enable API Gateway for the service"
  type        = bool
  default     = false
}

variable "enable_load_balancer" {
  description = "Whether to enable a load balancer for the service"
  type        = bool
  default     = true
}

variable "enable_alb_cdn" {
  description = "Whether to enable an ALB origin CDN for the service. Cannot be enabled at the same time as the S3 CDN."
  type        = bool
  default     = false
}

variable "enable_s3_cdn" {
  description = "Whether to enable a S3 origin CDN for the service. Cannot be enabled at the same time as the ALB CDN."
  type        = bool
  default     = false
}

variable "s3_cdn_bucket_name" {
  description = "The name of the S3 bucket to use for the S3 CDN."
  type        = string
  default     = null
}

variable "s3_cdn_certificate_arn" {
  description = "The ARN of the certificate to use for the S3 CDN"
  type        = string
  default     = null
}

variable "s3_cdn_domain_name" {
  description = "The domain name of the S3 bucket to use for the S3 CDN"
  type        = string
  default     = null
}

variable "healthcheck_command" {
  description = "The command to run to check the health of the container, used on the container health check"
  type        = list(string)
  default = [
    "CMD-SHELL",
    "wget --no-verbose --tries=1 --spider http://localhost:8000/health || exit 1"
  ]
}

variable "healthcheck_path" {
  description = "The path to check the health of the container, used on the load balancer health check"
  type        = string
  default     = "/health"
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
  default     = null
}

variable "image_repository_url" {
  type        = string
  description = "The name of the container image repository"
  default     = null
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

variable "fluent_bit_memory" {
  type        = number
  default     = 256
  description = "Amount (in MB) of memory used by the fluent bit container"
}

variable "fluent_bit_cpu" {
  type        = number
  default     = 256
  description = "Amount of cpu used by the fluent bit container"
}

variable "fargate_cpu" {
  type        = number
  default     = 2048
  description = "Total CPU for all the containers in the task definiton, must be equal to or less than the total cpu allocated for the app and fluentbit container"
}

variable "fargate_memory" {
  type        = number
  default     = 4096
  description = "Total memory for all the containers in the task definiton, must be equal to or less than the total memory allocated for the app and fluentbit container"
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
    state               = string
    cpu                 = optional(number, 1024)
    mem                 = optional(number, 2048)
    environment_vars = optional(list(object({
      Name  = string
      Value = string
    })), [])
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

variable "pinpoint_app_id" {
  type        = string
  description = "Pinpoint App ID"
  default     = ""
}

variable "hosted_zone" {
  type        = string
  description = "The domain where SES is set up for emails"
  default     = null
}

variable "ses_configuration_set" {
  type        = string
  description = "The configuration set (dashed-domain-name) where SES is set up for emails"
  default     = null
}

variable "enable_mtls_load_balancer" {
  type        = bool
  description = "Stand up a second twin LB that will support mTLS client certificate auth passthrough"
  default     = false
}

variable "mtls_domain_name" {
  type        = string
  description = "The fully qualified domain name for the mTLS-enabled load balancer"
  default     = null
}

variable "mtls_certificate_arn" {
  description = "The ARN of the certificate to use for the mTLS LB for the API"
  type        = string
  default     = null
}

variable "optional_extra_alb_certs" {
  description = "Optional: Stores the ARN for extra certs to attach to the ALB"
  type        = list(string)
  default     = []
}

variable "optional_extra_alb_domains" {
  description = "Optional: Other domains the ALB is configured to accept traffic to. Requires optional_extra_alb_certs to be set"
  type        = list(string)
  default     = []
}

variable "opensearch_ingest_policy_arn" {
  description = "The ARN of the IAM policy for OpenSearch ingest operations. When provided, attaches to the migrator role for scheduled data loading jobs."
  type        = string
  default     = null
}
