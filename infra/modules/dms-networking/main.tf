locals {
  our_target_cidr_block   = "172.31.0.0/16" # our [Nava] cidr block, where the target database for the DMS is located
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
