data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  master_username       = "postgres"
  primary_instance_name = "${var.name}-primary"
  role_manager_name     = "${var.name}-role-manager"
  role_manager_package  = "${path.root}/role_manager.zip"

  # The ARN that represents the users accessing the database are of the format: "arn:aws:rds-db:<region>:<account-id>:dbuser:<resource-id>/<database-user-name>""
  # See https://aws.amazon.com/blogs/database/using-iam-authentication-to-connect-with-pgadmin-amazon-aurora-postgresql-or-amazon-rds-for-postgresql/
  db_user_arn_prefix = "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.db.cluster_resource_id}"
}

# Database Configuration
# ----------------------

resource "aws_rds_cluster" "db" {
  # checkov:skip=CKV2_AWS_27:have concerns about sensitive data in logs; want better way to get this information
  # checkov:skip=CKV2_AWS_8:TODO add backup selection plan using tags

  # cluster identifier is a unique identifier within the AWS account
  # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.CreateInstance.html
  cluster_identifier = var.name

  engine            = "aurora-postgresql"
  engine_mode       = "provisioned"
  database_name     = var.database_name
  port              = var.port
  master_username   = local.master_username
  master_password   = aws_ssm_parameter.random_db_password.value
  storage_encrypted = true
  kms_key_id        = aws_kms_key.db.arn

  # checkov:skip=CKV_AWS_128:Auth decision needs to be ironed out
  # checkov:skip=CKV_AWS_162:Auth decision needs to be ironed out
  iam_database_authentication_enabled = true
  deletion_protection                 = true
  copy_tags_to_snapshot               = true
  # final_snapshot_identifier = "${var.name}-final"
  skip_final_snapshot = true

  serverlessv2_scaling_configuration {
    max_capacity = 1.0
    min_capacity = 0.5
  }

  vpc_security_group_ids = [aws_security_group.db.id]

  enabled_cloudwatch_logs_exports = ["postgresql"]
}

resource "aws_rds_cluster_instance" "primary" {
  identifier                 = local.primary_instance_name
  cluster_identifier         = aws_rds_cluster.db.id
  instance_class             = "db.serverless"
  engine                     = aws_rds_cluster.db.engine
  engine_version             = aws_rds_cluster.db.engine_version
  auto_minor_version_upgrade = true
  monitoring_role_arn        = aws_iam_role.rds_enhanced_monitoring.arn
  monitoring_interval        = 30
}

resource "random_password" "random_db_password" {
  length = 48
  # Remove '@' sign from allowed characters since only printable ASCII characters besides '/', '@', '"', ' ' may be used.
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_ssm_parameter" "random_db_password" {
  name  = "/db/${var.name}/master-password"
  type  = "SecureString"
  value = random_password.random_db_password.result
}

resource "aws_kms_key" "db" {
  description         = "Key for RDS cluster ${var.name}"
  enable_key_rotation = true
}

# Network Configuration
# ---------------------

resource "aws_security_group" "db" {
  name_prefix = "${var.name}-db"
  description = "Database layer security group"
  vpc_id      = var.vpc_id
}

resource "aws_security_group" "role_manager" {
  name_prefix = "${var.name}-role-manager"
  description = "Database role manager security group"
  vpc_id      = var.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "role_manager_egress_to_db" {
  security_group_id = aws_security_group.role_manager.id
  description       = "Allow role manager to access database"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.db.id
}

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_role_manager" {
  security_group_id = aws_security_group.db.id
  description       = "Allow inbound requests to database from role manager"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.role_manager.id
}

# Authentication
# --------------

resource "aws_iam_policy" "db_access" {
  name   = var.access_policy_name
  policy = data.aws_iam_policy_document.db_access.json
}

data "aws_iam_policy_document" "db_access" {
  # Policy to allow connection to RDS via IAM database authentication
  # which is more secure than traditional username/password authentication
  # https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html
  statement {
    actions = [
      "rds-db:connect"
    ]

    resources = [
      "${local.db_user_arn_prefix}/${var.app_username}",
      "${local.db_user_arn_prefix}/${var.migrator_username}",
    ]
  }
}

# Database Backups
# ----------------

# Backup plan that defines when and how to backup and which backup vault to store backups in
# See https://docs.aws.amazon.com/aws-backup/latest/devguide/about-backup-plans.html
resource "aws_backup_plan" "backup_plan" {
  name = "${var.name}-db-backup-plan"

  rule {
    rule_name         = "${var.name}-db-backup-rule"
    target_vault_name = aws_backup_vault.backup_vault.name
    schedule          = "cron(0 7 ? * SUN *)" # Run Sundays at 12pm (EST)
  }
}

# Backup vault that stores and organizes backups
# See https://docs.aws.amazon.com/aws-backup/latest/devguide/vaults.html
resource "aws_backup_vault" "backup_vault" {
  name        = "${var.name}-db-backup-vault"
  kms_key_arn = data.aws_kms_key.backup_vault_key.arn
}

# KMS Key for the vault
# This key was created by AWS by default alongside the vault
data "aws_kms_key" "backup_vault_key" {
  key_id = "alias/aws/backup"
}

# Backup selection defines which resources to backup
# See https://docs.aws.amazon.com/aws-backup/latest/devguide/assigning-resources.html
# and https://docs.aws.amazon.com/aws-backup/latest/devguide/API_BackupSelection.html
resource "aws_backup_selection" "db_backup" {
  name         = "${var.name}-db-backup"
  plan_id      = aws_backup_plan.backup_plan.id
  iam_role_arn = aws_iam_role.db_backup_role.arn

  resources = [
    aws_rds_cluster.db.arn
  ]
}

# Role that AWS Backup uses to authenticate when backing up the target resource
resource "aws_iam_role" "db_backup_role" {
  name_prefix        = "${var.name}-db-backup-role-"
  assume_role_policy = data.aws_iam_policy_document.db_backup_policy.json
}

data "aws_iam_policy_document" "db_backup_policy" {
  statement {
    actions = [
      "sts:AssumeRole",
    ]

    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["backup.amazonaws.com"]
    }
  }
}

resource "aws_iam_role_policy_attachment" "db_backup_role_policy_attachment" {
  role       = aws_iam_role.db_backup_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}

#----------------------------------#
# IAM role for enhanced monitoring #
#----------------------------------#

resource "aws_iam_role" "rds_enhanced_monitoring" {
  name_prefix        = "${var.name}-enhanced-monitoring-"
  assume_role_policy = data.aws_iam_policy_document.rds_enhanced_monitoring.json
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

data "aws_iam_policy_document" "rds_enhanced_monitoring" {
  statement {
    actions = [
      "sts:AssumeRole",
    ]

    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["monitoring.rds.amazonaws.com"]
    }
  }
}

# Query Logging
# -------------

resource "aws_rds_cluster_parameter_group" "rds_query_logging" {
  name        = var.name
  family      = "aurora-postgresql13"
  description = "Default cluster parameter group"

  parameter {
    name = "log_statement"
    # Logs data definition statements (e.g. DROP, ALTER, CREATE)
    value = "ddl"
  }

  parameter {
    name = "log_min_duration_statement"
    # Logs all statements that run 100ms or longer
    value = "100"
  }
}

# Role Manager Lambda Function
# ----------------------------
#
# Resources for the lambda function that is used for managing database roles
# This includes creating and granting permissions to roles
# as well as viewing existing roles

resource "aws_lambda_function" "role_manager" {
  function_name = local.role_manager_name

  filename         = local.role_manager_package
  source_code_hash = data.archive_file.role_manager.output_base64sha256
  runtime          = "python3.9"
  handler          = "role_manager.lambda_handler"
  role             = aws_iam_role.role_manager.arn
  kms_key_arn      = aws_kms_key.role_manager.arn

  # Only allow 1 concurrent execution at a time
  reserved_concurrent_executions = 1

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.role_manager.id]
  }

  environment {
    variables = {
      DB_HOST                = aws_rds_cluster.db.endpoint
      DB_PORT                = aws_rds_cluster.db.port
      DB_USER                = local.master_username
      DB_NAME                = aws_rds_cluster.db.database_name
      DB_PASSWORD_PARAM_NAME = aws_ssm_parameter.random_db_password.name
      DB_SCHEMA              = var.schema_name
      APP_USER               = var.app_username
      MIGRATOR_USER          = var.migrator_username
      PYTHONPATH             = "vendor"
    }
  }

  # Ensure AWS Lambda functions with tracing are enabled
  # https://docs.bridgecrew.io/docs/bc_aws_serverless_4
  tracing_config {
    mode = "Active"
  }

  # checkov:skip=CKV_AWS_272:TODO(https://github.com/navapbc/template-infra/issues/283)

  # checkov:skip=CKV_AWS_116:Dead letter queue (DLQ) configuration is only relevant for asynchronous invocations
}

# Installs python packages needed by the role manager lambda function before
# creating the zip archive. Reinstalls whenever requirements.txt changes
resource "terraform_data" "role_manager_python_vendor_packages" {
  triggers_replace = file("${path.module}/role_manager/requirements.txt")

  provisioner "local-exec" {
    command = "pip3 install -r ${path.module}/role_manager/requirements.txt -t ${path.module}/role_manager/vendor"
  }
}

data "archive_file" "role_manager" {
  type        = "zip"
  source_dir  = "${path.module}/role_manager"
  output_path = local.role_manager_package
  depends_on  = [terraform_data.role_manager_python_vendor_packages]
}

resource "aws_iam_role" "role_manager" {
  name                = "${var.name}-manager"
  assume_role_policy  = data.aws_iam_policy_document.role_manager_assume_role.json
  managed_policy_arns = [data.aws_iam_policy.lambda_vpc_access.arn]
}

resource "aws_iam_role_policy" "ssm_access" {
  name = "${var.name}-role-manager-ssm-access"
  role = aws_iam_role.role_manager.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ssm:GetParameter*"]
        Resource = "${aws_ssm_parameter.random_db_password.arn}"
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt"]
        Resource = [data.aws_kms_key.default_ssm_key.arn]
      }
    ]
  })
}

data "aws_kms_key" "default_ssm_key" {
  key_id = "alias/aws/ssm"
}

data "aws_iam_policy_document" "role_manager_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

# AWS managed policy required by Lambda functions in order to access VPC resources
# see https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html
data "aws_iam_policy" "lambda_vpc_access" {
  name = "AWSLambdaVPCAccessExecutionRole"
}

# KMS key used to encrypt role manager's environment variables
resource "aws_kms_key" "role_manager" {
  description         = "Key for Lambda function ${local.role_manager_name}"
  enable_key_rotation = true
}

# VPC Endpoints for accessing AWS Services
# ----------------------------------------
#
# Since the role manager Lambda function is in the VPC (which is needed to be
# able to access the database) we need to allow the Lambda function to access
# AWS Systems Manager Parameter Store (to fetch the database password) and
# KMS (to decrypt SecureString parameters from Parameter Store). We can do
# this by either allowing internet access to the Lambda, or by using a VPC
# endpoint. The latter is more secure.
# See https://repost.aws/knowledge-center/lambda-vpc-parameter-store
# See https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html#create-interface-endpoint

resource "aws_vpc_endpoint" "ssm" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.ssm"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  subnet_ids          = var.private_subnet_ids
  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "kms" {
  vpc_id              = var.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.kms"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.vpc_endpoints.id]
  subnet_ids          = var.private_subnet_ids
  private_dns_enabled = true
}

resource "aws_security_group" "vpc_endpoints" {
  name_prefix = "${var.name}-vpc-endpoints"
  description = "VPC endpoints to access SSM and KMS"
  vpc_id      = var.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "role_manager_egress_to_vpc_endpoints" {
  security_group_id = aws_security_group.role_manager.id
  description       = "Allow outbound requests from role manager to VPC endpoints"

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.vpc_endpoints.id
}

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_ingress_from_role_manager" {
  security_group_id = aws_security_group.vpc_endpoints.id
  description       = "Allow inbound requests to VPC endpoints from role manager"

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.role_manager.id
}
