output "vpc_id" {
  value = module.aws_vpc.vpc_id
}

output "vpc_cidr" {
  value = local.vpc_cidr
}
