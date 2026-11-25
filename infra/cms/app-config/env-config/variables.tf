variable "app_name" {
  type = string
}

variable "default_region" {
  description = "default region for the project"
  type        = string
}

variable "domain_name" {
  type        = string
  description = "The private hostname for Drupal. It resolves only inside the environment's VPC."
}

variable "enable_command_execution" {
  type        = bool
  description = "Enables the ability to manually execute commands on running service containers using AWS ECS Exec"
  default     = false
}

variable "enable_https" {
  type        = bool
  description = "Whether to serve Drupal over HTTPS with the ACM certificate for domain_name"
  default     = false
}

variable "environment" {
  description = "name of the application environment (e.g. staging, prod)"
  type        = string
}

variable "network_name" {
  description = "Human readable identifier of the network / VPC"
  type        = string
}

variable "project_name" {
  type = string
}

variable "service_cpu" {
  type    = number
  default = 1024
}

variable "service_desired_instance_count" {
  type    = number
  default = 1
}

variable "service_memory" {
  type    = number
  default = 2048
}

variable "vpn_client_cidr_block" {
  type        = string
  description = "IP range assigned to VPN clients. Must be between /12 and /22 and must not overlap the VPC."
}

variable "vpn_subnet_count" {
  type        = number
  description = "Number of private subnets the VPN endpoint is associated with. Each association is billed hourly."
  default     = 1
}

variable "vpn_server_certificate_domain" {
  type        = string
  description = "Domain of the ACM certificate the VPN endpoint presents to clients"
}

variable "vpn_client_ca_certificate_domain" {
  type        = string
  description = <<EOT
    Domain of the ACM certificate for the CA that issues per-user VPN client certificates.
    Each environment needs its own CA, so a certificate issued for one environment's VPN
    can't connect to another's.
  EOT
}
