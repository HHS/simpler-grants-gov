data "aws_caller_identity" "current" {}

data "aws_vpc" "network" {
  filter {
    name   = "tag:Name"
    values = [module.project_config.network_configs[var.environment_name].vpc_name]
  }
}

data "aws_subnets" "database" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["database"]
  }
}

module "network" {
  source       = "../../modules/network/data"
  project_name = module.project_config.project_name
  name         = local.environment_config.network_name
}
