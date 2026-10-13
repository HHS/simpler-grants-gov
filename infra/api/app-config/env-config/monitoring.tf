locals {
  monitoring_config = {
    # Emails to notify for alerts.
    # Use this as a simple notification mechanism if you don't have an incident management service.
    email_alert_recipients = []

    incident_management_service = var.has_incident_management_service ? {
      integration_url_param_name = "/monitoring/${var.app_name}/${var.environment}/incident-management-integration-url"
    } : null
  }
}

