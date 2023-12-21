# Add Security Groups for VPC -> DMS here
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# This connection was created in the console, the provided arguments act more as a query than a reference
data "aws_vpc_peering_connection" "dms" {
  owner_id        = data.aws_caller_identity.current.account_id
  cidr_block      = "172.31.0.0/16" # our cidr block, where the target database for the DMS is located
  peer_cidr_block = "10.220.0.0/16" # their cidr block, where the origin database for the DMS is located
}
