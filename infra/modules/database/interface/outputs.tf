output "app_username" {
  value = "app"
}

output "migrator_username" {
  value = "migrator"
}

output "schema_name" {
  value = "app"
}

output "app_access_policy_name" {
  value = "${var.name}-app-access"
}

output "migrator_access_policy_name" {
  value = "${var.name}-migrator-access"
}
