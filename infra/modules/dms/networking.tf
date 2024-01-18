# Add Security Groups for VPC -> DMS here
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# We need to attach this security group to our DMS instance when created
resource "aws_security_group" "dms" {
  name_prefix = "dms"
  description = "Database DMS security group"
  vpc_id      = var.vpc_id
}

resource "aws_vpc_security_group_egress_rule" "postgres_egress_from_dms" {
  description       = "Allow outbound requests to database from DMS"
  cidr_ipv4         = local.our_target_cidr_block
  from_port         = 5432 # postgres default port
  to_port           = 5432
  ip_protocol       = "tcp"
  security_group_id = aws_security_group.dms.id
}

resource "aws_vpc_security_group_ingress_rule" "postgres_ingress_from_dms" {
  description       = "Allow inbound requests to database from DMS"
  cidr_ipv4         = local.our_target_cidr_block
  from_port         = 5432 # postgres default port
  to_port           = 5432
  ip_protocol       = "tcp"
  security_group_id = aws_security_group.dms.id
}

resource "aws_vpc_security_group_egress_rule" "oracle_egress_from_dms" {
  description       = "Allow outbound requests to database from DMS"
  cidr_ipv4         = local.their_source_cidr_block
  from_port         = 1521 # oracle default port
  to_port           = 1521
  ip_protocol       = "tcp"
  security_group_id = aws_security_group.dms.id
}

resource "aws_vpc_security_group_ingress_rule" "oracle_ingress_from_dms" {
  description       = "Allow inbound requests to database from DMS"
  cidr_ipv4         = local.their_source_cidr_block
  from_port         = 1521 # oracle default port
  to_port           = 1521
  ip_protocol       = "tcp"
  security_group_id = aws_security_group.dms.id
}
