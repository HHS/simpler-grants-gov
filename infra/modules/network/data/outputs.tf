output "vpc_id" {
  value = data.aws_vpc.network.id
}

output "vpc_cidr_block" {
  value = data.aws_vpc.network.cidr_block
}

output "public_subnet_ids" {
  value = data.aws_subnets.public.ids
}

output "private_subnet_ids" {
  value = data.aws_subnets.private.ids
}
