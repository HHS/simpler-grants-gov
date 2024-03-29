locals {
  our_target_cidr_block   = var.our_cidr_block               # our [Nava] cidr block, where the target database for the DMS is located
  their_source_cidr_block = var.grants_gov_oracle_cidr_block # their [MicroHealth] cidr block, where the origin database for the DMS is located
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter
data "aws_ssm_parameter" "dms_peer_owner_id" {
  name = "/network/${var.environment_name}/dms/peer-owner-id"
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/ssm_parameter
data "aws_ssm_parameter" "dms_peer_vpc_id" {
  name = "/network/${var.environment_name}/dms/peer-vpc-id"
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/data-sources/vpc
data "aws_vpc" "main" {
  id = var.our_vpc_id
}

data "aws_route_tables" "rts" {
  vpc_id = var.our_vpc_id
}
