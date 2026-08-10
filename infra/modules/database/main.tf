data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Generate a random username for the RDS superuser.
# For Aurora PostgreSQL, it must contain 1–63 alphanumeric characters.
resource "random_id" "db_superuser" {
  prefix      = "root" # Fixed 4 character prefix for identification in logs
  byte_length = 16     # 32 hexadecimal digits
}

locals {
  master_username       = random_id.db_superuser.hex
  primary_instance_name = "${var.name}-primary"
  role_manager_name     = "${var.name}-role-manager"
  role_manager_package  = "${path.root}/role_manager.zip"

  # The ARN that represents the users accessing the database are of the format: "arn:aws:rds-db:<region>:<account-id>:dbuser:<resource-id>/<database-user-name>""
  # See https://aws.amazon.com/blogs/database/using-iam-authentication-to-connect-with-pgadmin-amazon-aurora-postgresql-or-amazon-rds-for-postgresql/
  db_user_arn_prefix = "arn:aws:rds-db:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:dbuser:${aws_rds_cluster.db.cluster_resource_id}"

  engine_version       = var.engine_version
  engine_major_version = regex("^\\d+", local.engine_version)
}

# Database Configuration
# ----------------------

resource "aws_rds_cluster" "db" {
  # checkov:skip=CKV2_AWS_27:have concerns about sensitive data in logs; want better way to get this information
  # checkov:skip=CKV2_AWS_8:TODO add backup selection plan using tags

  # cluster identifier is a unique identifier within the AWS account
  # https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.CreateInstance.html
  cluster_identifier = var.name

  lifecycle {
    ignore_changes = [
      master_username,
      cluster_identifier, # also ignore if it changes
      # Prevent re-restore on subsequent applies after a snapshot restore.
      # Use -replace=module.database.aws_rds_cluster.db to trigger a restore.
      snapshot_identifier,
    ]
  }

  engine                      = "aurora-postgresql"
  engine_mode                 = "provisioned"
  engine_version              = local.engine_version
  database_name               = var.database_name
  port                        = var.port
  master_username             = local.master_username
  manage_master_user_password = true
  storage_encrypted           = true
  kms_key_id                  = aws_kms_key.db.arn
  allow_major_version_upgrade = false

  db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.rds_query_logging.name

  # checkov:skip=CKV_AWS_128:Auth decision needs to be ironed out
  # checkov:skip=CKV_AWS_162:Auth decision needs to be ironed out
  iam_database_authentication_enabled = true
  copy_tags_to_snapshot               = true
  enable_http_endpoint                = var.enable_http_endpoint
  # final_snapshot_identifier = "${var.name}-final"
  skip_final_snapshot = true
  snapshot_identifier = var.snapshot_identifier

  backup_retention_period = 35
  # Use a separate line to support automated terraform destroy commands
  # checkov:skip=CKV_AWS_139:Allow disabling deletion protection for automated tests
  deletion_protection = var.deletion_protection

  serverlessv2_scaling_configuration {
    max_capacity = var.max_capacity
    min_capacity = var.min_capacity
  }

  db_subnet_group_name            = var.database_subnet_group_name
  vpc_security_group_ids          = [aws_security_group.db.id]
  enabled_cloudwatch_logs_exports = ["postgresql"]
}

resource "aws_rds_cluster_instance" "instance" {
  count = var.instance_count

  identifier                            = "${var.name}-instance-${count.index}"
  cluster_identifier                    = aws_rds_cluster.db.id
  instance_class                        = "db.serverless"
  db_subnet_group_name                  = var.database_subnet_group_name
  engine                                = aws_rds_cluster.db.engine
  engine_version                        = aws_rds_cluster.db.engine_version
  promotion_tier                        = 0
  auto_minor_version_upgrade            = true
  monitoring_role_arn                   = aws_iam_role.rds_enhanced_monitoring.arn
  monitoring_interval                   = 30
  performance_insights_enabled          = true
  performance_insights_retention_period = 93

  # checkov:skip=CKV_AWS_354:Ignore the managed customer KMS key requirement for now
}

resource "aws_kms_key" "db" {
  description         = "Key for RDS cluster ${var.name}"
  enable_key_rotation = true
  # checkov:skip=CKV2_AWS_64:TODO: https://github.com/HHS/simpler-grants-gov/issues/2366
}

# Cross-account access for snapshot sharing, used by the cross-environment DB
# restore workflow to seed one environment from another.
#
# Only created when var.snapshot_share_account_ids is non-empty, so environments
# that share an AWS account (the legacy dev/staging/grantee/grantor set) are
# untouched and keep the AWS default key policy.
#
# Attaching ANY policy replaces that default, which is why the first statement
# re-grants full control to this account's root — without it the key would
# become unmanageable, and AWS rejects policies that lock out the owner.
resource "aws_kms_key_policy" "db" {
  count  = length(var.snapshot_share_account_ids) > 0 ? 1 : 0
  key_id = aws_kms_key.db.id
  policy = data.aws_iam_policy_document.db_kms[0].json
}

data "aws_iam_policy_document" "db_kms" {
  count = length(var.snapshot_share_account_ids) > 0 ? 1 : 0

  # The kms:* / Resource "*" below is the account-root statement AWS requires on
  # every key policy (see the note on aws_kms_key_policy.db). It cannot be
  # narrowed without making the key unmanageable, and it is scoped to this
  # account's own root. Same rationale as infra/modules/storage/encryption.tf.
  # checkov:skip=CKV_AWS_109:Root account requires full KMS permissions to enable IAM-based access control
  # checkov:skip=CKV_AWS_111:Root account requires full KMS permissions to enable IAM-based access control
  # checkov:skip=CKV_AWS_356:A key policy's resource is always the key it is attached to; "*" is the only valid value

  # Equivalent of the AWS default key policy. Required — see note above.
  statement {
    sid    = "EnableIAMUserPermissions"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Let the target accounts decrypt a shared snapshot.
  statement {
    sid    = "AllowSnapshotShareTargetsToDecrypt"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for id in var.snapshot_share_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions = [
      "kms:Decrypt",
      "kms:DescribeKey",
    ]
    resources = ["*"]
  }

  # CreateGrant is what RDS itself needs in the target account to restore from
  # the encrypted snapshot. Scoped to grants made on behalf of an AWS service.
  statement {
    sid    = "AllowSnapshotShareTargetsToCreateGrants"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = [for id in var.snapshot_share_account_ids : "arn:aws:iam::${id}:root"]
    }
    actions   = ["kms:CreateGrant"]
    resources = ["*"]
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
}

# Query Logging
# -------------

resource "aws_rds_cluster_parameter_group" "rds_query_logging" {
  name        = "${var.name}-${local.engine_major_version}"
  family      = "aurora-postgresql${local.engine_major_version}"
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
