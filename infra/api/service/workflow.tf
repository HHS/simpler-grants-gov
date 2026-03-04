locals {
  workflow_service_config = local.environment_config.workflow_service_config
  enable_workflow_service = local.workflow_service_config.enable
  workflow_service_name   = "${local.service_name}-workflow"

  workflow_fluent_bit_cpu    = 256
  workflow_fluent_bit_memory = 256
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

resource "aws_cloudwatch_log_group" "workflow_fluentbit" {
  count = local.enable_workflow_service ? 1 : 0

  name = "service/${local.workflow_service_name}-fluentbit"

  retention_in_days = 365

  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

#-------------------------------
# Workflow ECS Task Definition
#-------------------------------

resource "aws_ecs_task_definition" "workflow" {
  # checkov:skip=CKV_AWS_336:Fluent Bit sidecar requires a writable root filesystem
  count = local.enable_workflow_service ? 1 : 0

  family             = local.workflow_service_name
  execution_role_arn = module.service.task_role_arn
  task_role_arn      = module.service.app_service_arn

  container_definitions = jsonencode([
    {
      name                   = local.workflow_service_name,
      image                  = module.service.image_url,
      memory                 = local.workflow_service_config.memory - local.workflow_fluent_bit_memory,
      cpu                    = local.workflow_service_config.cpu - local.workflow_fluent_bit_cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = true,

      command = ["poetry", "run", "flask", "workflow", "workflow-main"],

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
        logDriver = "awsfirelens",
      }
      systemControls = []
      volumesFrom    = []
    },
    {
      name                   = "${local.workflow_service_name}-fluentbit"
      image                  = module.service.fluent_bit_image_url,
      memory                 = local.workflow_fluent_bit_memory,
      cpu                    = local.workflow_fluent_bit_cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = false,
      healthCheck            = null,
      firelensConfiguration = {
        type = "fluentbit",
        options = {
          enable-ecs-log-metadata = "true"
          config-file-type        = "file"
          config-file-value       = "/fluent-bit/etc/fluent-bit-custom.yml"
        }
      }
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = "service/${local.workflow_service_name}-fluentbit",
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.workflow_service_name
        }
      }
      secrets = [
        {
          name      = "licenseKey",
          valueFrom = "arn:aws:ssm:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:parameter/new-relic-license-key"
        }
      ]
      environment = [
        { name : "aws_region", value : data.aws_region.current.name },
        { name : "container_name", value : local.workflow_service_name },
        { name : "log_group_name", value : "service/${local.workflow_service_name}" },
      ],
    },
  ])

  cpu    = local.workflow_service_config.cpu
  memory = local.workflow_service_config.memory

  requires_compatibilities = ["FARGATE"]

  network_mode = "awsvpc"

  depends_on = [
    aws_cloudwatch_log_group.workflow,
    aws_cloudwatch_log_group.workflow_fluentbit,
  ]
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
