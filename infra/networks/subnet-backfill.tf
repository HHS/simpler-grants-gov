# The purpose of this file is to backfill the default VPC with 3 private subnets.

locals {
  backfill_subnet_cidrs = {
    # The CIDRs were chosen to be within `172.31.0.0/16` but not overlap with the nearest
    # CIDRs already being used in the VPC.
    #
    # You can can confirm the ranges with a tool like:
    # https://www.ipaddressguide.com/cidr
    #
    # The `/20` CIDR block was chosen because most of the existing subnets are `/20`.
    "us-east-1a" = "172.31.144.0/20", # /20 = 4096 IPs, last address is 172.31.159.255
    "us-east-1b" = "172.31.160.0/20", # /20 = 4096 IPs, last address is	172.31.175.255
    "us-east-1c" = "172.31.176.0/20", # /20 = 4096 IPs, last address is 172.31.191.255
  }
}

# ------- #
# SUBNETS #
# ------- #

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/subnet
resource "aws_subnet" "backfill_private" {
  for_each                = local.backfill_subnet_cidrs
  vpc_id                  = data.aws_vpc.default.id
  availability_zone       = each.key
  cidr_block              = each.value
  map_public_ip_on_launch = false
  tags = {
    Name        = "backfill-private-${each.key}"
    subnet_type = "private"
  }
}

# ----------- #
# NAT GATEWAY #
# ----------- #

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/eip
#
# purpose: All external traffic from the private subnets will be routed through this EIP
#          via means of a NAT gateway.
resource "aws_eip" "backfill_private" {
  # checkov:skip=CKV2_AWS_19: These EIPs are attached to NAT gateways
  for_each = local.backfill_subnet_cidrs
  domain = "vpc"
  tags = {
    Name = "backfill-private-${each.key}"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/nat_gateway
resource "aws_nat_gateway" "backfill_private" {
  for_each      = local.backfill_subnet_cidrs
  allocation_id = aws_eip.backfill_private[each.key].allocation_id
  subnet_id     = aws_subnet.backfill_private[each.key].id
  tags = {
    Name = "backfill-private-${each.key}"
  }
}

# ------------ #
# ROUTE TABLES #
# ------------ #

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route_table
resource "aws_route_table" "backfill_private" {
  for_each = local.backfill_subnet_cidrs
  vpc_id = data.aws_vpc.default.id
  tags = {
    Name = "backfill-private-${each.key}"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route_table_association
#
# purpose: Associate the private subnets with the private route table.
resource "aws_route_table_association" "backfill_private" {
  for_each       = local.backfill_subnet_cidrs
  subnet_id      = aws_subnet.backfill_private[each.key].id
  route_table_id = aws_route_table.backfill_private[each.key].id
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route
#
# purpose: Route external traffic through the NAT gateway.
resource "aws_route" "backfill_private" {
  for_each               = local.backfill_subnet_cidrs
  route_table_id         = aws_route_table.backfill_private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.backfill_private[each.key].id
}
