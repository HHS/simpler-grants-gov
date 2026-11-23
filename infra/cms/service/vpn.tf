#----------------------------------------------------------------------------
# AWS Client VPN for content managers
#
# Content managers connect to this VPN, then sign in to Drupal. Users authenticate
# with a per-user client certificate issued by the CMS VPN client CA. VPN users can
# reach Drupal's internal load balancer and the VPC DNS resolver, and nothing else.
# See documentation/infra/cms-vpn.md for issuing and revoking client certificates.
#----------------------------------------------------------------------------

module "network" {
  source       = "../../modules/network/data"
  name         = local.environment_config.network_name
  project_name = module.project_config.project_name
}

locals {
  vpn_name = "${local.service_config.service_name}-vpn"

  # The Amazon-provided DNS server is at the VPC's base address plus two. VPN clients
  # use it to resolve Drupal's private hostname.
  vpc_dns_server = cidrhost(data.aws_vpc.network.cidr_block, 2)
}

data "aws_acm_certificate" "vpn_server" {
  domain      = local.vpn_config.server_certificate_domain
  most_recent = true
}

data "aws_acm_certificate" "vpn_client_ca" {
  domain      = local.vpn_config.client_ca_certificate_domain
  most_recent = true
}

resource "aws_security_group" "vpn" {
  name_prefix = local.vpn_name
  description = "Client VPN endpoint for CMS content managers. Allows only Drupal and DNS."
  vpc_id      = data.aws_vpc.network.id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_vpc_security_group_egress_rule" "vpn_to_cms" {
  security_group_id            = aws_security_group.vpn.id
  description                  = "HTTPS to Drupal's internal load balancer"
  ip_protocol                  = "tcp"
  from_port                    = 443
  to_port                      = 443
  referenced_security_group_id = module.service.internal_alb_security_group_id
}

resource "aws_vpc_security_group_egress_rule" "vpn_dns" {
  for_each = toset(["udp", "tcp"])

  security_group_id = aws_security_group.vpn.id
  description       = "DNS to the VPC resolver"
  ip_protocol       = each.key
  from_port         = 53
  to_port           = 53
  cidr_ipv4         = "${local.vpc_dns_server}/32"
}

resource "aws_cloudwatch_log_group" "vpn_connections" {
  # checkov:skip=CKV_AWS_158:Encrypt VPN connection logs with customer key in future work, matching the service logs
  name              = "/aws/client-vpn/${local.vpn_name}"
  retention_in_days = 365
}

resource "aws_cloudwatch_log_stream" "vpn_connections" {
  name           = "connections"
  log_group_name = aws_cloudwatch_log_group.vpn_connections.name
}

resource "aws_ec2_client_vpn_endpoint" "cms" {
  description            = local.vpn_name
  server_certificate_arn = data.aws_acm_certificate.vpn_server.arn
  client_cidr_block      = local.vpn_config.client_cidr_block
  vpc_id                 = data.aws_vpc.network.id
  security_group_ids     = [aws_security_group.vpn.id]
  dns_servers            = [local.vpc_dns_server]

  # Only traffic for the VPC goes through the VPN. Users' other traffic stays local.
  split_tunnel          = true
  transport_protocol    = "udp"
  session_timeout_hours = 8

  authentication_options {
    type                       = "certificate-authentication"
    root_certificate_chain_arn = data.aws_acm_certificate.vpn_client_ca.arn
  }

  connection_log_options {
    enabled               = true
    cloudwatch_log_group  = aws_cloudwatch_log_group.vpn_connections.name
    cloudwatch_log_stream = aws_cloudwatch_log_stream.vpn_connections.name
  }

  client_login_banner_options {
    enabled     = true
    banner_text = "You are accessing a U.S. Government information system. Use is monitored and limited to authorized Simpler.Grants.gov CMS work."
  }

  tags = {
    Name = local.vpn_name
  }
}

resource "aws_ec2_client_vpn_network_association" "cms" {
  count = local.vpn_config.subnet_count

  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.cms.id
  subnet_id              = module.network.private_subnet_ids[count.index]
}

# Client VPN authorization rules work on CIDR ranges, so this allows the whole VPC.
# The VPN security group above is what limits users to Drupal and DNS.
resource "aws_ec2_client_vpn_authorization_rule" "vpc" {
  client_vpn_endpoint_id = aws_ec2_client_vpn_endpoint.cms.id
  target_network_cidr    = data.aws_vpc.network.cidr_block
  authorize_all_groups   = true
  description            = "VPC access, limited to Drupal and DNS by the VPN security group"
}
