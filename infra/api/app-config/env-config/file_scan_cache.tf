# DynamoDB table configuration for file scan caching
locals {
  file_scan_cache_config = {
    table_name                     = "${var.app_name}-${var.environment}-file-scan-cache"
    enable_point_in_time_recovery = var.file_scan_cache_enable_pitr
  }
}
