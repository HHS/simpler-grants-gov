output "network_name" {
  value = var.network_name
}

output "service_config" {
  value = {
    service_name             = "${local.prefix}${var.app_name}-${var.environment}"
    domain_name              = var.domain_name
    enable_https             = var.enable_https
    region                   = var.default_region
    cpu                      = var.service_cpu
    memory                   = var.service_memory
    desired_instance_count   = var.service_desired_instance_count
    enable_command_execution = var.enable_command_execution
  }
}

output "vpn_config" {
  value = {
    client_cidr_block            = var.vpn_client_cidr_block
    subnet_count                 = var.vpn_subnet_count
    server_certificate_domain    = var.vpn_server_certificate_domain
    client_ca_certificate_domain = var.vpn_client_ca_certificate_domain
  }
}
