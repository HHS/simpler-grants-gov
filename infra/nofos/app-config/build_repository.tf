data "external" "account_ids_by_name" {
  program = ["${path.module}/../../../bin/account-ids-by-name"]
}

locals {
  image_repository_name         = "${local.project_name}-${local.app_name}"
  image_repository_region       = module.project_config.default_region
  image_repository_account_name = module.project_config.network_configs[local.shared_network_name].account_name
  image_repository_account_id   = data.external.account_ids_by_name.result[local.image_repository_account_name]

  build_repository_config = {
    name           = local.image_repository_name
    region         = local.image_repository_region
    network_name   = local.shared_network_name
    account_name   = local.image_repository_account_name
    account_id     = local.image_repository_account_id
    repository_arn = "arn:aws:ecr:${local.image_repository_region}:${local.image_repository_account_id}:repository/${local.image_repository_name}"
    repository_url = "${local.image_repository_account_id}.dkr.ecr.${local.image_repository_region}.amazonaws.com/${local.image_repository_name}"
  }
}
