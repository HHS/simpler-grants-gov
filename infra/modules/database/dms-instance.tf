# DMS replication instance and endpoint connections

resource "aws_dms_replication_instance" "simpler_db" {
  # checkov:skip=CKV_AWS_212:Not sure how this triggered, EBS volumes are a seperate resource.
  allocated_storage          = 50
  apply_immediately          = true
  auto_minor_version_upgrade = true
  # needs to refer to the actual zone not whole region like it was before: https://github.com/hashicorp/terraform-provider-aws/issues/29198#issuecomment-1422457911
  availability_zone            = "us-east-1a"
  engine_version               = "3.5.2"
  multi_az                     = false
  preferred_maintenance_window = "sun:10:30-sun:14:30"
  publicly_accessible          = false
  replication_instance_class   = "dms.t3.small"
  replication_instance_id      = "db-replication-instance"

  vpc_security_group_ids = [
    data.aws_security_group.source_db.id
  ]

}

resource "aws_dms_endpoint" "target_endpoint" {
  certificate_arn                 = "arn:aws:dms:us-east-1:315341936575:cert:GWOIQRTIVQVRBL5ERMCKTUPHMM33MMDGIP57J4I"
  database_name                   = "app"
  endpoint_id                     = "api-dev-primary"
  endpoint_type                   = "source"
  engine_name                     = "aurora-postgresql"
  kms_key_arn                     = aws_kms_key.dms_endpoints.arn
  secrets_manager_access_role_arn = aws_iam_role.dms_access.arn
  ssl_mode                        = "verify-ca"
  secrets_manager_arn             = data.aws_secretsmanager_secret.target_db.arn
}

resource "aws_dms_endpoint" "source_endpoint" {
  # checkov:skip=CKV2_AWS_49: This endpoint doesn't need SSL
  database_name                   = "tstgrnts"
  endpoint_id                     = "hhs-source"
  endpoint_type                   = "source"
  engine_name                     = "oracle"
  kms_key_arn                     = aws_kms_key.dms_endpoints.arn
  ssl_mode                        = "none"
  secrets_manager_access_role_arn = aws_iam_role.dms_access.arn
  secrets_manager_arn             = data.aws_secretsmanager_secret.source_db.arn
}

resource "aws_kms_key" "dms_endpoints" {
  description         = "KMS key for endpoints associated with DMS"
  enable_key_rotation = true
}

data "aws_secretsmanager_secret" "target_db" {
  # this secret was created and managed by RDS
  name = "rds!cluster-c91a63ac-db0e-404e-84ce-525d6c841035"
}
data "aws_secretsmanager_secret" "source_db" {
  name = "dev/grants_gov_source_db"
}
data "aws_iam_role" "dms_access" {
  name = "dms-access-role"
}
