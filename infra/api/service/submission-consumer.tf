locals {
  submission_consumer_config = local.environment_config.submission_consumer_config
  enable_submission_consumer = local.submission_consumer_config.enable
  submission_consumer_name   = "${local.service_name}-submission-consumer"
}

#-------------------------------
# Submission Consumer CloudWatch Log Groups
#-------------------------------

resource "aws_cloudwatch_log_group" "submission_consumer" {
  count = local.enable_submission_consumer ? 1 : 0

  name = "service/${local.submission_consumer_name}"

  retention_in_days = 365

  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

#-------------------------------
# Submission Consumer ECS Task Definition
#-------------------------------

resource "aws_ecs_task_definition" "submission_consumer" {
  count = local.enable_submission_consumer ? 1 : 0

  family             = local.submission_consumer_name
  execution_role_arn = module.service.task_role_arn
  task_role_arn      = module.service.submission_consumer_role_arn

  container_definitions = jsonencode([
    {
      name                   = local.submission_consumer_name,
      image                  = module.service.image_url,
      memory                 = local.submission_consumer_config.memory,
      cpu                    = local.submission_consumer_config.cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = true,

      # Runs the application submission consumer. This service previously ran
      # the workflow manager ("flask workflow workflow-main"); the service /
      # role / log group names keep the workflow- prefix until a follow-up
      # rename to avoid resource replacement churn in this change.
      command = ["flask", "submission-consumer", "run"],

      healthCheck = null,

      environment = concat(module.service.environment_variables, [
        {
          name  = "TMPDIR"
          value = "/tmp"
        }
      ]),

      secrets = local.container_secrets,

      portMappings = [],

      linuxParameters = {
        capabilities = {
          add  = []
          drop = ["ALL"]
        }
        initProcessEnabled = true
        tmpfs = [{
          containerPath = "/tmp"
          size          = 1024
          mountOptions  = ["rw", "nosuid"]
        }]
      },

      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "service/${local.submission_consumer_name}",
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.submission_consumer_name
        }
      }
      systemControls = []
      volumesFrom    = []
    },
  ])

  cpu    = local.submission_consumer_config.cpu
  memory = local.submission_consumer_config.memory

  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"

  depends_on = [
    aws_cloudwatch_log_group.submission_consumer,
  ]
}

#-------------------------------
# Submission Consumer New Relic Log Forwarding
#-------------------------------

resource "aws_lambda_permission" "allow_cloudwatch_submission_consumer" {
  count = local.enable_submission_consumer ? 1 : 0

  statement_id  = "AllowCloudWatchSubmissionConsumer"
  action        = "lambda:InvokeFunction"
  function_name = module.service.nr_host_log_forwarder_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.submission_consumer[0].arn}:*"
}

resource "aws_cloudwatch_log_subscription_filter" "submission_consumer_to_newrelic" {
  count = local.enable_submission_consumer ? 1 : 0

  name            = "${local.submission_consumer_name}-to-newrelic"
  log_group_name  = aws_cloudwatch_log_group.submission_consumer[0].name
  filter_pattern  = ""
  destination_arn = module.service.nr_host_log_forwarder_arn

  depends_on = [aws_lambda_permission.allow_cloudwatch_submission_consumer]
}

#-------------------------------
# Submission Consumer ECS Service
#-------------------------------

resource "aws_ecs_service" "submission_consumer" {
  count = local.enable_submission_consumer ? 1 : 0

  name            = local.submission_consumer_name
  cluster         = module.service.cluster_arn
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.submission_consumer[0].arn
  desired_count   = local.submission_consumer_config.desired_count

  enable_execute_command = local.service_config.enable_command_execution ? true : null

  network_configuration {
    assign_public_ip = false
    subnets          = data.aws_subnets.private.ids
    security_groups  = [module.service.app_security_group_id]
  }
}
