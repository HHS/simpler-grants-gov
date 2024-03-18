variable "service_name" {
  type        = string
  description = "Name of the service running within ECS cluster"
}

variable "load_balancer_arn_suffix" {
  type        = string
  description = "The ARN suffix for use with CloudWatch Metrics."
}

variable "email_alerts_subscription_list" {
  type        = set(string)
  default     = []
  description = "List of emails to subscribe to alerts"

}

variable "incident_management_service_integration_url" {
  type        = string
  default     = null
  description = "URL for integrating with for external incident management services"
}
