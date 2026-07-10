locals {
  domain_config = local.environment_config.domain_config
}

module "domain" {
  source = "../../modules/domain/data"

  hosted_zone  = local.domain_config.hosted_zone
  domain_name  = local.domain_config.domain_name
  enable_https = local.domain_config.enable_https
}
