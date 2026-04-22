# This module creates SMS configuration set using CloudFormation and IAM policies for SMS access.
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# CloudWatch Log Group for SMS delivery receipts
resource "aws_cloudwatch_log_group" "sms_logs" {
  name              = "/aws/sms-voice/${var.name}/sms-notifications/delivery-receipts"
  retention_in_days = 30

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

# CloudFormation service role for SMS resource management
resource "aws_iam_role" "cloudformation_service_role" {
  name = "sms-cloudformation-role-${var.name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudformation.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "cloudformation_sms_permissions" {
  name = "sms-cloudformation-policy-${var.name}"
  role = aws_iam_role.cloudformation_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sms-voice:*"
        ]
        Resource = [
          "arn:aws:sms-voice:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = aws_iam_role.logging_role.arn
      }
    ]
  })
}

# IAM role for SMS Voice service to write to CloudWatch Logs
resource "aws_iam_role" "logging_role" {
  name = "sms-logging-role-${var.name}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "sms-voice.amazonaws.com"
        }
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "sms_logging_permissions" {
  name = "sms-logging-policy-${var.name}"
  role = aws_iam_role.logging_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = [
          aws_cloudwatch_log_group.sms_logs.arn,
          "${aws_cloudwatch_log_group.sms_logs.arn}:*"
        ]
      }
    ]
  })
}

# CloudFormation stack for SMS configuration set
resource "aws_cloudformation_stack" "sms_config_set" {
  # checkov:skip=CKV_AWS_124: CloudFormation stack event notifications via SNS not required; stack lifecycle is managed by Terraform and errors surface through Terraform output.
  name = "${var.name}-config-set"

  # Use a dedicated service role for CloudFormation operations
  iam_role_arn = aws_iam_role.cloudformation_service_role.arn

  timeout_in_minutes = 5
  on_failure         = "ROLLBACK"

  # Explicit dependencies to ensure IAM resources exist during both creation AND destruction
  depends_on = [
    aws_iam_role.cloudformation_service_role,
    aws_iam_role_policy.cloudformation_sms_permissions,
    aws_iam_role.logging_role,
    aws_iam_role_policy.sms_logging_permissions
  ]

  template_body = jsonencode({
    Resources = {
      SmsConfigSet = {
        Type = "AWS::SMSVOICE::ConfigurationSet"
        Properties = {
          ConfigurationSetName = "${var.name}-config-set"
          EventDestinations = [
            {
              EventDestinationName = "sms-event-destination"
              Enabled              = true
              MatchingEventTypes   = ["TEXT_ALL"]
              CloudWatchLogsDestination = {
                IamRoleArn  = aws_iam_role.logging_role.arn
                LogGroupArn = aws_cloudwatch_log_group.sms_logs.arn
              }
            }
          ]
        }
      }
    }
    Outputs = {
      ConfigSetName = {
        Value = { "Ref" : "SmsConfigSet" }
      }
      ConfigSetArn = {
        Value = {
          "Fn::Sub" : "arn:aws:sms-voice:$${AWS::Region}:$${AWS::AccountId}:configuration-set/$${SmsConfigSet}"
        }
      }
    }
  })
}

# Data source to read CloudFormation stack outputs
data "aws_cloudformation_stack" "sms_config_set_outputs" {
  name = aws_cloudformation_stack.sms_config_set.name

  depends_on = [aws_cloudformation_stack.sms_config_set]
}

# IAM policy for SMS access
resource "aws_iam_policy" "sms_access" {
  name        = "${var.name}-end-user-messaging-sms-access"
  description = "Policy for sending SMS via AWS End User Messaging for ${var.name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sms-voice:SendTextMessage"
        ]
        Resource = [
          # Allow access to the phone pool
          var.phone_pool_arn,
          # Allow access to the configuration set created by this module
          "arn:aws:sms-voice:*:${data.aws_caller_identity.current.account_id}:configuration-set/${var.name}-config-set"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sms-voice:DescribePhoneNumbers",
          "sms-voice:DescribePools",
          "sms-voice:DescribeConfigurationSets",
          "sms-voice:DescribeOptOutLists"
        ]
        Resource = [
          # Allow read-only access to phone numbers, pools, configuration sets, and opt-out lists in this account
          "arn:aws:sms-voice:*:${data.aws_caller_identity.current.account_id}:phone-number/*",
          "arn:aws:sms-voice:*:${data.aws_caller_identity.current.account_id}:pool/*",
          "arn:aws:sms-voice:*:${data.aws_caller_identity.current.account_id}:configuration-set/*",
          "arn:aws:sms-voice:*:${data.aws_caller_identity.current.account_id}:opt-out-list/*"
        ]
      }
    ]
  })
}