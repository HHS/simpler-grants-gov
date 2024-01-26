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


