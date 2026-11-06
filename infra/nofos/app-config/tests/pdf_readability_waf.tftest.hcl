mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_dev_enforces_calculator_rate_during_shared_ip_test" {
  command = plan

  assert {
    condition = alltrue([
      for name, config in output.environment_configs : contains(["infra-dev", "prod"], name) ? (
        config.service_config.pdf_readability_waf.rate_limit == 10 &&
        config.service_config.pdf_readability_waf.rate_action == (name == "infra-dev" ? "block" : "count") &&
        !config.service_config.pdf_readability_waf.emergency_block
      ) : config.service_config.pdf_readability_waf == null
    ])
    error_message = "During the shared-IP test, only infra-dev enforces rate limits. Both emergency rules and the production rate rule stay in Count."
  }
}
