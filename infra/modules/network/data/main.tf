module "interface" {
  source = "../interface"
  name   = var.name
}

data "aws_vpc" "network" {
  tags = {
    project      = var.project_name
    network_name = var.name
  }
}

data "aws_subnets" "public" {
  tags = merge(module.interface.public_subnet_tags, {
    project      = var.project_name
    network_name = var.name
  })
}

data "aws_subnets" "private" {
  tags = merge(module.interface.private_subnet_tags, {
    project      = var.project_name
    network_name = var.name
  })
}

data "aws_subnets" "database" {
  tags = merge(module.interface.database_subnet_tags, {
    project      = var.project_name
    network_name = var.name
  })
}

data "aws_security_groups" "aws_services" {
  filter {
    name   = "group-name"
    values = ["${module.interface.aws_services_security_group_name_prefix}*"]
  }

  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
}

data "aws_wafv2_web_acl" "network" {
  name  = module.interface.waf_acl_name
  scope = "REGIONAL"
}

