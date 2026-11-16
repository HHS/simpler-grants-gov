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
1. Run the api `make db-migrate && make db-seed-local && make run-logs`. Replace `run-logs` with `run` to run in background.
2. In a separate tab, navigate to the `api/` directory and run the notification processor: `make start-notification-processor`
3. Setup the data for the email: `make seed-new-opportunity-notification`. See [Seeding data](#seeding-data) for options.
4. Invoke the new opportunity task: `make run-new-opportunity-notification`
5. Open <http://localhost:8025> and ensure there are emails containing the `all_new_opportunities` email tag.

To send another email, repeat steps 3 and 4. Each run of the task only picks up opportunities created since the last successful run.

### Seeding data

`make seed-new-opportunity-notification` does two things:

1. Subscribes local users to the notification by setting their `all_new_opportunities` preference in `api.user_notification_preferences`. By default it subscribes `no_org_user` from `make db-seed-local`.
2. Creates new opportunities that the next task run will include, alternating posted and forecasted. By default it creates 3.

An opportunity is included in the email when it:

- Is not a draft and has a current summary with a status of `forecasted` or `posted`
- Belongs to an agency where `is_test_agency` is false
- Had its first `forecasted` or `posted` `opportunity_version` created since the last successful task run, or in the past 24 hours if the task has never run successfully

Options are passed through `args`:

| Option | Description | Example |
| --- | --- | --- |
| `--user`, `-u` | Mock OAuth login of a user to subscribe. Can be passed multiple times. Any user you have logged in as locally works. | `make seed-new-opportunity-notification args="-u no_org_user -u one_org_user"` |
| `--opportunity-count`, `-n` | Number of opportunities to create. Pass `0` to only subscribe users. | `make seed-new-opportunity-notification args="-n 10"` |

Users are not subscribed by default, so only users subscribed by this command or through the frontend get an email.

### Email preview

If you only need to preview or make changes to the email template without going through the entire workflow:

1. Run `make preview-new-opportunity-email`
2. Open <http://localhost:8025> and you will find a new email with different opportunity scenarios
