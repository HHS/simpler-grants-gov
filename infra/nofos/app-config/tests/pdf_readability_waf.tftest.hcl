mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_dev_and_prod_observe_calculator_requests" {
  command = plan

  assert {
    condition = alltrue([
      for name, config in output.environment_configs : contains(["infra-dev", "prod"], name) ? (
        config.service_config.pdf_readability_waf.rate_limit == 10 &&
        config.service_config.pdf_readability_waf.rate_action == "count" &&
        !config.service_config.pdf_readability_waf.emergency_block
      ) : config.service_config.pdf_readability_waf == null
    ])
    error_message = "Only infra-dev and prod may opt in, with both rules in Count. All other environments must remain opted out."
  }
}
