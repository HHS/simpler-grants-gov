# We won't delete the KMS key, but we will mark it as no longer in use.
# We don't delete it because that would violate an AWS security best practice.
resource "aws_kms_key" "dms_endpoints" {
  description         = "NO LONGER IN USE"
  enable_key_rotation = true
}
