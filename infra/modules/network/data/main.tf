data "aws_vpc" "network" {
  filter {
    name = "tag:Name"
    # Resolve the VPC by its network_name tag so the environment name and its
    # VPC/network name may differ (e.g. infra-dev -> infra-dev-simpler-grants),
    # matching the pattern used by infra/api/database/main.tf.
    values = [var.name]
  }
}

data "aws_subnets" "public" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["public"]
  }
}

data "aws_subnets" "private" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.network.id]
  }
  filter {
    name   = "tag:subnet_type"
    values = ["private"]
  }
}
