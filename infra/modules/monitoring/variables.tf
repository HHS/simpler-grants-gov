variable "email_alert_recipients" {
  type        = set(string)
  default     = []
  description = "List of emails to subscribe to alerts"
}

variable "incident_management_service_integration_url" {
  type        = string
  default     = null
  description = "URL for integrating with for external incident management services"
}

variable "load_balancer_arn_suffix" {
  type        = string
  description = "The ARN suffix for use with CloudWatch Metrics."
}

variable "application_log_group" {
  description = <<EOT
    Name of the CloudWatch log group holding the ECS service's application logs.
  EOT
  type        = string
}

variable "service_name" {
  type        = string
  description = "Name of the service running within ECS cluster"
}
