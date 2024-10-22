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

resource "aws_vpc_security_group_ingress_rule" "ingress_from_oracle" {
  security_group_id = aws_security_group.db.id
  description       = "Allow Orcale I/O into database"

  from_port   = 1521
  to_port     = 1521
  ip_protocol = "tcp"
  cidr_ipv4   = var.grants_gov_oracle_cidr_block
}

resource "aws_vpc_security_group_egress_rule" "egress_to_oracle" {
  security_group_id = aws_security_group.db.id
  description       = "Allow Orcale I/O into database"

  from_port   = 1521
  to_port     = 1521
  ip_protocol = "tcp"
  cidr_ipv4   = var.grants_gov_oracle_cidr_block
}

resource "aws_vpc_security_group_ingress_rule" "db_ingress_from_role_manager" {
  security_group_id = aws_security_group.db.id
  description       = "Allow inbound requests to database from role manager"

  from_port                    = 5432
  to_port                      = 5432
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.role_manager.id
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

resource "aws_ssm_parameter" "database_security_group_id" {
  name        = "/${var.name}/security-group-id"
  description = "The id of the security group for the database"
  type        = "SecureString"
  value       = aws_security_group.db.id
}
