module "prod_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "prod"
  network_name   = "prod"

  # Resolves only inside the prod VPC, including for VPN users.
  domain_name  = "cms.simpler.grants.gov"
  enable_https = true

  service_desired_instance_count = 2

  vpn_client_cidr_block            = "172.16.4.0/22"
  vpn_server_certificate_domain    = "vpn-server.cms.simpler.grants.gov"
  vpn_client_ca_certificate_domain = "vpn-client-ca.cms.simpler.grants.gov"
  # A second subnet association keeps the VPN up if one Availability Zone fails.
  vpn_subnet_count = 2
}
