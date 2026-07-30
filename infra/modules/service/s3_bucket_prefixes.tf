# aws_s3_bucket.bucket_prefix is capped at 37 characters: S3 bucket names max out at 63 and
# Terraform appends a 26-character suffix. "<service_name>-<suffix>" overflows that cap for
# the longer service names — frontend-infra-staging and metabase-infra-staging need 38 for
# "-cdn-access-logs" and "-general-purpose", analytics-infra-staging needs 39, and
# api-infra-staging needs 41 for the "api-analytics-transfer" bucket key. Note that
# api-infra-dev lands on exactly 37, so any environment name a character longer than
# "infra-dev" trips this.
#
# Cap the prefixes rather than renaming any bucket: a prefix already within the limit is left
# byte-identical, so no existing environment sees a diff. That matters because bucket_prefix
# is ForceNew and these buckets set force_destroy = false, so a changed prefix would make
# Terraform try (and fail) to destroy a live bucket. Shortening the suffixes instead — e.g.
# "-gp" for "-general-purpose" — would read better but rewrites 80 prefixes across every
# deployed environment including prod, which is why it is deliberately not done here.
locals {
  s3_bucket_prefix_max_length = 37

  # Prefixes for the singleton buckets this module creates directly.
  s3_named_bucket_prefixes = {
    for name, prefix in {
      access_logs     = "${var.service_name}-access-logs"
      cdn_access_logs = "${var.service_name}-cdn-access-logs"
      general_purpose = "${var.service_name}-general-purpose"
    } :
    name => substr(prefix, 0, min(local.s3_bucket_prefix_max_length, length(prefix)))
  }

  # Prefixes for the per-environment buckets declared in var.s3_buckets, keyed the same way.
  s3_bucket_prefixes = {
    for key in keys(var.s3_buckets) :
    key => substr(
      "${var.service_name}-${key}-",
      0,
      min(local.s3_bucket_prefix_max_length, length("${var.service_name}-${key}-"))
    )
  }
}
