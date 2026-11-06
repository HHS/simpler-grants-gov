variable "email_alert_recipients" {
  type        = set(string)
  default     = []
  description = "List of emails to subscribe to alerts"
}

variable "email_alert_recipient_parameter_name" {
  type        = string
  default     = null
  description = "Optional SecureString SSM parameter containing one private email recipient. Leave null for no private subscription."

  validation {
    condition     = var.email_alert_recipient_parameter_name == null ? true : can(regex("^/[A-Za-z0-9_./-]+$", var.email_alert_recipient_parameter_name))
    error_message = "The private email parameter must be an absolute SSM parameter path."
  }

  validation {
    condition     = var.email_alert_recipient_parameter_name == null || length(var.email_alert_recipients) == 0
    error_message = "Use either the private email parameter or the public recipient list, not both."
  }
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
    waf_web_acl_name = string
    cluster_name     = string
    region           = string
    cpu_threshold    = optional(number, 80)
    memory_threshold = optional(number, 80)
  })
  default = null

  validation {
    condition = var.pdf_readability_monitoring == null ? true : (
      can(regex("(^|-)nofos-", var.service_name)) &&
      alltrue([for value in [var.pdf_readability_monitoring.waf_web_acl_name, var.pdf_readability_monitoring.cluster_name, var.pdf_readability_monitoring.region] : length(trimspace(value)) > 0]) &&
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
      (length(var.email_alert_recipients) > 0 || var.email_alert_recipient_parameter_name != null || var.incident_management_service_integration_url != null)
    )
    error_message = "Pilot notifications require monitoring and an explicit email recipient or existing incident integration. Email subscriptions still require confirmation."
  }
}

variable "notification_monitoring" {
  description = <<EOT
    Optional alarms for the notification enqueue job and queue processor. Null adds no resources.
    Set processor_log_group to null when the processor service is not deployed.
  EOT
  type = object({
    enqueue_enabled                      = bool
    cluster_name                         = string
    processor_service_name               = string
    processor_log_group                  = optional(string)
    enqueue_max_hours_without_completion = optional(number, 26)
    oldest_age_threshold_seconds         = optional(number, 3600)
    oldest_age_duration_minutes          = optional(number, 15)
    daily_send_threshold                 = optional(number, 30000)
  })
  default = null

  validation {
    condition = var.notification_monitoring == null ? true : (
      var.notification_monitoring.enqueue_max_hours_without_completion >= 1 &&
      var.notification_monitoring.enqueue_max_hours_without_completion <= 168 &&
      var.notification_monitoring.oldest_age_threshold_seconds > 0 &&
      var.notification_monitoring.oldest_age_duration_minutes >= 1 &&
      var.notification_monitoring.oldest_age_duration_minutes <= 1440 &&
      var.notification_monitoring.daily_send_threshold > 0
    )
    error_message = "Enqueue window must be 1-168 hours, oldest age duration 1-1440 minutes, and thresholds greater than 0."
  }
}
