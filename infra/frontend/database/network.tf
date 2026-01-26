module "network" {
  source       = "../../modules/network/data"
  project_name = module.project_config.project_name
  name         = local.environment_config.network_name
}
