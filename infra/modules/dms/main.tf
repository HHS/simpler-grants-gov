# VPC Configuration for DMS
# ----------------------------------------

data "aws_ssm_parameter" "dms_peer_owner_id" {
  name = "/network/dms/peer-owner-id"
}

data "aws_ssm_parameter" "dms_peer_vpc_id" {
  name = "/network/dms/peer-vpc-id"
}

resource "aws_vpc_peering_connection" "dms" {
  peer_owner_id = data.aws_ssm_parameter.dms_peer_owner_id.value
  peer_vpc_id   = data.aws_ssm_parameter.dms_peer_vpc_id.value
  vpc_id        = data.aws_vpc.default.id
  peer_region   = "us-east-2"

  tags = {
    Name = "DMS VPC Peering"
  }
}

resource "aws_route" "dms" {
  route_table_id = data.aws_vpc.default.main_route_table_id
  # MicroHealth VPC CIDR block
  destination_cidr_block    = "10.220.0.0/16"
  vpc_peering_connection_id = aws_vpc_peering_connection.dms.id
}
