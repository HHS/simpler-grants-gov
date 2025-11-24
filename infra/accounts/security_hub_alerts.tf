#===================================
# Security Hub Alerts
#===================================

# SNS Topic for Security Hub findings
resource "aws_sns_topic" "security_hub_findings" {
  name = "security-hub-findings"
  # checkov:skip=CKV_AWS_26:SNS encryption for alerts is unnecessary
}

# Email subscription for Security Hub findings
resource "aws_sns_topic_subscription" "security_hub_findings_email" {
  topic_arn = aws_sns_topic.security_hub_findings.arn
  protocol  = "email"
  endpoint  = "grantsalerts@navapbc.com"
}

# EventBridge rule for CRITICAL severity findings
resource "aws_cloudwatch_event_rule" "security_hub_critical_findings" {
  name        = "security-hub-critical-findings"
  description = "Capture CRITICAL severity findings from Security Hub"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["CRITICAL"]
        }
        Workflow = {
          Status = ["NEW"]
        }
        RecordState = ["ACTIVE"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "security_hub_critical_findings_sns" {
  rule      = aws_cloudwatch_event_rule.security_hub_critical_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_hub_findings.arn

  input_transformer {
    input_paths = {
      title       = "$.detail.findings[0].Title"
      description = "$.detail.findings[0].Description"
      severity    = "$.detail.findings[0].Severity.Label"
      resource    = "$.detail.findings[0].Resources[0].Id"
      account     = "$.detail.findings[0].AwsAccountId"
      region      = "$.detail.findings[0].Resources[0].Region"
      compliance  = "$.detail.findings[0].Compliance.Status"
      remediation = "$.detail.findings[0].Remediation.Recommendation.Text"
    }

    input_template = <<EOF
"🚨 *CRITICAL Security Finding*

*Title:* <title>
*Severity:* <severity>
*Compliance Status:* <compliance>

*Description:*
<description>

*Affected Resource:*
<resource>

*Account:* <account>
*Region:* <region>

*Remediation:*
<remediation>

View in AWS Console: https://console.aws.amazon.com/securityhub/home?region=<region>#/findings"
EOF
  }
}

# EventBridge rule for HIGH severity findings
resource "aws_cloudwatch_event_rule" "security_hub_high_findings" {
  name        = "security-hub-high-findings"
  description = "Capture HIGH severity findings from Security Hub"

  event_pattern = jsonencode({
    source      = ["aws.securityhub"]
    detail-type = ["Security Hub Findings - Imported"]
    detail = {
      findings = {
        Severity = {
          Label = ["HIGH"]
        }
        Workflow = {
          Status = ["NEW"]
        }
        RecordState = ["ACTIVE"]
      }
    }
  })
}

resource "aws_cloudwatch_event_target" "security_hub_high_findings_sns" {
  rule      = aws_cloudwatch_event_rule.security_hub_high_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_hub_findings.arn

  input_transformer {
    input_paths = {
      title       = "$.detail.findings[0].Title"
      description = "$.detail.findings[0].Description"
      severity    = "$.detail.findings[0].Severity.Label"
      resource    = "$.detail.findings[0].Resources[0].Id"
      account     = "$.detail.findings[0].AwsAccountId"
      region      = "$.detail.findings[0].Resources[0].Region"
      compliance  = "$.detail.findings[0].Compliance.Status"
      remediation = "$.detail.findings[0].Remediation.Recommendation.Text"
    }

    input_template = <<EOF
"⚠️ *HIGH Security Finding*

*Title:* <title>
*Severity:* <severity>
*Compliance Status:* <compliance>

*Description:*
<description>

*Affected Resource:*
<resource>

*Account:* <account>
*Region:* <region>

*Remediation:*
<remediation>

View in AWS Console: https://console.aws.amazon.com/securityhub/home?region=<region>#/findings"
EOF
  }
}

# SNS topic policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "security_hub_findings" {
  arn = aws_sns_topic.security_hub_findings.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowEventBridgePublish"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_hub_findings.arn
      }
    ]
  })
}
