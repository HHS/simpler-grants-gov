output "database_subnet_tags" {
  value = { subnet_type = "database" }
}

output "private_subnet_tags" {
  value = { subnet_type = "private" }
}

output "public_subnet_tags" {
  value = { subnet_type = "public" }
}
