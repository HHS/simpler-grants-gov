# ClamAV virus scanner for the file-scan S3 bucket.
#
# Before the first terraform apply on a fresh checkout, build the ClamAV
# Lambda layer locally:
#
#   ./infra/modules/clamav/build-layer.sh
#
# That script uses Docker to extract clamav binaries from Amazon Linux 2023
# and writes layer.zip next to itself. After the first apply the freshclam
# Lambda needs to be invoked once (manually or just wait for the EventBridge
# schedule) to populate the EFS-mounted signature database; until then the
# scanner logs "skipped: signature database not yet populated on EFS".

# API key the scanner authenticates with (X-API-Key) when posting scan results.
# Stored out-of-band as a SecureString, the same manual-secret convention the
# API service uses (see infra/api/app-config/env-config/environment_variables.tf).
# It must match the key_id on the internal scanner user's user_api_key row.
data "aws_ssm_parameter" "file_scan_api_key" {
  name = "/api/${var.environment_name}/file-scan-api-key"
}

module "clamav" {
  source = "../../modules/clamav"

  name = "${local.prefix}${module.app_config.app_name}-${var.environment_name}-clamav"

  s3_bucket_id  = module.service.s3_bucket_ids["file-scan"]
  s3_bucket_arn = module.service.s3_bucket_arns["file-scan"]

  vpc_id             = data.aws_vpc.network.id
  private_subnet_ids = data.aws_subnets.private.ids

  api_base_url      = "https://${local.service_config.domain_name}"
  file_scan_api_key = data.aws_ssm_parameter.file_scan_api_key.value

  file_scan_cache_table_name = module.file_scan_cache.table_name
  dynamodb_write_policy_arn  = module.file_scan_cache.write_access_policy_arn

  newrelic_entity_guid = local.service_config.newrelic_host_entity_guid
}
