#===================================
# CloudTrail
#===================================

# Import existing CloudTrail trails:
# terraform import aws_cloudtrail.management_events management-events
# terraform import aws_cloudtrail.pinpoint_events pinpoint-events

# CloudTrail.5: CloudTrail trails should be integrated with CloudWatch Logs

# CloudWatch Log Group for management events trail
resource "aws_cloudwatch_log_group" "cloudtrail_management" {
  #checkov:skip=CKV_AWS_158:Existing log group - KMS encryption to be added in future update
  name              = "/aws/cloudtrail/management-events"
  retention_in_days = 365
}

# CloudWatch Log Group for pinpoint events trail
resource "aws_cloudwatch_log_group" "cloudtrail_pinpoint" {
  #checkov:skip=CKV_AWS_158:Existing log group - KMS encryption to be added in future update
  name              = "/aws/cloudtrail/pinpoint-events"
  retention_in_days = 365
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "cloudtrail-cloudwatch-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
}

# IAM policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "cloudtrail-cloudwatch-logs-policy"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailCreateLogStream"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.cloudtrail_management.arn}:*",
          "${aws_cloudwatch_log_group.cloudtrail_pinpoint.arn}:*"
        ]
      },
      {
        Sid    = "AWSCloudTrailPutLogEvents"
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents"
        ]
        Resource = [
          "${aws_cloudwatch_log_group.cloudtrail_management.arn}:*",
          "${aws_cloudwatch_log_group.cloudtrail_pinpoint.arn}:*"
        ]
      }
    ]
  })
}

# Management events trail
resource "aws_cloudtrail" "management_events" {
  #checkov:skip=CKV_AWS_252:Existing trail - SNS topic not currently configured
  name                          = "management-events"
  s3_bucket_name                = "aws-cloudtrail-logs-315341936575-e0de0810"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = "arn:aws:kms:us-east-1:315341936575:key/a90ab1e1-6284-4354-aa7c-dd65db579f03"

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_management.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  advanced_event_selector {
    name = "Management events selector"
    field_selector {
      field  = "eventCategory"
      equals = ["Management"]
    }
  }
}

# Pinpoint events trail
resource "aws_cloudtrail" "pinpoint_events" {
  #checkov:skip=CKV_AWS_252:Existing trail - SNS topic not currently configured
  name                          = "pinpoint-events"
  s3_bucket_name                = "aws-cloudtrail-logs-315341936575-c2cbd385"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = "arn:aws:kms:us-east-1:315341936575:key/b915a86b-0266-4ca7-aeb6-d1fa9884cd67"

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_pinpoint.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  advanced_event_selector {
    field_selector {
      field  = "resources.type"
      equals = ["AWS::Pinpoint::App"]
    }
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
  }

  advanced_event_selector {
    field_selector {
      field  = "resources.type"
      equals = ["AWS::SES::EmailIdentity"]
    }
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
  }

  advanced_event_selector {
    field_selector {
      field  = "resources.type"
      equals = ["AWS::SES::ConfigurationSet"]
    }
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
  }
}
