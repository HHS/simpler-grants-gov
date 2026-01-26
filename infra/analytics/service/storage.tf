locals {
  storage_config = local.environment_config.storage_config
  bucket_name    = "${local.prefix}${local.storage_config.bucket_name}"
}

module "storage" {
  source       = "../../modules/storage"
  name         = local.bucket_name
  is_temporary = local.is_temporary
}
