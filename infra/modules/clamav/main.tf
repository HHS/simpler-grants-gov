data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  scanner_name   = "${var.name}-scanner"
  freshclam_name = "${var.name}-freshclam"
  layer_name     = "${var.name}-binaries"

  # The mount path Lambdas use to access the EFS access point. Must be
  # under /mnt — Lambda's filesystem is otherwise read-only.
  efs_mount_path = "/mnt/clamav"

  scanner_log_group   = "/aws/lambda/${local.scanner_name}"
  freshclam_log_group = "/aws/lambda/${local.freshclam_name}"
}
