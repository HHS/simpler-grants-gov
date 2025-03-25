# Configures AWS SES to send additional logging to AWS Cloudwatch.
# See https://docs.aws.amazon.com/ses/latest/dg/event-destinations-manage.html
resource "aws_ses_event_destination" "logs" {
  name                   = "${local.dash_domain}-email-identity-logs"
  configuration_set_name = aws_sesv2_configuration_set.email.configuration_set_name
  enabled                = true
  matching_types = [
    "bounce",
    "click",
    "complaint",
    "delivery",
    "open",
    "reject",
    "renderingFailure",
    "send"
  ]

  cloudwatch_destination {
    dimension_name = "email_type"
    default_value  = "other"
    value_source   = "messageTag"
  }
}
