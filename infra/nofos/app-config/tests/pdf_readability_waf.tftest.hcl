mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { "simpler-grants-gov" = "123456789012" }
    }
  }
}

run "only_prod_enforces_calculator_upload_rate" {
  command = plan

  assert {
    condition = alltrue([
      for name, config in output.environment_configs : contains(["infra-dev", "prod"], name) ? (
        config.service_config.pdf_readability_waf.rate_limit == (name == "prod" ? 30 : 10) &&
        config.service_config.pdf_readability_waf.rate_action == (name == "prod" ? "block" : "count") &&
        !config.service_config.pdf_readability_waf.emergency_block
      ) : config.service_config.pdf_readability_waf == null
    ])
    error_message = "Only prod may block uploads at 30 requests per window. Dev stays in Count at 10, emergency blocking stays off, and other environments stay opted out."
  }
}
