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

module "clamav" {
  source = "../../modules/clamav"

  name = "${local.prefix}${module.app_config.app_name}-${var.environment_name}-clamav"

  s3_bucket_id  = module.service.s3_bucket_ids["file-scan"]
  s3_bucket_arn = module.service.s3_bucket_arns["file-scan"]

  vpc_id             = data.aws_vpc.network.id
  private_subnet_ids = data.aws_subnets.private.ids

  newrelic_entity_guid = local.service_config.newrelic_host_entity_guid
}
