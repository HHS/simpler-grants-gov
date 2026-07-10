# DynamoDB table for file scan caching
resource "aws_dynamodb_table" "file_scan_cache" {
  #checkov:skip=CKV_AWS_119:Cache table uses AWS managed encryption, CMK not required
  #checkov:skip=CKV_AWS_28:Point-in-time recovery not required
  name         = var.name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "file_id"

  attribute {
    name = "file_id"
    type = "S"
  }

  # Enable TTL for automatic cleanup of old scan records
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  # Server-side encryption using AWS managed keys
  server_side_encryption {
    enabled = true
  }

  tags = {
    name = var.name
  }
}

# IAM policy for read access to the DynamoDB table
data "aws_iam_policy_document" "read_access_policy" {
  statement {
    sid    = "AllowDynamoDBReadAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:BatchGetItem",
    ]
    resources = [
      aws_dynamodb_table.file_scan_cache.arn,
    ]
  }
}

resource "aws_iam_policy" "read_access_policy" {
  name   = "${var.name}-read-access"
  policy = data.aws_iam_policy_document.read_access_policy.json

  tags = {
    name = "${var.name}-read-access"
  }
}

# IAM policy for write access to the DynamoDB table
data "aws_iam_policy_document" "write_access_policy" {
  statement {
    sid    = "AllowDynamoDBWriteAccess"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:BatchWriteItem",
      "dynamodb:DeleteItem",
    ]
    resources = [
      aws_dynamodb_table.file_scan_cache.arn,
    ]
  }
}

resource "aws_iam_policy" "write_access_policy" {
  name   = "${var.name}-write-access"
  policy = data.aws_iam_policy_document.write_access_policy.json

  tags = {
    name = "${var.name}-write-access"
  }
}
