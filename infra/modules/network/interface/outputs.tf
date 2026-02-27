output "aws_services_security_group_name_prefix" {
  value = "aws-service-vpc-endpoints"
}

output "database_subnet_group_name" {
  value = var.name
}

output "database_subnet_tags" {
  value = { subnet_type = "database" }
}

output "private_subnet_tags" {
  value = { subnet_type = "private" }
}

output "public_subnet_tags" {
  value = { subnet_type = "public" }
}

output "waf_acl_name" {
  value = var.name
}
