#===================================
# Security Hub
#===================================

# Enable Security Hub
resource "aws_securityhub_account" "main" {
  enable_default_standards  = false
  control_finding_generator = "STANDARD_CONTROL"
  auto_enable_controls      = true
}

# Enable security standards
resource "aws_securityhub_standards_subscription" "cis_1_2" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark/v/1.2.0"
}

resource "aws_securityhub_standards_subscription" "aws_foundational" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/aws-foundational-security-best-practices/v/1.0.0"
}

resource "aws_securityhub_standards_subscription" "cis_1_4" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/cis-aws-foundations-benchmark/v/1.4.0"
}

resource "aws_securityhub_standards_subscription" "nist_800_53" {
  depends_on    = [aws_securityhub_account.main]
  standards_arn = "arn:aws:securityhub:${data.aws_region.current.name}::standards/nist-800-53/v/5.0.0"
}

# Note: Finding aggregation is managed by the delegated administrator account
# This member account cannot create finding aggregators

# Enable AWS service integrations
resource "aws_securityhub_product_subscription" "guardduty" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/guardduty"
}

resource "aws_securityhub_product_subscription" "inspector" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/inspector"
}

resource "aws_securityhub_product_subscription" "access_analyzer" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/access-analyzer"
}

resource "aws_securityhub_product_subscription" "firewall_manager" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/firewall-manager"
}

resource "aws_securityhub_product_subscription" "systems_manager" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/ssm-patch-manager"
}

resource "aws_securityhub_product_subscription" "health" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/health"
}

resource "aws_securityhub_product_subscription" "macie" {
  depends_on  = [aws_securityhub_account.main]
  product_arn = "arn:aws:securityhub:${data.aws_region.current.name}::product/aws/macie"
}

# Security Hub Insights for common security issues
resource "aws_securityhub_insight" "critical_and_high_severity" {
  depends_on = [aws_securityhub_account.main]

  filters {
    severity_label {
      comparison = "EQUALS"
      value      = "CRITICAL"
    }
    severity_label {
      comparison = "EQUALS"
      value      = "HIGH"
    }
    workflow_status {
      comparison = "EQUALS"
      value      = "NEW"
    }
    record_state {
      comparison = "EQUALS"
      value      = "ACTIVE"
    }
  }

  group_by_attribute = "ResourceType"

  name = "Critical and High Severity Findings"
}

resource "aws_securityhub_insight" "failed_cis_controls" {
  depends_on = [aws_securityhub_account.main]

  filters {
    compliance_status {
      comparison = "EQUALS"
      value      = "FAILED"
    }
    generator_id {
      comparison = "PREFIX"
      value      = "arn:aws:securityhub:::ruleset/cis-aws-foundations-benchmark"
    }
    record_state {
      comparison = "EQUALS"
      value      = "ACTIVE"
    }
  }

  group_by_attribute = "ComplianceStatus"

  name = "Failed CIS Benchmark Controls"
}

resource "aws_securityhub_insight" "public_resources" {
  depends_on = [aws_securityhub_account.main]

  filters {
    resource_type {
      comparison = "EQUALS"
      value      = "AwsS3Bucket"
    }
    resource_type {
      comparison = "EQUALS"
      value      = "AwsEc2SecurityGroup"
    }
    resource_type {
      comparison = "EQUALS"
      value      = "AwsRdsDbInstance"
    }
    compliance_status {
      comparison = "EQUALS"
      value      = "FAILED"
    }
    record_state {
      comparison = "EQUALS"
      value      = "ACTIVE"
    }
  }

  group_by_attribute = "ResourceType"

  name = "Public or Exposed Resources"
}
