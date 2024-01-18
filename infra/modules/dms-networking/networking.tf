data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc_peering_connection
resource "aws_vpc_peering_connection" "dms" {
  peer_owner_id = data.aws_ssm_parameter.dms_peer_owner_id.value
  peer_vpc_id   = data.aws_ssm_parameter.dms_peer_vpc_id.value
  vpc_id        = var.vpc_id
  peer_region   = "us-east-2"

  tags = {
    Name = "DMS VPC Peering"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route
resource "aws_route" "dms" {
  route_table_id            = data.aws_vpc.main.main_route_table_id
  destination_cidr_block    = local.their_source_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.dms.id
}
