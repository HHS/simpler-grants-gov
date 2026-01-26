# System Notifications

The project sends notifications as part of CI/CD workflows to notify the team about system events such as deployments and workflow failures.

## System notifications configuration

The configuration for system notifications is defined in the application's [project-config module](/infra/project-config/). The [system_notifications.tf](/infra/project-config/system_notifications.tf) file defines one or more notification channels that CI/CD workflows can send notifications to. Each channel can use a different notification type. Currently, Slack is the only supported notification type.
