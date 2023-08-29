output "service_endpoint" {
  description = "The public endpoint for the service."
  value       = module.service.public_endpoint
}

output "service_cluster_name" {
  value = module.service.cluster_name
}

output "service_name" {
  value = local.service_name
}
