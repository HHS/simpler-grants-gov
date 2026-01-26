data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  alb_name                = var.service_name
  cluster_name            = var.service_name
  container_name          = var.service_name
  log_group_name          = "service/${var.service_name}"
  log_stream_prefix       = var.service_name
  task_executor_role_name = "${var.service_name}-task-executor"
  image_url               = "${var.image_repository_url}:${var.image_tag}"

  base_environment_variables = [
    { name : "PORT", value : tostring(var.container_port) },
    { name : "AWS_DEFAULT_REGION", value : data.aws_region.current.name },
    { name : "AWS_REGION", value : data.aws_region.current.name },
    { name : "IMAGE_TAG", value : var.image_tag },
  ]
  db_environment_variables = var.db_vars == null ? [] : [
    { name : "DB_HOST", value : var.db_vars.connection_info.host },
    { name : "DB_PORT", value : var.db_vars.connection_info.port },
    { name : "DB_USER", value : var.db_vars.connection_info.user },
    { name : "DB_NAME", value : var.db_vars.connection_info.db_name },
    { name : "DB_SCHEMA", value : var.db_vars.connection_info.schema_name },
  ]
  environment_variables = concat(
    local.base_environment_variables,
    local.db_environment_variables,
    [
      for name, value in var.extra_environment_variables :
      { name : name, value : value }
    ],
  )

  ephemeral_write_volumes_with_name = [for container_path in var.ephemeral_write_volumes : {
    container_path : container_path,
    # Derive the volume name from the destination path for simplicity, though
    # note the name does have a limit of 255 characters.
    #
    # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specify-bind-mount-config.html
    volume_name : replace(trim(container_path, "/"), "/", "_"),
  }]
  ephemeral_write_volume_configs = [for e in local.ephemeral_write_volumes_with_name : {
    mount_point : {
      "sourceVolume" : e.volume_name
      "containerPath" : e.container_path,
      "readOnly" : false
    },
    volume : { "name" : e.volume_name }
  }]
}

#-------------------
# Service Execution
#-------------------

resource "aws_ecs_service" "app" {
  name                   = var.service_name
  cluster                = aws_ecs_cluster.cluster.arn
  launch_type            = "FARGATE"
  task_definition        = aws_ecs_task_definition.app.arn
  desired_count          = var.desired_instance_count
  enable_execute_command = var.enable_command_execution ? true : null

  # Allow changes to the desired_count without differences in terraform plan.
  # This allows autoscaling to manage the desired count for us.
  lifecycle {
    ignore_changes = [desired_count]
  }

  network_configuration {
    assign_public_ip = false
    subnets          = module.network.private_subnet_ids
    security_groups  = [aws_security_group.app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.app_tg.arn
    container_name   = var.service_name
    container_port   = var.container_port
  }
}

resource "aws_ecs_task_definition" "app" {
  family             = var.service_name
  execution_role_arn = aws_iam_role.task_executor.arn
  task_role_arn      = aws_iam_role.app_service.arn

  container_definitions = jsonencode([
    {
      name                   = local.container_name,
      image                  = local.image_url,
      memory                 = var.memory,
      cpu                    = var.cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = !var.enable_command_execution,

      # Need to define all parameters in the healthCheck block even if we want
      # to use AWS's defaults, otherwise the terraform plan will show a diff
      # that will force a replacement of the task definition
      healthCheck = {
        interval = 30,
        retries  = 3,
        timeout  = 5,
        # If a `healthcheck` executable is available in the container's $PATH,
        # use that, otherwise fall back the first available of: wget, curl, or
        # bash.
        command = ["CMD-SHELL",
          "([ -x \"$(command -v healthcheck)\" ] && healthcheck) || ([ -x \"$(command -v wget)\" ] && wget --quiet --output-document=/dev/null http://127.0.0.1:$PORT/health) || ([ -x \"$(command -v curl)\" ] && curl --fail --silent http://localhost:$PORT/health > /dev/null) || ([ -x \"$(command -v bash)\" ] && bash -c \"exec 3<>/dev/tcp/127.0.0.1/$PORT;echo -e 'GET /health HTTP/1.1\\r\\nHost: http://localhost\\r\\nConnection: close\\r\\n\\r\\n' >&3;grep -q '^HTTP/.* 200 OK' <&3\") || exit 1"
        ]
      },
      environment = local.environment_variables,
      secrets     = var.secrets,
      portMappings = [
        {
          containerPort = var.container_port,
          hostPort      = var.container_port,
          protocol      = "tcp"
        }
      ],
      linuxParameters = {
        capabilities = {
          add  = []
          drop = ["ALL"]
        },
        initProcessEnabled = true
      },
      logConfiguration = {
        logDriver = "awslogs",
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.service_logs.name,
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.log_stream_prefix
        }
      },
      mountPoints    = local.ephemeral_write_volume_configs[*].mount_point
      systemControls = []
      volumesFrom    = []
    }
  ])

  dynamic "volume" {
    for_each = local.ephemeral_write_volume_configs[*].volume
    content {
      name = volume.value["name"]
    }
  }

  cpu    = var.cpu
  memory = var.memory

  requires_compatibilities = ["FARGATE"]

  # Reference https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html
  network_mode = "awsvpc"
}

resource "aws_ecs_cluster" "cluster" {
  name = local.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
