locals {
  workflow_service_config = local.environment_config.workflow_service_config
  enable_workflow_service = local.workflow_service_config.enable
  workflow_service_name   = "${local.service_name}-workflow"
}

#-------------------------------
# Workflow CloudWatch Log Groups
#-------------------------------

resource "aws_cloudwatch_log_group" "workflow" {
  count = local.enable_workflow_service ? 1 : 0

  name = "service/${local.workflow_service_name}"

  retention_in_days = 365

  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

#-------------------------------
# Workflow ECS Task Definition
#-------------------------------

resource "aws_ecs_task_definition" "workflow" {
  count = local.enable_workflow_service ? 1 : 0

  family             = local.workflow_service_name
  execution_role_arn = module.service.task_role_arn
  task_role_arn      = module.service.workflow_service_role_arn

  container_definitions = jsonencode([
    {
      name                   = local.workflow_service_name,
      image                  = module.service.image_url,
      memory                 = local.workflow_service_config.memory,
      cpu                    = local.workflow_service_config.cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = true,

      command = ["flask", "workflow", "workflow-main"],

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
          "awslogs-group"         = "service/${local.workflow_service_name}",
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.workflow_service_name
        }
      }
      systemControls = []
      volumesFrom    = []
    },
  ])

  cpu    = local.workflow_service_config.cpu
  memory = local.workflow_service_config.memory

  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"

  depends_on = [
    aws_cloudwatch_log_group.workflow,
  ]
}

#-------------------------------
# Workflow New Relic Log Forwarding
#-------------------------------

resource "aws_lambda_permission" "allow_cloudwatch_workflow" {
  count = local.enable_workflow_service ? 1 : 0

  statement_id  = "AllowCloudWatchWorkflow"
  action        = "lambda:InvokeFunction"
  function_name = module.service.nr_host_log_forwarder_name
  principal     = "logs.amazonaws.com"
  source_arn    = "${aws_cloudwatch_log_group.workflow[0].arn}:*"
}

resource "aws_cloudwatch_log_subscription_filter" "workflow_to_newrelic" {
  count = local.enable_workflow_service ? 1 : 0

  name            = "${local.workflow_service_name}-to-newrelic"
  log_group_name  = aws_cloudwatch_log_group.workflow[0].name
  filter_pattern  = ""
  destination_arn = module.service.nr_host_log_forwarder_arn

  depends_on = [aws_lambda_permission.allow_cloudwatch_workflow]
}

#-------------------------------
# Workflow ECS Service
#-------------------------------

resource "aws_ecs_service" "workflow" {
  count = local.enable_workflow_service ? 1 : 0

  name            = local.workflow_service_name
  cluster         = module.service.cluster_arn
  launch_type     = "FARGATE"
  task_definition = aws_ecs_task_definition.workflow[0].arn
  desired_count   = local.workflow_service_config.desired_count

  enable_execute_command = local.service_config.enable_command_execution ? true : null

  network_configuration {
    assign_public_ip = false
    subnets          = data.aws_subnets.private.ids
    security_groups  = [module.service.app_security_group_id]
  }
}
