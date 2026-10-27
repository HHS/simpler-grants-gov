mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_infra_dev_gets_private_routing_with_calculator_actions_off" {
  command = plan
  assert {
    condition = alltrue([
      for name, config in output.environment_configs :
      config.service_config.enable_pdf_readability_monitoring == (name == "infra-dev") &&
      !config.service_config.pdf_readability_alarm_actions_enabled &&
      length(config.service_config.monitoring_email_alert_recipients) == 0 &&
      config.service_config.monitoring_email_alert_recipient_parameter_name == (
        name == "infra-dev" ? "/nofos/infra-dev/monitoring/alert-email" : null
      )
    ])
    error_message = "Only infra-dev may select the private parameter; public recipient lists stay empty and calculator alarm actions stay off everywhere."
  }
}
