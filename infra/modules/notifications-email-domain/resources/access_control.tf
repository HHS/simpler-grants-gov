# Allow AWS Pinpoint to send email on behalf of this email identity.
# Docs: https://docs.aws.amazon.com/pinpoint/latest/developerguide/security_iam_id-based-policy-examples.html#security_iam_resource-based-policy-examples-access-ses-identities
resource "aws_sesv2_email_identity_policy" "sender" {
  email_identity = aws_sesv2_email_identity.sender_domain.email_identity
  policy_name    = "PinpointEmail"

  policy = jsonencode(
    {
      Version = "2008-10-17",
      Statement = [
        {
          Sid    = "PinpointEmail",
          Effect = "Allow",
          Principal = {
            Service = "pinpoint.amazonaws.com"
          },
          Action   = "ses:*",
          Resource = aws_sesv2_email_identity.sender_domain.arn,
          Condition = {
            StringEquals = {
              "aws:SourceAccount" = data.aws_caller_identity.current.account_id
            },
            StringLike = {
              "aws:SourceArn" = "arn:aws:mobiletargeting:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:apps/*"
            }
          }
        }
      ]
    }
  )
}
