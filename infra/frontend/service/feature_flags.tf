locals {
  feature_flags_config = local.environment_config.feature_flags_config

  feature_flags_secrets = [
    for feature_flag in keys(local.feature_flags_config) : {
      name      = "FF_${feature_flag}"
      valueFrom = module.feature_flags.ssm_parameter_arns[feature_flag]
    }
  ]
}

module "feature_flags" {
  source        = "../../modules/feature_flags"
  service_name  = local.service_name
  feature_flags = local.feature_flags_config
}
