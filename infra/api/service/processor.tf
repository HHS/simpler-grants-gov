locals {
  processor_service_config = local.environment_config.processor_service_config
  enable_processor_service = local.processor_service_config.enable
  processor_service_name   = "${local.service_name}-processor"
}

resource "aws_cloudwatch_log_group" "processor" {
  count = local.enable_processor_service ? 1 : 0

  name = "service/${local.processor_service_name}"

  retention_in_days = 365

  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

resource "aws_iam_role_policy_attachment" "processor_external_ses_access" {
  count = local.enable_processor_service && local.external_ses_email_domain != null ? 1 : 0

  role       = module.service.processor_service_role_name
  policy_arn = aws_iam_policy.external_ses_access[0].arn
}

resource "aws_ecs_task_definition" "processor" {
  count = local.enable_processor_service ? 1 : 0

  family             = local.processor_service_name
  execution_role_arn = module.service.task_role_arn
  task_role_arn      = module.service.processor_service_role_arn

  container_definitions = jsonencode([
    {
      name                   = local.processor_service_name,
      image                  = module.service.image_url,
      memory                 = local.processor_service_config.memory,
      cpu                    = local.processor_service_config.cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = true,

      command = local.processor_service_config.command,

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
          "awslogs-group"         = "service/${local.processor_service_name}",
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.processor_service_name
        }
      }
      systemControls = []
      volumesFrom    = []
    },
  ])

  cpu    = local.processor_service_config.cpu
  memory = local.processor_service_config.memory

  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"

  depends_on = [
    aws_cloudwatch_log_group.processor,
  ]
}

resource "aws_lambda_permission" "allow_cloudwatch_processor" {
  count = local.enable_processor_service ? 1 : 0

  statement_id  = "AllowCloudWatchProcessor"
  action        = "lambda:InvokeFunction"
  function_name = module.service.nr_host_log_forwarder_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.processor[0].arn}:*"
}

resource "aws_cloudwatch_log_subscription_filter" "processor_to_newrelic" {
  count = local.enable_processor_service ? 1 : 0

  name            = "${local.processor_service_name}-to-newrelic"
  log_group_name  = aws_cloudwatch_log_group.processor[0].name
  filter_pattern  = ""
  destination_arn = module.service.nr_host_log_forwarder_arn

  depends_on = [aws_lambda_permission.allow_cloudwatch_processor]
}


# Always-on service with no load balancer: the task polls the notification queue itself.
resource "aws_ecs_service" "processor" {
  count = local.enable_processor_service ? 1 : 0

  name            = local.processor_service_name
  cluster         = module.service.cluster_arn
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.processor[0].arn
  desired_count   = local.processor_service_config.desired_count

  enable_execute_command = local.service_config.enable_command_execution ? true : null

  network_configuration {
    assign_public_ip = false
    subnets          = data.aws_subnets.private.ids
    security_groups  = [module.service.app_security_group_id]
  }
}
