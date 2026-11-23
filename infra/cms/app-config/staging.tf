module "staging_config" {
  source         = "./env-config"
  project_name   = local.project_name
  app_name       = local.app_name
  default_region = module.project_config.default_region
  environment    = "staging"
  network_name   = "staging"

  # Resolves only inside the staging VPC, including for VPN users.
  domain_name  = "cms.staging.simpler.grants.gov"
  enable_https = true

  vpn_client_cidr_block = "172.16.0.0/22"
}
