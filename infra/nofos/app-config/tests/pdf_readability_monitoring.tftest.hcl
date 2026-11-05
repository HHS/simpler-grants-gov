mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "dev_and_prod_get_private_routing_with_only_dev_calculator_notifications" {
  command = plan
  assert {
    condition = alltrue([
      for name, config in output.environment_configs :
      config.service_config.enable_pdf_readability_monitoring == contains(["infra-dev", "prod"], name) &&
      config.service_config.pdf_readability_alarm_actions_enabled == (name == "infra-dev") &&
      length(config.service_config.monitoring_email_alert_recipients) == 0 &&
      config.service_config.monitoring_email_alert_recipient_parameter_name == (
        contains(["infra-dev", "prod"], name) ? "/nofos/${name}/monitoring/alert-email" : null
      )
    ])
    error_message = "Only infra-dev and prod may select private parameters and monitoring. Only infra-dev enables calculator alarm actions. Public recipient lists stay empty."
  }
  assert {
    condition = (
      output.environment_configs["infra-dev"].service_config.pdf_readability_waf.rate_action == "count" &&
      output.environment_configs["infra-dev"].service_config.pdf_readability_waf.rate_limit == 10 &&
      !output.environment_configs["infra-dev"].service_config.pdf_readability_waf.emergency_block
    )
    error_message = "Notification activation must leave dev WAF observation mode and the existing rate limit unchanged."
  }
}
