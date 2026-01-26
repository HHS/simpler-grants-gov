locals {

  # Configuration for system notifications
  # used by CI/CD workflows to send notifications for deployments,
  # failed workflows, etc.
  system_notifications_config = {

    # The `channels` map defines notification channels. Each key represents a
    # notification channel, and each value is the channel's configuration.
    #
    # Each channel configuration includes the following attributes:
    #   - type: The type of notification channel (e.g., "slack" or "teams").
    #           Currently, only "slack" is supported.
    #
    # If the `type` attribute is missing or null, notifications sent to that
    # channel will be ignored (no-op).
    #
    # For channels with `type` set to "slack", the configuration must also
    # include the following attributes:
    #   - channel_id_secret_name: The name of the secret in GitHub that contains
    #                             the Slack channel ID.
    #   - slack_token_secret_name: The name of the secret in GitHub that contains
    #                              the Slack bot token.
    #
    # Example:
    # channels = {
    #   alerts = {
    #     type                    = "slack"
    #     channel_id_secret_name  = "SYSTEM_NOTIFICATIONS_SLACK_CHANNEL_ID"
    #     slack_token_secret_name = "SYSTEM_NOTIFICATIONS_SLACK_BOT_TOKEN"
    #   }
    # }
    channels = {
      workflow-failures = {
        # Uncomment if you want to send workflow failure notifications to Slack
        # "type" = "slack"
        # "channel_id_secret_name"  = "SYSTEM_NOTIFICATIONS_SLACK_CHANNEL_ID"
        # "slack_token_secret_name" = "SYSTEM_NOTIFICATIONS_SLACK_BOT_TOKEN"
      }
    }
  }
}
