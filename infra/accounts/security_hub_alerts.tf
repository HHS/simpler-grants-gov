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

#===================================
# Slack Integration (Optional)
#===================================

# Secrets Manager secret for Slack webhook URL
# To enable Slack notifications:
# 1. Create a Slack webhook URL in your Slack workspace
# 2. Store it in AWS Secrets Manager with this name
# 3. Uncomment the Lambda function and subscription below
#
# aws secretsmanager create-secret \
#   --name security-hub-slack-webhook \
#   --secret-string '{"webhook_url":"https://hooks.slack.com/services/YOUR/WEBHOOK/URL"}' \
#   --region us-east-1

data "aws_secretsmanager_secret" "slack_webhook" {
  name = "security-hub-slack-webhook"
}

data "aws_secretsmanager_secret_version" "slack_webhook" {
  secret_id = data.aws_secretsmanager_secret.slack_webhook.id
}

# IAM role for Lambda function
resource "aws_iam_role" "security_hub_slack_lambda" {
  name = "security-hub-slack-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.security_hub_slack_lambda.name
}

resource "aws_iam_role_policy" "lambda_secrets" {
  name = "secrets-access"
  role = aws_iam_role.security_hub_slack_lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Effect = "Allow"
        Resource = data.aws_secretsmanager_secret.slack_webhook.arn
      }
    ]
  })
}

# Lambda function to post to Slack
resource "aws_lambda_function" "security_hub_slack" {
  filename         = "${path.module}/lambda/security_hub_slack.zip"
  function_name    = "security-hub-slack-notifier"
  role             = aws_iam_role.security_hub_slack_lambda.arn
  handler          = "security_hub_slack.handler"
  source_code_hash = filebase64sha256("${path.module}/lambda/security_hub_slack.zip")
  runtime          = "python3.11"
  timeout          = 30

  environment {
    variables = {
      SLACK_WEBHOOK_SECRET_NAME = data.aws_secretsmanager_secret.slack_webhook.name
    }
  }
}

resource "aws_lambda_permission" "allow_sns" {
  statement_id  = "AllowExecutionFromSNS"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_hub_slack.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.security_hub_findings.arn
}

# SNS subscription to trigger Lambda
resource "aws_sns_topic_subscription" "security_hub_findings_slack" {
  topic_arn = aws_sns_topic.security_hub_findings.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.security_hub_slack.arn
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
