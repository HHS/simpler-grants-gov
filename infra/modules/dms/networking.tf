# Add Security Groups for VPC -> DMS here


resource "aws_vpc_security_group_egress_rule" "vpc_egress_from_dms" {
  security_group_id = aws_security_group.vpc.id
  description       = "VPC Endpoint security group egress rules for DMS"

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp" # may need to change protocol too
  referenced_security_group_id = aws_security_group.vpc.id
}

resource "aws_vpc_security_group_ingress_rule" "vpc_ingress_from_dms" {
  security_group_id = aws_security_group.db.id
  description       = "VPC Endpoint security group inress rules for DMS"

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.vpc.id
}

# This will also need to be attached to our DMS instance when created
resource "aws_security_group" "vpc" {
  # checkov:skip= CKV2_AWS_5:DMS instance not created yet
  name_prefix = "${var.name}-vpc"
  description = "Security group to manage the connection between DMS and the VPC"
  vpc_id      = var.vpc_id

}
