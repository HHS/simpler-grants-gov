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

# We need to attach this security group to our DMS instance when created
resource "aws_security_group" "dms" {
  # checkov:skip= CKV2_AWS_5:DMS instance not created yet
  name_prefix = "${var.name}-dms"
  description = "Database DMS security group"
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

resource "aws_vpc_security_group_egress_rule" "db_egress_from_dms" {
  security_group_id = aws_security_group.db.id
  description       = "Allow outbound requests to database from DMS"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.dms.id
}

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_dms" {
  security_group_id = aws_security_group.db.id
  description       = "Allow inbound requests to database from DMS"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.dms.id
}

resource "aws_vpc_security_group_egress_rule" "role_manager_egress_to_vpc_endpoints" {
  security_group_id = aws_security_group.role_manager.id
  description       = "Allow outbound requests from role manager to VPC endpoints"

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = var.aws_services_security_group_id
}

resource "aws_vpc_security_group_ingress_rule" "vpc_endpoints_ingress_from_role_manager" {
  security_group_id = var.aws_services_security_group_id
  description       = "Allow inbound requests to VPC endpoints from role manager"

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.role_manager.id
}
