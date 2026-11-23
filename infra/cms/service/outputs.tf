output "service_cluster_name" {
  value = module.service.cluster_name
}

output "service_name" {
  value = local.service_config.service_name
}

output "application_log_group" {
  value = module.service.application_log_group
}

output "vpn_endpoint_id" {
  description = "Use with `aws ec2 export-client-vpn-client-configuration` to build the VPN client profile"
  value       = aws_ec2_client_vpn_endpoint.cms.id
}
