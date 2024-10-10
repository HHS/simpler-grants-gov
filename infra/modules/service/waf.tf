resource "aws_wafv2_web_acl" "waf" {
  count = var.enable_load_balancer ? 1 : 0
  name  = "${var.service_name}-wafv2-web-acl"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "WAF_Common_Protections"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWS-AWSManagedRulesCommonRuleSet"
    priority = 0
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
    priority = 1
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
    priority = 2
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
    priority = 3
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
    priority = 4
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
    priority = 5
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
    priority = 6
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
  count             = var.enable_load_balancer ? 1 : 0
  name              = "aws-waf-logs-wafv2-web-acl-${var.service_name}"
  retention_in_days = 1827 # 5 years
}

# Associate WAF with the cloudwatch logging group
resource "aws_wafv2_web_acl_logging_configuration" "WafWebAclLogging" {
  count                   = var.enable_load_balancer ? 1 : 0
  log_destination_configs = [aws_cloudwatch_log_group.WafWebAclLoggroup[0].arn]
  resource_arn            = aws_wafv2_web_acl.waf[0].arn
  depends_on = [
    aws_wafv2_web_acl.waf[0],
    aws_cloudwatch_log_group.WafWebAclLoggroup[0]
  ]
}

resource "aws_cloudwatch_log_resource_policy" "WafWebAclLoggingPolicy" {
  count           = var.enable_load_balancer ? 1 : 0
  policy_document = data.aws_iam_policy_document.WafWebAclLoggingDoc[0].json
  policy_name     = "service-${var.service_name}-webacl-policy"
}

# Policy from terraform docs
data "aws_iam_policy_document" "WafWebAclLoggingDoc" {
  count = var.enable_load_balancer ? 1 : 0
  statement {
    effect = "Allow"
    principals {
      identifiers = ["delivery.logs.amazonaws.com"]
      type        = "Service"
    }
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.WafWebAclLoggroup[0].arn}:*"]
    condition {
      test     = "ArnLike"
      values   = ["arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"]
      variable = "aws:SourceArn"
    }
    condition {
      test     = "StringEquals"
      values   = [tostring(data.aws_caller_identity.current.account_id)]
      variable = "aws:SourceAccount"
    }
  }
}

# Associate WAF with load balancer
resource "aws_wafv2_web_acl_association" "WafWebAclAssociation" {
  count        = var.enable_load_balancer ? 1 : 0
  resource_arn = aws_lb.alb[0].arn
  web_acl_arn  = aws_wafv2_web_acl.waf[0].arn
  depends_on = [
    aws_wafv2_web_acl.waf[0],
    aws_cloudwatch_log_group.WafWebAclLoggroup[0]
  ]
}
