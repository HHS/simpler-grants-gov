mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_infra_dev_gets_silent_pilot_monitoring" {
  command = plan
  assert {
    condition = alltrue([
      for name, config in output.environment_configs :
      config.service_config.enable_pdf_readability_monitoring == (name == "infra-dev") &&
      !config.service_config.pdf_readability_alarm_actions_enabled &&
      length(config.service_config.monitoring_email_alert_recipients) == 0
    ])
    error_message = "Only infra-dev may get monitoring; no environment may activate notifications or invent recipients."
  }
}
