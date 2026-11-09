resource "aws_iam_policy" "access" {
  name        = "${var.name}-notifications-access"
  description = "Policy for sending email through SES as ${var.name}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
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
