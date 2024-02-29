data "aws_availability_zones" "available" {}

locals {
  vpc_cidr               = "10.${var.second_octet}.0.0/20"
  num_availability_zones = 3
  availability_zones     = slice(data.aws_availability_zones.available.names, 0, local.num_availability_zones)
}

module "aws_vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.5.1"

  name = var.name
  azs  = local.availability_zones
  cidr = local.vpc_cidr

  public_subnets             = ["10.${var.second_octet}.10.0/24", "10.${var.second_octet}.11.0/24", "10.${var.second_octet}.12.0/24"]
  private_subnets            = ["10.${var.second_octet}.0.0/24", "10.${var.second_octet}.1.0/24", "10.${var.second_octet}.2.0/24"]
  database_subnets           = ["10.${var.second_octet}.5.0/24", "10.${var.second_octet}.6.0/24", "10.${var.second_octet}.7.0/24"]
  public_subnet_tags         = { subnet_type = "public" }
  private_subnet_tags        = { subnet_type = "private" }
  database_subnet_tags       = { subnet_type = "database" }
  database_subnet_group_name = var.database_subnet_group_name

  # If application needs external services, then create one NAT gateway per availability zone
  enable_nat_gateway     = var.has_external_non_aws_service
  single_nat_gateway     = false
  one_nat_gateway_per_az = var.has_external_non_aws_service

  enable_dns_hostnames = true
  enable_dns_support   = true

  enable_flow_log                  = true
  flow_log_destination_type        = "cloud-watch-logs"
  flow_log_destination_arn         = aws_cloudwatch_log_group.flow_log.arn
  flow_log_cloudwatch_iam_role_arn = aws_iam_role.vpc_flow_log_cloudwatch.arn
}

####################
# SECURITY SUBNETS #
####################

# The configuration below creates "security subnets" with are used exclusively for
# MicroHealth's security tooling. They were created by MicroHealth's request to confirm
# to their standard architecture.

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/subnet
resource "aws_subnet" "security_public" {
  vpc_id                  = module.aws_vpc.vpc_id
  availability_zone       = local.availability_zones[0]
  cidr_block              = "10.${var.second_octet}.14.0/24"
  map_public_ip_on_launch = false
  tags = {
    Name        = "${var.name}-security-public"
    subnet_type = "public"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/subnet
resource "aws_subnet" "security_private" {
  vpc_id                  = module.aws_vpc.vpc_id
  availability_zone       = local.availability_zones[0]
  cidr_block              = "10.${var.second_octet}.15.0/24"
  map_public_ip_on_launch = false
  tags = {
    Name        = "${var.name}-security-private"
    subnet_type = "private"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route_table_association
resource "aws_route_table_association" "security_public" {
  subnet_id      = aws_subnet.security_public.id
  route_table_id = module.aws_vpc.public_route_table_ids[0]
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/route_table_association
resource "aws_route_table_association" "security_private" {
  subnet_id      = aws_subnet.security_private.id
  route_table_id = module.aws_vpc.private_route_table_ids[0]
}
