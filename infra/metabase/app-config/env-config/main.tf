locals {
  network_config = module.project_config.network_configs[var.network_name]
}

module "project_config" {
  source = "../../../project-config"
}
