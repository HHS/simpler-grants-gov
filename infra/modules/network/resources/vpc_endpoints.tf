locals {
  # List of AWS services used by this VPC
  # This list is used to create VPC endpoints so that the AWS services can
  # be accessed without network traffic ever leaving the VPC's private network
  # For a list of AWS services that integrate with AWS PrivateLink
  # see https://docs.aws.amazon.com/vpc/latest/privatelink/aws-services-privatelink-support.html
  #
  # The database module requires VPC access from private networks to SSM, KMS, and RDS
  aws_service_integrations = setunion(
    # AWS services used by ECS Fargate: ECR to fetch images, S3 for image layers, and CloudWatch for logs
    ["ecr.api", "ecr.dkr", "s3", "logs"],

    # AWS services used by the database's role manager
    var.has_database ? ["ssm", "kms", "secretsmanager"] : [],

    # AWS services used by ECS Exec
    var.enable_command_execution ? ["ssmmessages"] : [],

    # AWS services used by notifications
    var.enable_notifications ? ["pinpoint", "email-smtp"] : [],
  )

  # S3 and DynamoDB use Gateway VPC endpoints. All other services use Interface VPC endpoints
  interface_vpc_endpoints = toset([for aws_service in local.aws_service_integrations : aws_service if !contains(["s3", "dynamodb"], aws_service)])
  gateway_vpc_endpoints   = toset([for aws_service in local.aws_service_integrations : aws_service if contains(["s3", "dynamodb"], aws_service)])
}

data "aws_region" "current" {}

# VPC Endpoints for accessing AWS Services
# ----------------------------------------
#
# Since the role manager Lambda function is in the VPC (which is needed to be
# able to access the database) we need to allow the Lambda function to access
# AWS Systems Manager Parameter Store (to fetch the database password) and
# KMS (to decrypt SecureString parameters from Parameter Store). We can do
# this by either allowing internet access to the Lambda, or by using a VPC
# endpoint. The latter is more secure.
# See https://repost.aws/knowledge-center/lambda-vpc-parameter-store
# See https://docs.aws.amazon.com/vpc/latest/privatelink/create-interface-endpoint.html#create-interface-endpoint

data "aws_subnet" "private" {
  count = length(module.aws_vpc.private_subnets)
  id    = module.aws_vpc.private_subnets[count.index]
}

# AWS services may only be available in certain regions and availability zones,
# so we use this data source to get that information and only create
# VPC endpoints in the regions / availability zones where the particular service
# is available.
data "aws_vpc_endpoint_service" "aws_service" {
  for_each = local.interface_vpc_endpoints
  service  = each.key
}

locals {
  # Map from the name of an AWS service to a list of the private subnets that are in availability
  # zones where the service is available. Only create this map for AWS services where we are going
  # to create an Interface VPC endpoint, which require a list of subnet ids in which to create the
  # elastic network interface for the endpoint.
  aws_service_subnets = {
    for service in local.interface_vpc_endpoints :
    service => [
      for subnet in data.aws_subnet.private[*] :
      subnet.id
      if contains(data.aws_vpc_endpoint_service.aws_service[service].availability_zones, subnet.availability_zone)
    ]
  }
}

resource "aws_security_group" "aws_services" {
  name_prefix = module.interface.aws_services_security_group_name_prefix
  description = "VPC endpoints to access AWS services from the VPCs private subnets"
  vpc_id      = module.aws_vpc.vpc_id
}

resource "aws_vpc_endpoint" "interface" {
  for_each = local.interface_vpc_endpoints

  vpc_id              = module.aws_vpc.vpc_id
  service_name        = "com.amazonaws.${data.aws_region.current.name}.${each.key}"
  vpc_endpoint_type   = "Interface"
  security_group_ids  = [aws_security_group.aws_services.id]
  subnet_ids          = local.aws_service_subnets[each.key]
  private_dns_enabled = true
}

resource "aws_vpc_endpoint" "gateway" {
  for_each = local.gateway_vpc_endpoints

  vpc_id            = module.aws_vpc.vpc_id
  service_name      = "com.amazonaws.${data.aws_region.current.name}.${each.key}"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = module.aws_vpc.private_route_table_ids
}
