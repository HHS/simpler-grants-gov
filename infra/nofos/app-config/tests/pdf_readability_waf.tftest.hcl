mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_infra_dev_tests_rate_enforcement" {
  command = plan

  assert {
    condition = alltrue([
      for name, config in output.environment_configs : name == "infra-dev" ? (
        config.service_config.pdf_readability_waf.rate_limit == 10 &&
        config.service_config.pdf_readability_waf.rate_action == "block" &&
        !config.service_config.pdf_readability_waf.emergency_block
      ) : config.service_config.pdf_readability_waf == null
    ])
    error_message = "Only infra-dev may test rate blocking, with emergency blocking off. Production and all other environments must remain opted out."
  }
}
