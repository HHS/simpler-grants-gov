mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "dev_and_prod_get_private_routing_and_calculator_notifications" {
  command = plan
  assert {
    condition = alltrue([
      for name, config in output.environment_configs :
      config.service_config.enable_pdf_readability_monitoring == contains(["infra-dev", "prod"], name) &&
      config.service_config.pdf_readability_alarm_actions_enabled == contains(["infra-dev", "prod"], name) &&
      length(config.service_config.monitoring_email_alert_recipients) == 0 &&
      config.service_config.monitoring_email_alert_recipient_parameter_name == (
        contains(["infra-dev", "prod"], name) ? "/nofos/${name}/monitoring/alert-email" : null
      )
    ])
    error_message = "Only infra-dev and prod may select private parameters, monitoring and calculator alarm actions. Public recipient lists stay empty."
  }
  assert {
    condition = (
      output.environment_configs["infra-dev"].service_config.pdf_readability_waf.rate_action == "block" &&
      output.environment_configs["infra-dev"].service_config.pdf_readability_waf.rate_limit == 10 &&
      !output.environment_configs["infra-dev"].service_config.pdf_readability_waf.emergency_block
    )
    error_message = "The shared-IP test requires dev rate blocking at the existing threshold and emergency Count mode."
  }
}
