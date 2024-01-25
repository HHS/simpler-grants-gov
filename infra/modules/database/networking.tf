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

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_dms" {
  security_group_id = aws_security_group.db.id
  description       = "Allow inbound requests to database from DMS"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = data.aws_security_group.source_db.id
}

# security group for the source DB
data "aws_security_group" "source_db" {
  name   = "dms"
  vpc_id = var.vpc_id
}

