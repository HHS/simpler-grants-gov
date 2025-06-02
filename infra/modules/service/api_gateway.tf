resource "aws_api_gateway_rest_api" "api" {
  count = var.enable_api_gateway ? 1 : 0
  name  = var.service_name

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_deployment" "api" {
  count       = var.enable_api_gateway ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.api[0].id

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api" {
  count         = var.enable_api_gateway ? 1 : 0
  deployment_id = aws_api_gateway_deployment.api[0].id
  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  stage_name    = var.environment_name
}

resource "aws_api_gateway_method_settings" "api" {
  count       = var.enable_api_gateway ? 1 : 0
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  stage_name  = aws_api_gateway_stage.api[0].stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
  }
}

resource "aws_api_gateway_domain_name" "api" {
  count                    = var.enable_api_gateway ? 1 : 0
  domain_name              = var.domain_name
  regional_certificate_arn = local.cdn_certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }
}

resource "aws_api_gateway_base_path_mapping" "api" {
  count       = var.enable_api_gateway ? 1 : 0
  api_id      = aws_api_gateway_rest_api.api[0].id
  domain_name = var.domain_name
  stage_name  = aws_api_gateway_stage.api[0].stage_name
}
