locals {
  domain_config = {
    hosted_zone  = local.network_config.domain_config.hosted_zone
    domain_name  = var.domain_name
    enable_https = var.enable_https
  }
}
