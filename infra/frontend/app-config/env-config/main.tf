locals {
  bucket_name = "${var.project_name}-${var.app_name}-${var.environment}"

  network_config = module.project_config.network_configs[var.network_name]
}

module "project_config" {
  source = "../../../project-config"
}
