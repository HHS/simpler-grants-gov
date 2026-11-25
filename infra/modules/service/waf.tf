# Cover the Readability Checker and its legacy redirect. Signed-in and signed-out
# users upload to the same URL, so these rules apply to both. The retired
# /nofos/readability* paths only redirect and need no coverage. Use anchored
# alternatives without captures for AWS WAF regex compatibility.
locals {
  pdf_readability_managed_priority_offset = var.pdf_readability_waf == null ? 0 : 2
  # Bot rules sit before managed groups, whose Allow overrides would otherwise terminate evaluation.
  bot_priority_base       = local.pdf_readability_managed_priority_offset
  managed_priority_offset = local.bot_priority_base + (var.bot_protection_waf == null ? 0 : 2)
  static_asset_uri_regex  = "^/_next/|\\.css$|\\.js$|\\.map$|\\.svg$|\\.png$|\\.jpe?g$|\\.gif$|\\.ico$|\\.webp$|\\.woff2?$|\\.txt$|\\.xml$"
}

resource "aws_wafv2_web_acl" "waf" {
  count = local.has_public_alb ? 1 : 0
  name  = "${var.service_name}-wafv2-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = var.waf_metric_name == null ? "WAF_Common_Protections" : var.waf_metric_name
    sampled_requests_enabled   = true
  }

  # These controls must precede terminating Allow overrides in managed groups.
  # Null leaves every existing managed priority unchanged for other services.
  dynamic "rule" {
    for_each = var.pdf_readability_waf == null ? [] : [var.pdf_readability_waf]
    content {
      name     = "NOFO-PDFReadability-EmergencyBlock"
      priority = 0

      action {
        dynamic "block" {
          for_each = rule.value.emergency_block ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = rule.value.emergency_block ? [] : [1]
          content {}
        }
      }

      statement {
        and_statement {
          statement {
            regex_match_statement {
              regex_string = "^/readability-checker/?$|^/readability/?$"
              field_to_match {
                uri_path {}
              }
              text_transformation {
                priority = 0
                type     = "NONE"
              }
            }
          }
          statement {
            regex_match_statement {
              regex_string = "^(GET|POST)$"
              field_to_match {
                method {}
              }
              text_transformation {
                priority = 0
                type     = "NONE"
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "NOFO-PDFReadability-EmergencyBlock"
        sampled_requests_enabled   = false
      }
    }
  }

  dynamic "rule" {
    for_each = var.pdf_readability_waf == null ? [] : [var.pdf_readability_waf]
    content {
      name     = "NOFO-PDFReadability-UploadRate"
      priority = 1

      action {
        dynamic "block" {
          for_each = rule.value.rate_action == "block" ? [1] : []
          content {
            custom_response {
              response_code = 429
            }
          }
        }
        dynamic "count" {
          for_each = rule.value.rate_action == "count" ? [1] : []
          content {}
        }
      }

      statement {
        rate_based_statement {
          aggregate_key_type    = "IP"
          limit                 = rule.value.rate_limit
          evaluation_window_sec = 300

          scope_down_statement {
            and_statement {
              statement {
                regex_match_statement {
                  regex_string = "^/readability-checker/?$|^/readability/?$"
                  field_to_match {
                    uri_path {}
                  }
                  text_transformation {
                    priority = 0
                    type     = "NONE"
                  }
                }
              }
              statement {
                byte_match_statement {
                  positional_constraint = "EXACTLY"
                  search_string         = "POST"
                  field_to_match {
                    method {}
                  }
                  text_transformation {
                    priority = 0
                    type     = "NONE"
                  }
                }
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "NOFO-PDFReadability-UploadRate"
        sampled_requests_enabled   = false
      }
    }
  }

  # Per-IP cap on page (non-static) requests; returns 429 so well-behaved crawlers back off.
  dynamic "rule" {
    for_each = var.bot_protection_waf == null ? [] : [var.bot_protection_waf]
    content {
      name     = "Bot-PageRateLimitPerIP"
      priority = local.bot_priority_base

      action {
        dynamic "block" {
          for_each = rule.value.action == "block" ? [1] : []
          content {
            custom_response {
              response_code = 429
            }
          }
        }
        dynamic "count" {
          for_each = rule.value.action == "count" ? [1] : []
          content {}
        }
      }

      statement {
        rate_based_statement {
          aggregate_key_type    = "IP"
          limit                 = rule.value.page_rate_limit_per_ip
          evaluation_window_sec = 60

          scope_down_statement {
            not_statement {
              statement {
                regex_match_statement {
                  regex_string = local.static_asset_uri_regex
                  field_to_match {
                    uri_path {}
                  }
                  text_transformation {
                    priority = 0
                    type     = "LOWERCASE"
                  }
                }
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "Bot-PageRateLimitPerIP"
        sampled_requests_enabled   = true
      }
    }
  }

  # Site-wide surge on SSR opportunity pages (distributed scrapers): challenge GETs; browsers pass silently.
  dynamic "rule" {
    for_each = var.bot_protection_waf == null ? [] : [var.bot_protection_waf]
    content {
      name     = "Bot-OpportunitySurgeChallenge"
      priority = local.bot_priority_base + 1

      action {
        dynamic "challenge" {
          for_each = rule.value.action == "block" ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = rule.value.action == "count" ? [1] : []
          content {}
        }
      }

      statement {
        rate_based_statement {
          aggregate_key_type    = "CONSTANT"
          limit                 = rule.value.opportunity_surge_limit
          evaluation_window_sec = 60

          scope_down_statement {
            and_statement {
              statement {
                byte_match_statement {
                  positional_constraint = "STARTS_WITH"
                  search_string         = "/opportunity/"
                  field_to_match {
                    uri_path {}
                  }
                  text_transformation {
                    priority = 0
                    type     = "LOWERCASE"
                  }
                }
              }
              statement {
                byte_match_statement {
                  positional_constraint = "EXACTLY"
                  search_string         = "GET"
                  field_to_match {
                    method {}
                  }
                  text_transformation {
                    priority = 0
                    type     = "NONE"
                  }
                }
              }
            }
          }
        }
      }

      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "Bot-OpportunitySurgeChallenge"
        sampled_requests_enabled   = true
      }
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 0 + local.managed_priority_offset
    override_action {
      none {}
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        rule_action_override {
          action_to_use {
            allow {}
          }

          name = "SizeRestrictions_BODY"
        }

        rule_action_override {
          action_to_use {
            allow {}
          }

          name = "NoUserAgent_HEADER"
        }

        rule_action_override {
          action_to_use {
            count {}
          }

          name = "SizeRestrictions_QUERYSTRING"
        }

        dynamic "rule_action_override" {
          for_each = startswith(var.service_name, "api-") ? [1] : []
          content {
            action_to_use {
              count {}
            }
            name = "CrossSiteScripting_BODY"
          }
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesCommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesLinuxRuleSet"
    priority = 1 + local.managed_priority_offset
    override_action {
      none {
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesLinuxRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesLinuxRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesAmazonIpReputationList"
    priority = 2 + local.managed_priority_offset
    override_action {
      none {
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAmazonIpReputationList"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesAmazonIpReputationList"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesAnonymousIpList"
    priority = 3 + local.managed_priority_offset
    override_action {
      none {
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesAnonymousIpList"
        vendor_name = "AWS"

        rule_action_override {
          action_to_use {
            allow {}
          }

          name = "HostingProviderIPList"
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesAnonymousIpList"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
    priority = 4 + local.managed_priority_offset
    override_action {
      none {
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesKnownBadInputsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesUnixRuleSet"
    priority = 5 + local.managed_priority_offset
    override_action {
      none {
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesUnixRuleSet"
        vendor_name = "AWS"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesUnixRuleSet"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWS-AWSManagedRulesWindowsRuleSet"
    priority = 6 + local.managed_priority_offset
    override_action {
      none {
      }
    }
    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesWindowsRuleSet"
        vendor_name = "AWS"
        rule_action_override {
          action_to_use {
            allow {}
          }

          name = "WindowsShellCommands_BODY"
        }
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWS-AWSManagedRulesWindowsRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # checkov:skip=CKV2_AWS_31:TODO: https://github.com/HHS/simpler-grants-gov/issues/2367
}


resource "aws_cloudwatch_log_group" "WafWebAclLoggroup" {
  # checkov:skip=CKV_AWS_158: The KMS key triggered an operation error
  count             = local.has_public_alb ? 1 : 0
  name              = "aws-waf-logs-wafv2-web-acl-${var.service_name}"
  retention_in_days = 1827 # 5 years
}

# Associate WAF with the cloudwatch logging group
resource "aws_wafv2_web_acl_logging_configuration" "WafWebAclLogging" {
  count                   = local.has_public_alb ? 1 : 0
  log_destination_configs = [aws_cloudwatch_log_group.WafWebAclLoggroup[0].arn]
  resource_arn            = aws_wafv2_web_acl.waf[0].arn
  depends_on = [
    aws_wafv2_web_acl.waf[0],
    aws_cloudwatch_log_group.WafWebAclLoggroup[0]
  ]
}

# Policy from terraform docs
# Associate WAF with load balancer
resource "aws_wafv2_web_acl_association" "WafWebAclAssociation" {
  count        = local.has_public_alb ? 1 : 0
  resource_arn = aws_lb.alb[0].arn
  web_acl_arn  = aws_wafv2_web_acl.waf[0].arn
  depends_on = [
    aws_wafv2_web_acl.waf[0],
    aws_cloudwatch_log_group.WafWebAclLoggroup[0]
  ]
}
