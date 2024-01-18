locals {
  our_target_cidr_block   = "10.0.0.0/20"   # our [Nava] cidr block, where the target database for the DMS is located
  their_source_cidr_block = "10.220.0.0/16" # their [MicroHealth] cidr block, where the origin database for the DMS is located
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter
data "aws_ssm_parameter" "dms_peer_owner_id" {
  name = "/network/dms/peer-owner-id"
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter
data "aws_ssm_parameter" "dms_peer_vpc_id" {
  name = "/network/dms/peer-vpc-id"
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/vpc
data "aws_vpc" "main" {
  id = var.vpc_id
}

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
