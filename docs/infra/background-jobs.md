# Background jobs

The application may have background jobs that support the application. Types of background jobs include:

* Jobs that occur on a fixed schedule (e.g. every hour or every night) — This type of job is useful for ETL jobs that can't be event-driven, such as ETL jobs that ingest source files from an SFTP server or from an S3 bucket managed by another team that we have little control or influence over.
* Jobs that trigger on an event (e.g. when a file is uploaded to the document storage service). This type of job can be processed by two types of tasks:
  * Tasks that spin up on demand to process the job — This type of task is appropriate for low-frequency ETL jobs **This is the currently the only type that's supported**
  * Worker tasks that are running continuously, waiting for jobs to enter a queue that the worker then processes — This type of task is ideal for high frequency, low-latency jobs such as processing user uploads or submitting claims to an unreliable or high-latency legacy system **This functionality has not yet been implemented**

## Job configuration

Background jobs for the application are configured via the application's `env-config` module. The current infrastructure supports jobs that spin up on demand tasks when a file is uploaded to the document storage service. These are configured in the `file_upload_jobs` configuration.

## How it works

### File Upload Jobs

File upload jobs use AWS EventBridge to listen to "Object Created" events when files are uploaded to S3. An event rule is created for each job configuration, and each event rule has a single event target that targets the application's ECS cluster. The task uses the same container image that the service uses, and the task's configuration is the same as the service's configuration with the exception of the entry-point, which is specified by the job configuration's `task_command` setting, which can reference the bucket and path of the file that triggered the event by using the template values `<bucket_name>` and `<object_key>`.

### Scheduled Jobs

Scheduled jobs use AWS EventBridge to trigger AWS Step Functions jobs on a reoccurring basis. The trigger can use cron, or a rate (hourly, daily, etc) based syntax, via their `schedule_expression`. Similarly to the file upload jobs, the task uses the same container image and configuration, with the exception of the entry-point, which is specified by the job configuration's `task_command` setting. Scheduled jobs can be configured with retries, to trigger multiple jobs in a row, or to run in a certain timezone - although we do not configure any of these settings by default.
