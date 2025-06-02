resource "aws_api_gateway_rest_api" "api" {
  count = var.enable_api_gateway ? 1 : 0
  name  = var.service_name

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # checkov:skip=CKV_AWS_237: Address in future work
}

resource "aws_api_gateway_domain_name" "api" {
  count                    = var.enable_api_gateway ? 1 : 0
  domain_name              = var.domain_name
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # checkov:skip=CKV_AWS_206: Address in future work
}
