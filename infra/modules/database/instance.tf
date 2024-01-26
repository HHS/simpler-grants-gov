# DMS replication instance and endpoint connections


resource "aws_dms_replication_instance" "simpler_db" {
  allocated_storage            = 50
  apply_immediately            = true
  auto_minor_version_upgrade   = false
  availability_zone            = "us-east-1"
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

# TODO: find way to pull credentials
resource "aws_dms_endpoint" "target_endpoint" {
  certificate_arn                 = "arn:aws:dms:us-east-1:315341936575:cert:GWOIQRTIVQVRBL5ERMCKTUPHMM33MMDGIP57J4I"
  database_name                   = "app"
  endpoint_id                     = "api-dev-primary"
  endpoint_type                   = "source"
  engine_name                     = "aurora-postgresql"
  secrets_manager_access_role_arn = "" # username, pw, server name and port should be pulled using this role
  ssl_mode                        = "verify-ca"
}

resource "aws_dms_endpoint" "source_endpoint" {
  database_name                   = "tstgrnts"
  endpoint_id                     = "hhs-source"
  endpoint_type                   = "source"
  engine_name                     = "oracle"
  ssl_mode                        = "none"
  secrets_manager_access_role_arn = "" # username, pw, server name and port should be pulled using this role
}
