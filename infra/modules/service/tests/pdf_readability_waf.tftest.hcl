mock_provider "aws" {
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }
  # network/data module returns ids[0] — mock must return a non-empty list
  mock_data "aws_security_groups" {
    defaults = {
      ids = ["sg-0123456789abcdef0"]
    }
  }
}
mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { value = "mock-value" }
    }
  }
}

# Required variables shared across all runs
variables {
  aws_services_security_group_id = "sg-0123456789abcdef0"
  image_tag                      = "v1.0.0"
  image_repository_url           = "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app"
  network_name                   = "test"
  project_name                   = "simpler-grants-gov"
  service_name                   = "nofos-infra-dev"
}


run "default_preserves_existing_services" {
  command = plan

  variables {
    service_name = "api-dev"
  }

  assert {
    condition     = length(aws_wafv2_web_acl.waf[0].rule) == 7
    error_message = "Other services must retain exactly the seven existing rules."
  }
  assert {
    condition     = sort([for r in aws_wafv2_web_acl.waf[0].rule : tostring(r.priority)]) == tolist(["0", "1", "2", "3", "4", "5", "6"])
    error_message = "Default managed priorities must remain unchanged."
  }
}

run "dev_observation_rules_precede_managed_allows" {
  command = plan

  variables {
    pdf_readability_waf = {}
  }

  assert {
    condition     = length(aws_wafv2_web_acl.waf[0].rule) == 9
    error_message = "Opting in must add only the two pilot rules."
  }
  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule :
      startswith(r.name, "NOFO-PDFReadability-") ? length(r.action[0].count) == 1 && length(r.action[0].block) == 0 : r.priority >= 2
    ])
    error_message = "Pilot rules must start in Count; all managed groups must follow them."
  }
  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule :
      r.name == "NOFO-PDFReadability-EmergencyBlock" ? r.priority == 0 : r.name == "NOFO-PDFReadability-UploadRate" ? r.priority == 1 : true
    ])
    error_message = "Emergency block must be first and rate limiting second."
  }
  assert {
    condition     = sort([for r in aws_wafv2_web_acl.waf[0].rule : tostring(r.priority)]) == tolist(["0", "1", "2", "3", "4", "5", "6", "7", "8"])
    error_message = "Rule priorities must remain unique."
  }
  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule :
      startswith(r.name, "NOFO-PDFReadability-") ? r.visibility_config[0].cloudwatch_metrics_enabled && !r.visibility_config[0].sampled_requests_enabled : true
    ])
    error_message = "Pilot rules must expose counters without enabling new sampled requests."
  }
  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-UploadRate" ? (
        r.statement[0].rate_based_statement[0].aggregate_key_type == "IP" &&
        length(r.statement[0].rate_based_statement[0].forwarded_ip_config) == 0 &&
        r.statement[0].rate_based_statement[0].evaluation_window_sec == 300 &&
        r.statement[0].rate_based_statement[0].limit == 10
      ) : true
    ])
    error_message = "Default rate rule must use the WAF-observed IP, ten requests, and a five-minute window."
  }
}

run "explicit_blocking_and_custom_rate" {
  command = plan

  variables {
    pdf_readability_waf = {
      rate_limit      = 25
      rate_action     = "block"
      emergency_block = true
    }
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule :
      startswith(r.name, "NOFO-PDFReadability-") ? length(r.action[0].block) == 1 && length(r.action[0].count) == 0 : true
    ])
    error_message = "Explicit activation must switch each pilot rule from Count to Block."
  }
  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-UploadRate" ? (
        r.statement[0].rate_based_statement[0].limit == 25 &&
        r.action[0].block[0].custom_response[0].response_code == 429
      ) : true
    ])
    error_message = "Configured rate must be honored and throttled requests must receive 429."
  }
}

run "rate_block_does_not_activate_emergency_block" {
  command = plan

  variables {
    pdf_readability_waf = { rate_action = "block" }
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule :
      r.name == "NOFO-PDFReadability-EmergencyBlock" ? length(r.action[0].count) == 1 :
      r.name == "NOFO-PDFReadability-UploadRate" ? length(r.action[0].block) == 1 : true
    ])
    error_message = "Rate enforcement and the emergency block must be independently controlled."
  }
}

run "emergency_block_does_not_activate_rate_block" {
  command = plan

  variables {
    pdf_readability_waf = { emergency_block = true }
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule :
      r.name == "NOFO-PDFReadability-EmergencyBlock" ? length(r.action[0].block) == 1 :
      r.name == "NOFO-PDFReadability-UploadRate" ? length(r.action[0].count) == 1 : true
    ])
    error_message = "Emergency activation must not alter the configured rate action."
  }
}

run "route_and_method_scope" {
  command = plan

  variables {
    pdf_readability_waf = {}
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-EmergencyBlock" ? alltrue([
        for s in r.statement[0].and_statement[0].statement : length(s.regex_match_statement) == 0 ? true : length(s.regex_match_statement[0].field_to_match[0].uri_path) == 0 ? true : (
          alltrue([for path in ["/readability", "/readability/"] : can(regex(s.regex_match_statement[0].regex_string, path))]) &&
          alltrue([for path in ["/", "/health", "/nofos", "/readability/extra", "/readability-other", "/Readability", "/readability//"] : !can(regex(s.regex_match_statement[0].regex_string, path))]) &&
          one(s.regex_match_statement[0].text_transformation).type == "NONE"
        )
      ]) : true
    ])
    error_message = "NOFO-PDFReadability-EmergencyBlock must match both exact route forms and exclude other Builder paths."
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-UploadRate" ? alltrue([
        for s in r.statement[0].rate_based_statement[0].scope_down_statement[0].and_statement[0].statement : length(s.regex_match_statement) == 0 ? true : length(s.regex_match_statement[0].field_to_match[0].uri_path) == 0 ? true : (
          alltrue([for path in ["/readability", "/readability/"] : can(regex(s.regex_match_statement[0].regex_string, path))]) &&
          alltrue([for path in ["/", "/health", "/nofos", "/readability/extra", "/readability-other", "/Readability", "/readability//"] : !can(regex(s.regex_match_statement[0].regex_string, path))]) &&
          one(s.regex_match_statement[0].text_transformation).type == "NONE"
        )
      ]) : true
    ])
    error_message = "NOFO-PDFReadability-UploadRate must match both exact route forms and exclude other Builder paths."
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-EmergencyBlock" ? alltrue([
        for s in r.statement[0].and_statement[0].statement : length(s.regex_match_statement[0].field_to_match[0].method) == 0 ? true : (
          alltrue([for method in ["GET", "POST"] : can(regex(s.regex_match_statement[0].regex_string, method))]) &&
          alltrue([for method in ["HEAD", "PUT", "DELETE", "POSTX"] : !can(regex(s.regex_match_statement[0].regex_string, method))])
        )
      ]) : true
    ])
    error_message = "Emergency block must cover GET and POST only."
  }
  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-UploadRate" ? alltrue([
        for s in r.statement[0].rate_based_statement[0].scope_down_statement[0].and_statement[0].statement : length(s.byte_match_statement) == 0 ? true : (
          s.byte_match_statement[0].search_string == "POST" &&
          s.byte_match_statement[0].positional_constraint == "EXACTLY" &&
          length(s.byte_match_statement[0].field_to_match[0].method) == 1
        )
      ]) : true
    ])
    error_message = "Upload rate limiting must apply only to POST, never report GETs."
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-EmergencyBlock" ? (
        length(r.statement[0].and_statement[0].statement) == 2 &&
        length([for s in r.statement[0].and_statement[0].statement : s if length(s.regex_match_statement) == 0 ? false : length(s.regex_match_statement[0].field_to_match[0].uri_path) == 1]) == 1
      ) : true
    ])
    error_message = "NOFO-PDFReadability-EmergencyBlock must have exactly two AND predicates, including exactly one URI matcher."
  }

  assert {
    condition = alltrue([
      for r in aws_wafv2_web_acl.waf[0].rule : r.name == "NOFO-PDFReadability-UploadRate" ? (
        length(r.statement[0].rate_based_statement[0].scope_down_statement[0].and_statement[0].statement) == 2 &&
        length([for s in r.statement[0].rate_based_statement[0].scope_down_statement[0].and_statement[0].statement : s if length(s.regex_match_statement) == 0 ? false : length(s.regex_match_statement[0].field_to_match[0].uri_path) == 1]) == 1
      ) : true
    ])
    error_message = "NOFO-PDFReadability-UploadRate must have exactly two AND predicates, including exactly one URI matcher."
  }
}

run "workspace_prefixed_nofo_is_supported" {
  command = plan
  variables {
    service_name        = "preview-nofos-infra-dev"
    pdf_readability_waf = {}
  }
  assert {
    condition     = length(aws_wafv2_web_acl.waf[0].rule) == 9
    error_message = "Workspace-prefixed NOFO services must be able to opt in."
  }
}

run "reject_non_nofo_opt_in" {
  command = plan
  variables {
    service_name        = "api-dev"
    pdf_readability_waf = {}
  }
  expect_failures = [var.pdf_readability_waf]
}

run "reject_without_load_balancer" {
  command = plan
  variables {
    enable_load_balancer = false
    pdf_readability_waf  = {}
  }
  expect_failures = [var.pdf_readability_waf]
}

run "reject_rate_below_aws_minimum" {
  command = plan
  variables {
    pdf_readability_waf = { rate_limit = 9 }
  }
  expect_failures = [var.pdf_readability_waf]
}

run "reject_fractional_rate" {
  command = plan
  variables {
    pdf_readability_waf = { rate_limit = 10.5 }
  }
  expect_failures = [var.pdf_readability_waf]
}

run "reject_rate_above_aws_maximum" {
  command = plan
  variables {
    pdf_readability_waf = { rate_limit = 2000000001 }
  }
  expect_failures = [var.pdf_readability_waf]
}

run "reject_allow_action" {
  command = plan
  variables {
    pdf_readability_waf = { rate_action = "allow" }
  }
  expect_failures = [var.pdf_readability_waf]
}
