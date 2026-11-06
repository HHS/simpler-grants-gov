# All new opportunities

This email notification contains new opportunity listings that have been published since the last successful task run.

This email notification is driven by 2 ECS tasks:

1. [Notification processor](https://github.com/HHS/simpler-grants-gov/blob/main/api/src/task/notifications/process_notification_queue.py) - Acts as listener to the `api.notification_queue` database table and processes entries (tasks) as they come in.
2. [New opportunity queue](https://github.com/HHS/simpler-grants-gov/blob/main/api/src/task/notifications/new_opportunity_notification.py) - Enqueues tasks into `api.notification_queue` to be processed by the processor.

## Schedule

Daily at 4am eastern time during daylight savings time. 5am during non-daylight savings.

## How to subscribe

### Frontend

Logged-in users can configure this notification through the simpler.grants.gov frontend application and navigating to Account > Notifications page and selecting/deselecting the **Subscribe to all new opportunities** checkbox.

### API

API users can enable this through the [User set all new opportunities](https://api.simpler.grants.gov/docs#/User%20v1%20-%20Internal%20Only/post_v1_users__user_id__all_opportunities_notifications) API endpoint.

## Local development

### End-to-end
1. Run the api `make db-migrate && db-seed-local && make run-logs`. Replace `run-logs` with `run` to run in background.
2. In a separate tab, navigate to the `api/` directory and run the notification processor: `make start-notification-processor`
3. Setup necessary data for populating email content. [WIP](https://github.com/HHS/simpler-grants-gov/issues/13193)
4. Invoke the new opportunity task: `make run-new-opportunity-notification`
5. Open <http://localhost:8025> and ensure there are emails containing the `all_new_opportunities` email tag.

### Email preview

If you only need to preview or make changes to the email template without going through the entire workflow:

1. Run `make preview-new-opportunity-email`
2. Open <http://localhost:8025> and you will find a new email with different opportunity scenarios
