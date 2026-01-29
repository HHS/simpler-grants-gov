data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_ecr_repository" "app" {
  count = var.image_repository_name != null ? 1 : 0
  name  = var.image_repository_name
}

module "project_config" {
  source = "../../project-config"
}

data "external" "whoami" {
  program = ["sh", "-c", "whoami | xargs -I {} echo '{\"value\": \"{}\"}'"]
}

# TODO: https://github.com/HHS/simpler-grants-gov/issues/3177
# data "external" "deploy_github_ref" {
#   program = ["sh", "-c", "git branch --show-current | xargs -I {} echo '{\"value\": \"{}\"}'"]
# }

data "external" "deploy_github_sha" {
  program = ["sh", "-c", "git rev-parse HEAD | xargs -I {} echo '{\"value\": \"{}\"}'"]
}

data "aws_ssm_parameter" "fluent_bit_commit" {
  name = "/fluent-bit-commit"
}

locals {
  alb_name                = var.service_name
  cluster_name            = var.service_name
  container_name          = var.service_name
  log_group_name          = "service/${var.service_name}"
  log_stream_prefix       = var.service_name
  task_executor_role_name = "${var.service_name}-task-executor"
  fluent_bit_repo_arn     = "arn:aws:ecr:us-east-1:${data.aws_caller_identity.current.account_id}:repository/simpler-grants-gov-fluentbit"
  fluent_bit_repo_url     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.us-east-1.amazonaws.com/simpler-grants-gov-fluentbit"
  fluent_bit_image_url    = "${local.fluent_bit_repo_url}:${data.aws_ssm_parameter.fluent_bit_commit.value}"
  image_url               = var.image_repository_url != null ? "${var.image_repository_url}:${var.image_tag}" : "${data.aws_ecr_repository.app[0].repository_url}:${var.image_tag}"
  hostname                = var.hostname != null ? [{ name = "HOSTNAME", value = var.hostname }] : []

  base_environment_variables = concat([
    { name : "PORT", value : tostring(var.container_port) },
    { name : "AWS_DEFAULT_REGION", value : data.aws_region.current.name },
    { name : "AWS_REGION", value : data.aws_region.current.name },
    { name : "GENERAL_S3_BUCKET_URL", value : aws_s3_bucket.general_purpose.bucket_regional_domain_name },
    { name : "ENVIRONMENT", value : var.environment_name },
    { name : "DEPLOY_TIMESTAMP", value : timestamp() },
    { name : "DEPLOY_GITHUB_SHA", value : data.external.deploy_github_sha.result.value },
    # TODO: https://github.com/HHS/simpler-grants-gov/issues/3177
    # { name : "DEPLOY_GITHUB_REF", value : data.external.deploy_github_ref.result.value },
    { name : "DEPLOY_WHOAMI", value : data.external.whoami.result.value },
    { name : "IMAGE_TAG", value : var.image_tag },
  ], local.hostname)

  alb_environment_variables = var.enable_load_balancer ? [
    { name : "LOAD_BALANCER_DNS_NAME", value : aws_lb.alb[0].dns_name },
  ] : []

  db_environment_variables = var.db_vars == null ? [] : [
    { name : "DB_HOST", value : var.db_vars.connection_info.host },
    { name : "DB_PORT", value : var.db_vars.connection_info.port },
    { name : "DB_USER", value : var.db_vars.connection_info.user },
    { name : "DB_NAME", value : var.db_vars.connection_info.db_name },
    { name : "DB_SCHEMA", value : var.db_vars.connection_info.schema_name },
  ]

  cdn_environment_variables = local.enable_cdn ? [
    { name : "CDN_URL", value : "https://${local.cdn_domain_name_env_var}" },
  ] : []
  environment_variables = concat(
    local.base_environment_variables,
    local.alb_environment_variables,
    local.db_environment_variables,
    local.cdn_environment_variables,
    [
      for name, value in var.extra_environment_variables :
      { name : name, value : value }
    ],
    [
      for name, value in var.s3_buckets :
      { name : value.env_var, value : "s3://${aws_s3_bucket.s3_buckets[name].id}" }
    ],
    flatten([
      for name, s3_bucket in var.s3_buckets : [
        for paths in s3_bucket.paths : {
          name  = paths.env_var,
          value = "s3://${aws_s3_bucket.s3_buckets[name].id}${paths.path}"
        }
      ]
    ])
  )

  # Environment variables for migrator task - uses same DB_USER as app
  # The migrator task uses the migrator_task IAM role for OpenSearch ingest permissions
  # but connects to the database as the app user (which has legacy schema access)
  migrator_environment_variables = local.environment_variables
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

  dynamic "load_balancer" {
    for_each = var.enable_load_balancer ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.app_tg[0].arn
      container_name   = var.service_name
      container_port   = var.container_port
    }
  }

  # add a connection to the mtls target group since these same containers power both
  dynamic "load_balancer" {
    for_each = var.enable_mtls_load_balancer ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.mtls_tg[0].arn
      container_name   = var.service_name
      container_port   = var.container_port
    }
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
      memory                 = var.fargate_memory - var.fluent_bit_memory,
      cpu                    = var.fargate_cpu - var.fluent_bit_cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = var.readonly_root_filesystem,

      # Need to define all parameters in the healthCheck block even if we want
      # to use AWS's defaults, otherwise the terraform plan will show a diff
      # that will force a replacement of the task definition
      healthCheck = var.healthcheck_command != null ? {
        interval = 30,
        retries  = 3,
        timeout  = 5,
        command  = var.healthcheck_command
      } : null,
      environment = concat(local.environment_variables, [
        {
          name  = "TMPDIR"
          value = "/tmp"
        }
      ]),
      secrets = var.secrets,
      portMappings = [
        {
          containerPort = var.container_port,
          hostPort      = var.container_port,
          protocol      = "tcp"
        }
      ],
      linuxParameters = {
        capabilities = var.drop_linux_capabilities ? {
          add  = []
          drop = ["ALL"]
          } : {
          add  = []
          drop = []
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
      name                   = "${local.container_name}-fluentbit"
      image                  = local.fluent_bit_image_url,
      memory                 = var.fluent_bit_memory,
      cpu                    = var.fluent_bit_cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = false,
      healthCheck = {
        timeout     = 5,
        interval    = 10,
        startPeriod = 30,
        command     = ["CMD-SHELL", "curl http://localhost:80/api/v1/health"]
      },
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
          "awslogs-group"         = "${aws_cloudwatch_log_group.service_logs.name}-fluentbit",
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.log_stream_prefix
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
        { name : "container_name", value : local.container_name },
        { name : "log_group_name", value : local.log_group_name },
      ],
    },
  ])

  # The CPU and memory values for the task definition need to be one of the valid combinations for Fargate tasks.
  # The valid combinations are listed in the AWS documentation below.
  #
  # The input values for `var.cpu` and `var.memory` are the values for the application container,
  # not the value for the task definition.
  #
  # Because `var.cpu` and `var.memory` are the values for the application container,
  # we need to create extra room in the task definition for the application container
  #
  # https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html#task_size
  cpu    = var.fargate_cpu
  memory = var.fargate_memory

  requires_compatibilities = ["FARGATE"]

  # Reference https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task-networking.html
  network_mode = "awsvpc"

  depends_on = [
    aws_cloudwatch_log_group.service_logs,
    aws_cloudwatch_log_group.fluentbit,
    aws_iam_role_policy.task_executor,
    aws_iam_role_policy_attachment.extra_policies,
  ]
}

# Migrator task definition for scheduled jobs (load-opportunity-data, load-agency-data, etc.)
# Uses the migrator_task role which has OpenSearch ingest permissions for write operations
resource "aws_ecs_task_definition" "migrator" {
  # checkov:skip=CKV_AWS_336:Fluentbit sidecar requires write access to filesystem for logging
  count = var.db_vars != null ? 1 : 0

  family             = "${var.service_name}-migrator"
  execution_role_arn = aws_iam_role.task_executor.arn
  task_role_arn      = aws_iam_role.migrator_task[0].arn

  container_definitions = jsonencode([
    {
      name                   = local.container_name,
      image                  = local.image_url,
      memory                 = var.fargate_memory - var.fluent_bit_memory,
      cpu                    = var.fargate_cpu - var.fluent_bit_cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = var.readonly_root_filesystem,
      environment            = local.migrator_environment_variables,
      secrets                = var.secrets,
      linuxParameters = var.drop_linux_capabilities ? {
        capabilities = {
          add  = []
          drop = ["ALL"]
        },
        initProcessEnabled = true
      } : null,
      logConfiguration = {
        logDriver = "awsfirelens",
      }
      mountPoints = [
        {
          sourceVolume  = "tmp"
          containerPath = "/tmp"
          readOnly      = false
        }
      ]
      systemControls = []
      volumesFrom    = []
    },
    {
      name                   = "${local.container_name}-fluentbit"
      image                  = local.fluent_bit_image_url,
      memory                 = var.fluent_bit_memory,
      cpu                    = var.fluent_bit_cpu,
      networkMode            = "awsvpc",
      essential              = true,
      readonlyRootFilesystem = false,
      healthCheck = {
        timeout     = 5,
        interval    = 10,
        startPeriod = 30,
        command     = ["CMD-SHELL", "curl http://localhost:80/api/v1/health"]
      },
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
          "awslogs-group"         = "${aws_cloudwatch_log_group.service_logs.name}-fluentbit",
          "awslogs-region"        = data.aws_region.current.name,
          "awslogs-stream-prefix" = local.log_stream_prefix
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
        { name : "container_name", value : local.container_name },
        { name : "log_group_name", value : local.log_group_name },
      ],
    },
  ])

  cpu    = var.fargate_cpu
  memory = var.fargate_memory

  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"

  # Ephemeral volume for /tmp - required when readonlyRootFilesystem is true
  volume {
    name = "tmp"
  }

  depends_on = [
    aws_cloudwatch_log_group.service_logs,
    aws_cloudwatch_log_group.fluentbit,
    aws_iam_role_policy.task_executor,
  ]
}

resource "aws_ecs_cluster" "cluster" {
  name = local.cluster_name

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}
