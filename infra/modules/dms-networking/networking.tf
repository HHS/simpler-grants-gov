data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/vpc_peering_connection
resource "aws_vpc_peering_connection" "dms" {
  peer_owner_id = data.aws_ssm_parameter.dms_peer_owner_id.value
  peer_vpc_id   = data.aws_ssm_parameter.dms_peer_vpc_id.value
  vpc_id        = var.our_vpc_id
  peer_region   = "us-east-2"

  requester {
    allow_remote_vpc_dns_resolution = true
  }

  tags = {
    Name = "DMS VPC Peering"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route
resource "aws_route" "dms" {
  for_each                  = toset(data.aws_route_tables.rts.ids)
  route_table_id            = each.value
  destination_cidr_block    = local.their_source_cidr_block
  vpc_peering_connection_id = aws_vpc_peering_connection.dms.id
}
