mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_infra_dev_observes_pilot_requests" {
  command = plan

  assert {
    condition = alltrue([
      for name, config in output.environment_configs : name == "infra-dev" ? (
        config.service_config.pdf_readability_waf.rate_limit == 10 &&
        config.service_config.pdf_readability_waf.rate_action == "count" &&
        !config.service_config.pdf_readability_waf.emergency_block
      ) : config.service_config.pdf_readability_waf == null
    ])
    error_message = "Only infra-dev may opt in, with both rules in Count. Production and all other environments must remain opted out."
  }
}
