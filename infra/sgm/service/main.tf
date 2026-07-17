# Stub ECS service for the new "infra-dev-grants-management" VPC (the second VPC of the infra-dev
# environment).
#
# This is a deliberately self-contained root module that stands up a minimal
# Fargate service running a public nginx image, so the infra-dev-grants-management VPC has a real
# workload during the initial infrastructure bring-up. It does NOT depend on the
# shared app-config / build-repository machinery. Replace the nginx image and
# task definition with the real service once it exists.
#
# It targets the infra-dev-grants-management VPC directly by the VPC "Name" tag, so the same identity
# invariant used by the api/frontend service layers applies: var.network_name
# must match a VPC created by the networks layer (see infra/networks + the "infra-dev-grants-management"
# entry in infra/project-config/networks.tf).

data "aws_vpc" "network" {
  filter {
    name   = "tag:Name"
    values = [var.network_name]
  }
}

# The infra-dev-grants-management VPC is a bare VPC (no app-config environment maps to it), so it has no
# NAT gateways. The stub therefore runs in the public subnets with a public IP so
# it can reach the ECR API/S3 endpoints (to pull the nginx image from our ECR
# repo) via the internet gateway. Inbound is still restricted to within the VPC
# by the security group below.
data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["public"]
  }
}

locals {
  # The prefix isolates resources per terraform workspace, mirroring the other
  # service layers.
  prefix       = terraform.workspace == "default" ? "" : "${terraform.workspace}-"
  service_name = "${local.prefix}${var.service_name}-${var.environment_name}"

  # ECR repo name follows the project convention (e.g. simpler-grants-gov-sgm),
  # matching the api/frontend build repositories.
  image_repository_name = "${module.project_config.project_name}-${var.service_name}"

  tags = merge(module.project_config.default_tags, {
    owner        = "navapbc"
    app          = var.service_name
    environment  = var.environment_name
    description  = "Stub nginx service in the ${var.network_name} VPC"
    service_name = local.service_name
  })
}

terraform {
  required_version = "1.14.3"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 6.27.0, < 7.0.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region = var.region
  # Refuse to operate against the wrong account (covers plan/apply/destroy).
  allowed_account_ids = [module.expected_account.account_id]
  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../../project-config"
}

# Resolve the account that owns the infra-dev-grants-management VPC (used by the provider's
# allowed_account_ids below and by the guard), then short-circuit plan/apply if
# the active AWS credentials are for a different account.
module "expected_account" {
  source       = "../../modules/account-id-by-name"
  account_name = module.project_config.network_configs[var.network_name].account_name
  accounts_dir = "${path.module}/../../accounts"
}

module "account_guard" {
  source              = "../../modules/aws-account-guard"
  expected_account_id = module.expected_account.account_id
  context             = "the ${var.environment_name} sgm stub service"
}

# ECR repository (in this same "dev" account) that the stub pulls its image from.
# The nginx image must be pushed here (e.g. mirrored from a public registry)
# before the ECS service can start its tasks. Kept in-account so the pull is not
# cross-account and never touches the public registry.
resource "aws_ecr_repository" "stub" {
  name                 = local.image_repository_name
  image_tag_mutability = "MUTABLE"
  force_delete         = true # stub / experimental environment

  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecs_cluster" "stub" {
  name = local.service_name
}

resource "aws_cloudwatch_log_group" "stub" {
  name              = "service/${local.service_name}"
  retention_in_days = 30
}

# --- IAM ---------------------------------------------------------------------
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

# Pulls the image from (public) ECR and writes container logs to CloudWatch.
resource "aws_iam_role" "task_executor" {
  name               = "${local.service_name}-task-executor"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

resource "aws_iam_role_policy_attachment" "task_executor" {
  role       = aws_iam_role.task_executor.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Task role for the running container. The nginx stub needs no AWS permissions,
# but a dedicated role is kept so the real service can attach policies later.
resource "aws_iam_role" "task" {
  name               = "${local.service_name}-task"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json
}

# --- Networking --------------------------------------------------------------
resource "aws_security_group" "stub" {
  name_prefix = "${local.service_name}-"
  description = "Stub nginx service ${local.service_name}"
  vpc_id      = data.aws_vpc.network.id

  ingress {
    description = "nginx HTTP from within the VPC"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.network.cidr_block]
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# --- ECS task + service ------------------------------------------------------
resource "aws_ecs_task_definition" "stub" {
  family                   = local.service_name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.cpu
  memory                   = var.memory
  execution_role_arn       = aws_iam_role.task_executor.arn
  task_role_arn            = aws_iam_role.task.arn

  container_definitions = jsonencode([
    {
      name      = "nginx"
      image     = "${aws_ecr_repository.stub.repository_url}:${var.image_tag}"
      essential = true
      portMappings = [
        {
          containerPort = 80
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.stub.name
          "awslogs-region"        = var.region
          "awslogs-stream-prefix" = "nginx"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "stub" {
  name            = local.service_name
  cluster         = aws_ecs_cluster.stub.id
  task_definition = aws_ecs_task_definition.stub.arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  # Tasks run in the infra-dev-grants-management VPC's public subnets with a public IP so they can pull
  # the nginx image from our ECR repo via the internet gateway (the bare infra-dev-grants-management VPC
  # has no NAT). The security group still only allows inbound from within the VPC.
  network_configuration {
    subnets          = data.aws_subnets.public.ids
    security_groups  = [aws_security_group.stub.id]
    assign_public_ip = true
  }
}
