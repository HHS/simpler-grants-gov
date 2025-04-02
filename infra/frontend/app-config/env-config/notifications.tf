# Notifications configuration
locals {
  notifications_config = var.enable_notifications && var.domain_name != null && local.network_config.domain_config.hosted_zone != null ? {
    # Pinpoint app name.
    name = "${var.app_name}-${var.environment}"

    # Configure the name that users see in the "From" section of their inbox,
    # so that it's clearer who the email is from.
    sender_display_name = null

    # Set to the email address to be used when sending emails.
    # If enable_notifications is true, this is required.
    sender_email = "notifications@${var.domain_name}"

    # Configure the REPLY-TO email address if it should be different from the sender.
    reply_to_email = "notifications@${var.domain_name}"
  } : null
}
