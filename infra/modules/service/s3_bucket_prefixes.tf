# aws_s3_bucket.bucket_prefix is capped at 37 characters:
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
