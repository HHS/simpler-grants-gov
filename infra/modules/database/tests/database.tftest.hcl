mock_provider "aws" {
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }
  mock_data "aws_kms_key" {
    defaults = {
      arn = "arn:aws:kms:us-east-1:123456789012:key/12345678-1234-1234-1234-123456789012"
    }
  }
  mock_data "aws_iam_policy" {
    defaults = {
      arn = "arn:aws:iam::aws:policy/mock-policy"
    }
  }
}
mock_provider "random" {}
mock_provider "archive" {}

variables {
  environment_name               = "dev"
  app_access_policy_name         = "test-app-db-access"
  app_username                   = "app"
  aws_services_security_group_id = "sg-0123456789abcdef0"
  database_subnet_group_name     = "test-subnet-group"
  migrator_access_policy_name    = "test-migrator-db-access"
  migrator_username              = "migrator"
  name                           = "test-db"
  private_subnet_ids             = ["subnet-aaabbb001", "subnet-aaabbb002"]
  schema_name                    = "app"
  grants_gov_oracle_cidr_block   = "10.0.0.0/8"
  vpc_id                         = "vpc-0123456789abcdef0"
}

run "storage_encryption_is_enabled" {
  command = plan

  assert {
    condition     = aws_rds_cluster.db.storage_encrypted == true
    error_message = "RDS cluster must have storage encryption enabled"
  }
}

run "kms_key_rotation_is_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.db.enable_key_rotation == true
    error_message = "KMS key for RDS must have automatic rotation enabled"
  }
}

run "backup_retention_is_35_days" {
  command = plan

  assert {
    condition     = aws_rds_cluster.db.backup_retention_period == 35
    error_message = "Backup retention period must be 35 days"
  }
}

run "iam_database_authentication_is_enabled" {
  command = plan

  assert {
    condition     = aws_rds_cluster.db.iam_database_authentication_enabled == true
    error_message = "IAM database authentication must be enabled"
  }
}

run "deletion_protection_enabled_by_default" {
  command = plan

  assert {
    condition     = aws_rds_cluster.db.deletion_protection == true
    error_message = "Deletion protection should be on by default"
  }
}

run "deletion_protection_disabled_when_explicitly_set" {
  command = plan

  variables {
    deletion_protection = false
  }

  assert {
    condition     = aws_rds_cluster.db.deletion_protection == false
    error_message = "Deletion protection must be disabled when deletion_protection = false"
  }
}

run "engine_is_aurora_postgresql" {
  command = plan

  assert {
    condition     = aws_rds_cluster.db.engine == "aurora-postgresql"
    error_message = "RDS cluster must use Aurora PostgreSQL engine"
  }
}

run "cluster_identifier_matches_name_variable" {
  command = plan

  assert {
    condition     = aws_rds_cluster.db.cluster_identifier == var.name
    error_message = "Cluster identifier must match var.name"
  }
}

run "creates_one_instance_by_default" {
  command = plan

  assert {
    condition     = length(aws_rds_cluster_instance.instance) == 1
    error_message = "Default instance_count should create exactly one instance"
  }
}

run "instance_count_controls_number_of_instances" {
  command = plan

  variables {
    instance_count = 3
  }

  assert {
    condition     = length(aws_rds_cluster_instance.instance) == var.instance_count
    error_message = "instance_count should control how many RDS instances are provisioned"
  }
}

run "serverless_scaling_uses_variable_values" {
  command = plan

  variables {
    min_capacity = 1.0
    max_capacity = 8.0
  }

  assert {
    condition     = aws_rds_cluster.db.serverlessv2_scaling_configuration[0].min_capacity == var.min_capacity
    error_message = "Serverless min_capacity should match var.min_capacity"
  }

  assert {
    condition     = aws_rds_cluster.db.serverlessv2_scaling_configuration[0].max_capacity == var.max_capacity
    error_message = "Serverless max_capacity should match var.max_capacity"
  }
}

run "role_manager_lambda_kms_key_rotation_enabled" {
  command = plan

  assert {
    condition     = aws_kms_key.role_manager.enable_key_rotation == true
    error_message = "KMS key encrypting role manager Lambda environment variables must have rotation enabled"
  }
}

run "rejects_database_name_with_dashes" {
  command = plan

  variables {
    database_name = "my-database"
  }

  expect_failures = [var.database_name]
}

run "rejects_instance_count_less_than_one" {
  command = plan

  variables {
    instance_count = 0
  }

  expect_failures = [var.instance_count]
}

run "rejects_cluster_name_with_spaces" {
  command = plan

  variables {
    name = "my database"
  }

  expect_failures = [var.name]
}

run "snapshot_identifier_is_set_when_provided" {
  command = plan

  variables {
    snapshot_identifier = "arn:aws:rds:us-east-1:123456789012:cluster-snapshot:test-snapshot"
  }

  assert {
    condition     = aws_rds_cluster.db.snapshot_identifier == "arn:aws:rds:us-east-1:123456789012:cluster-snapshot:test-snapshot"
    error_message = "Snapshot identifier should be set when provided"
  }
}
