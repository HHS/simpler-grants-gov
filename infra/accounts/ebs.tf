#===================================
# EBS
#===================================

# EC2.7: Enable EBS default encryption
# This ensures all new EBS volumes are encrypted by default
resource "aws_ebs_encryption_by_default" "main" {
  enabled = true
}

# Data source to get the AWS managed EBS key
data "aws_kms_key" "ebs" {
  key_id = "alias/aws/ebs"
}

# Use the default AWS managed key (aws/ebs) for encryption
# Can be changed to a customer-managed KMS key if needed
resource "aws_ebs_default_kms_key" "main" {
  key_arn = data.aws_kms_key.ebs.arn
}
