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

variable "pdf_readability_monitoring" {
  description = "Optional NOFO pilot dashboard and alarms. Null adds no resources. Thresholds are provisional dev values."
  type = object({
    waf_metric_name  = string
    cluster_name     = string
    region           = string
    cpu_threshold    = optional(number, 80)
    memory_threshold = optional(number, 80)
  })
  default = null

  validation {
    condition = var.pdf_readability_monitoring == null ? true : (
      can(regex("(^|-)nofos-", var.service_name)) &&
      alltrue([for value in [var.pdf_readability_monitoring.waf_metric_name, var.pdf_readability_monitoring.cluster_name, var.pdf_readability_monitoring.region] : length(trimspace(value)) > 0]) &&
      var.pdf_readability_monitoring.cpu_threshold > 0 && var.pdf_readability_monitoring.cpu_threshold <= 100 &&
      var.pdf_readability_monitoring.memory_threshold > 0 && var.pdf_readability_monitoring.memory_threshold <= 100
    )
    error_message = "Pilot monitoring requires a NOFO service, nonempty WAF metric/cluster/region values, and utilization thresholds greater than 0 and at most 100."
  }
}

variable "pdf_readability_alarm_actions_enabled" {
  type        = bool
  default     = false
  description = "Enable pilot SNS alarm notifications only after recipients and delivery have been agreed. Existing alarm actions are unchanged."

  validation {
    condition = !var.pdf_readability_alarm_actions_enabled || (
      var.pdf_readability_monitoring != null &&
      (length(var.email_alert_recipients) > 0 || var.incident_management_service_integration_url != null)
    )
    error_message = "Pilot notifications require monitoring and an explicit email recipient or existing incident integration. Email subscriptions still require confirmation."
  }
}
