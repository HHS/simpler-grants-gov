# Lambda@Edge functions must be created in us-east-1 region
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

# Create zip files for Lambda@Edge functions
data "archive_file" "lambda_edge_viewer_request" {
  count = local.enable_cdn && var.enable_lambda_edge && var.lambda_edge_viewer_request_path != null ? 1 : 0

  type        = "zip"
  source_file = var.lambda_edge_viewer_request_path
  output_path = "${path.module}/.terraform/lambda-edge-viewer-request.zip"
}

data "archive_file" "lambda_edge_origin_response" {
  count = local.enable_cdn && var.enable_lambda_edge && var.lambda_edge_origin_response_path != null ? 1 : 0

  type        = "zip"
  source_file = var.lambda_edge_origin_response_path
  output_path = "${path.module}/.terraform/lambda-edge-origin-response.zip"
}

# IAM role for Lambda@Edge functions (shared by both)
resource "aws_iam_role" "lambda_edge" {
  count = local.enable_cdn && var.enable_lambda_edge ? 1 : 0

  provider = aws.us_east_1

  name = "${var.service_name}-lambda-edge"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
      }
    ]
  })
}

# IAM policy for Lambda@Edge - minimal permissions needed
resource "aws_iam_role_policy" "lambda_edge" {
  count = local.enable_cdn && var.enable_lambda_edge ? 1 : 0

  provider = aws.us_east_1

  name = "${var.service_name}-lambda-edge-policy"
  role = aws_iam_role.lambda_edge[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}


resource "aws_lambda_function" "edge_viewer_request" {
  #checkov:skip=CKV_AWS_50:X-Ray tracing not required for Lambda@Edge
  #checkov:skip=CKV_AWS_116:DLQ not supported for Lambda@Edge
  #checkov:skip=CKV_AWS_115:Concurrent execution limit not required for Lambda@Edge
  #checkov:skip=CKV_AWS_272:Code signing not required for Lambda@Edge
  #checkov:skip=CKV_AWS_117:VPC not supported for Lambda@Edge
  # Lambda@Edge function for viewer-request event
  count = local.enable_cdn && var.enable_lambda_edge && var.lambda_edge_viewer_request_path != null ? 1 : 0

  provider = aws.us_east_1

  filename         = data.archive_file.lambda_edge_viewer_request[0].output_path
  function_name    = "${var.service_name}-lambda-edge-viewer-request"
  role             = aws_iam_role.lambda_edge[0].arn
  handler          = "index.lambda_handler"
  runtime          = "python3.11"
  publish          = true # Required for Lambda@Edge - creates a version
  source_code_hash = data.archive_file.lambda_edge_viewer_request[0].output_base64sha256

  timeout = 5 # Lambda@Edge has max 5 second timeout for viewer-request

  depends_on = [
    aws_iam_role_policy.lambda_edge[0]
  ]
}

# Lambda@Edge function for origin-response event
resource "aws_lambda_function" "edge_origin_response" {
  #checkov:skip=CKV_AWS_50:X-Ray tracing not required for Lambda@Edge
  #checkov:skip=CKV_AWS_116:DLQ not supported for Lambda@Edge
  #checkov:skip=CKV_AWS_115:Concurrent execution limit not required for Lambda@Edge
  #checkov:skip=CKV_AWS_272:Code signing not required for Lambda@Edge
  #checkov:skip=CKV_AWS_117:VPC not supported for Lambda@Edge
  count = local.enable_cdn && var.enable_lambda_edge && var.lambda_edge_origin_response_path != null ? 1 : 0

  provider = aws.us_east_1

  filename         = data.archive_file.lambda_edge_origin_response[0].output_path
  function_name    = "${var.service_name}-lambda-edge-origin-response"
  role             = aws_iam_role.lambda_edge[0].arn
  handler          = "index.lambda_handler"
  runtime          = "python3.11"
  publish          = true # Required for Lambda@Edge - creates a version
  source_code_hash = data.archive_file.lambda_edge_origin_response[0].output_base64sha256

  timeout = 5 # Lambda@Edge has max 5 second timeout for origin-response

  depends_on = [
    aws_iam_role_policy.lambda_edge[0]
  ]
}

