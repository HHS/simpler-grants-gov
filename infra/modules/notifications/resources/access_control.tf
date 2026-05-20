resource "aws_iam_policy" "access" {
  name        = "${var.name}-notifications-access"
  description = "Policy for sending emails via SES for ${var.name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # Permissions for sending emails via SES
      # From https://docs.aws.amazon.com/ses/latest/dg/control-user-access.html
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
        ]
        Resource = [
          var.domain_identity_arn,
          "arn:*:ses:*:*:configuration-set/*",
        ]
      }
    ]
  })
}
