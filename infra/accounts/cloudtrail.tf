#===================================
# CloudTrail
#===================================

# Import existing CloudTrail trails:
# terraform import aws_cloudtrail.management_events management-events
# terraform import aws_cloudtrail.pinpoint_events pinpoint-events

# CloudTrail.5: CloudTrail trails should be integrated with CloudWatch Logs

# CloudWatch Log Group for management events trail
resource "aws_cloudwatch_log_group" "cloudtrail_management" {
  name              = "/aws/cloudtrail/management-events"
  retention_in_days = 365
}

# CloudWatch Log Group for pinpoint events trail
resource "aws_cloudwatch_log_group" "cloudtrail_pinpoint" {
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
  name                          = "management-events"
  s3_bucket_name                = "aws-cloudtrail-logs-315341936575-e0de0810"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_management.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn
}

# Pinpoint events trail
resource "aws_cloudtrail" "pinpoint_events" {
  name                          = "pinpoint-events"
  s3_bucket_name                = "aws-cloudtrail-logs-315341936575-c2cbd385"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_pinpoint.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn
}
