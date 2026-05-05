locals {
  file_scan_cache_config = local.environment_config.file_scan_cache_config
  file_scan_cache_environment_variables = {
    FILE_SCAN_CACHE_TABLE_NAME = module.file_scan_cache.table_name
  }
}

module "file_scan_cache" {
  source = "../../modules/file-scan-cache"

  name = "${local.prefix}${local.file_scan_cache_config.table_name}"
}
