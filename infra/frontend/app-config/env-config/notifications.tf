# Notifications configuration
locals {
  notifications_config = var.enable_notifications ? {
    # Set to an SES-verified email address to be used when sending emails.
    # Docs: https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-email.html
    sender_email = null

    # Configure the name that users see in the "From" section of their inbox, so that it's
    # clearer who the email is from.
    sender_display_name = null

    # Configure the REPLY-TO email address if it should be different from the sender.
    # Note: Only used by the identity-provider service.
    reply_to_email = null
  } : null
}
