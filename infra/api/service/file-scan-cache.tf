locals {
  file_scan_cache_config = local.environment_config.file_scan_cache_config
  file_scan_cache_environment_variables = {
    FILE_SCAN_CACHE_TABLE_NAME = module.file_scan_cache.table_name
  }
}

module "file_scan_cache" {
  source = "../../modules/file-scan-cache"

  name                           = "${local.prefix}${local.file_scan_cache_config.table_name}"
  enable_point_in_time_recovery = local.file_scan_cache_config.enable_point_in_time_recovery
}

# Attach read access policy to the app service role (for backend API)
resource "aws_iam_role_policy_attachment" "app_service_file_scan_cache_read" {
  role       = module.service.app_service_arn
  policy_arn = module.file_scan_cache.read_access_policy_arn
}

# Attach write access policy to the app service role (for workflow/lambda)
resource "aws_iam_role_policy_attachment" "app_service_file_scan_cache_write" {
  role       = module.service.app_service_arn
  policy_arn = module.file_scan_cache.write_access_policy_arn
}
