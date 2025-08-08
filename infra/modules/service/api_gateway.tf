resource "aws_api_gateway_rest_api" "api" {
  count = var.enable_api_gateway ? 1 : 0
  name  = var.service_name

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # checkov:skip=CKV_AWS_237: Address in future work
}

resource "aws_api_gateway_resource" "api_proxy" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api[0].id
  parent_id   = aws_api_gateway_rest_api.api[0].root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "api_proxy_method" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api[0].id
  resource_id = aws_api_gateway_resource.api_proxy[0].id
  http_method = "ANY"

  request_parameters = {
    "method.request.path.proxy" = true
  }

  # We are not using a custom authorization setup at this point, it is handled with the API key
  authorization    = "NONE"
  api_key_required = true

  # checkov:skip=CKV2_AWS_53:This is a full proxy, request validation would add complexity
}

resource "aws_api_gateway_integration" "api_proxy_integration" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api[0].id
  resource_id = aws_api_gateway_resource.api_proxy[0].id
  http_method = aws_api_gateway_method.api_proxy_method[0].http_method

  integration_http_method = aws_api_gateway_method.api_proxy_method[0].http_method
  type                    = "HTTP_PROXY"

  connection_type = "VPC_LINK"
  connection_id   = aws_api_gateway_vpc_link.api_vpc_link[0].id

  uri = "https://${aws_lb.api_vpc_link_nlb[0].dns_name}/{proxy}"

  request_parameters = {
    "integration.request.path.proxy" = "method.request.path.proxy"
  }
}

resource "aws_api_gateway_deployment" "api_deployment" {
  count = var.enable_api_gateway ? 1 : 0

  depends_on = [
    aws_api_gateway_method.api_proxy_method
  ]

  rest_api_id = aws_api_gateway_rest_api.api[0].id

  triggers = {
    redeployment = sha1(
      # Redeploys whenever this file is changed
      filesha1("${abspath(path.module)}/api_gateway.tf")
    )
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_api_gateway_stage" "api_v1_stage" {
  count = var.enable_api_gateway ? 1 : 0

  depends_on = [aws_cloudwatch_log_group.api_gateway_logs]

  deployment_id = aws_api_gateway_deployment.api_deployment[0].id
  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  stage_name    = "v1"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs[0].arn
    format          = "{ \"requestId\":\"$context.requestId\", \"extendedRequestId\":\"$context.extendedRequestId\",\"ip\": \"$context.identity.sourceIp\", \"caller\":\"$context.identity.caller\", \"apiKeyId\":\"$context.identity.apiKeyId\", \"requestTime\":\"$context.requestTime\", \"httpMethod\":\"$context.httpMethod\", \"resourcePath\":\"$context.resourcePath\", \"status\":\"$context.status\", \"protocol\":\"$context.protocol\", \"responseLength\":\"$context.responseLength\", \"responseLatency\": \"$context.responseLatency\" }"
  }

  # checkov:skip=CKV_AWS_73:X-Ray can increase costs greatly, and aren't always necessary
  # checkov:skip=CKV2_AWS_29:WAF can be enabled at a later time if needed
  # checkov:skip=CKV2_AWS_51:Mutual TLS increases complexity for downstream systems
  # checkov:skip=CKV2_AWS_4:Log level and format is already set
  # checkov:skip=CKV_AWS_120:Cache disabled for now, will be followed up in a future ticket
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  count = var.enable_api_gateway ? 1 : 0

  name              = "service/${var.service_name}-api-gateway/v1-stage"
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt gateway logs with customer key in future work
}

resource "aws_api_gateway_method_settings" "api_v1_stage_settings" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api[0].id
  stage_name  = aws_api_gateway_stage.api_v1_stage[0].stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
  # checkov:skip=CKV2_AWS_4:Log level set to info
  # checkov:skip=CKV_AWS_225:Cache disabled for now, will be followed up in a future ticket
}

resource "aws_api_gateway_domain_name" "api" {
  count = var.enable_api_gateway ? 1 : 0
  # This might cause issues with the ALB, since they have the same domain_name
  domain_name              = var.domain_name
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # checkov:skip=CKV_AWS_206: Address in future work
}

# Leave disabled until the domain name is figured for ALB vs API gateway above
# resource "aws_api_gateway_base_path_mapping" "api_domain_name_mapping" {
#   count                    = var.enable_api_gateway ? 1 : 0
#   api_id      = aws_api_gateway_rest_api.api.id
#   domain_name = aws_api_gateway_domain_name.api.domain_name
# }

resource "aws_api_gateway_usage_plan" "api_public_usage_plan" {
  count = var.enable_api_gateway ? 1 : 0

  name = "${var.service_name}-public-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.api[0].id
    stage  = aws_api_gateway_stage.api_v1_stage[0].stage_name
  }

  # Global level throttling for this usage plan
  throttle_settings {
    rate_limit = 10
  }

  # Limits the public usage plan to 250k a month
  quota_settings {
    limit  = 250000
    period = "MONTH"
  }
}

resource "aws_api_gateway_usage_plan" "api_internal_usage_plan" {
  count = var.enable_api_gateway ? 1 : 0

  name = "${var.service_name}-internal-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.api[0].id
    stage  = aws_api_gateway_stage.api_v1_stage[0].stage_name
  }
}

data "aws_iam_policy_document" "api_access_restriction" {
  count = var.enable_api_gateway ? 1 : 0

  # Use this to block any traffic from specific CIDRs
  # statement {
  #   effect = "Deny"

  #   principals {
  #     type        = "AWS"
  #     identifiers = ["*"]
  #   }

  #   actions   = ["execute-api:Invoke"]
  #   resources = ["${aws_api_gateway_rest_api.salesforce_api_gw.execution_arn}/*/*/*"]

  #   condition {
  #     test     = "IpAddress"
  #     variable = "aws:SourceIp"
  #     values = [
  #       "W.X.Y.Z/24",
  #       "A.B.C.D/28"
  #     ]
  #   }
  # }
  # checkov:skip=CKV_AWS_283: The * identifier is required for allowing any access that doesn't fail above
  # If none of the above denies apply, allow the traffic to hit the gateway
  statement {
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["execute-api:Invoke"]
    resources = ["${aws_api_gateway_rest_api.api[0].execution_arn}/*/*/*"]
  }
}

resource "aws_api_gateway_rest_api_policy" "api_access_restriction" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api[0].id
  policy      = data.aws_iam_policy_document.api_access_restriction[0].json
}

# Lets the API gateway forward traffic to the LB
resource "aws_api_gateway_vpc_link" "api_vpc_link" {
  count = var.enable_api_gateway ? 1 : 0

  name        = var.service_name
  description = "Forwards traffic from the gateway to the ${var.service_name} via the LB"
  target_arns = [aws_lb.api_vpc_link_nlb[0].arn]
}

resource "aws_lb" "api_vpc_link_nlb" {
  count = var.enable_api_gateway ? 1 : 0

  name               = "${var.service_name}-api-gateway-nlb"
  internal           = true
  load_balancer_type = "network"
  subnets            = var.private_subnet_ids

  enable_deletion_protection       = true
  enable_cross_zone_load_balancing = true

  security_groups = [
    aws_security_group.api_vpc_link_nlb_sg[0].id
  ]

  # checkov:skip=CKV_AWS_91: API gateway and downstream ALB has logging, enabling logging here won't give a huge benefit
}

resource "aws_security_group" "api_vpc_link_nlb_sg" {
  count = var.enable_api_gateway ? 1 : 0

  name        = "${var.service_name}-api-gateway-nlb"
  description = "NLB security group to allow access to ALB for API Gateway"
  vpc_id      = var.vpc_id

  # checkov:skip=CKV2_AWS_5: Security group is attached to the NLB above
}

resource "aws_vpc_security_group_egress_rule" "api_vpc_link_nlb_to_alb" {
  count = var.enable_api_gateway ? 1 : 0

  security_group_id = aws_security_group.api_vpc_link_nlb_sg[0].id

  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
  referenced_security_group_id = aws_security_group.alb.id
  description                  = "Allows outbound access to only the ALB"
}

# The inbound traffic allowed, the API gateway traffic technically comes via
# an Amazon owned AWS account, so we have to have the CIDR open
#tfsec:ignore:aws-ec2-no-public-ingress-sgr: VPC service for API GW -> NLB comes via Amazon AWS account
resource "aws_security_group_rule" "api_vpc_link_allow_inbound_to_nlb" {
  count = var.enable_api_gateway ? 1 : 0

  security_group_id = aws_security_group.api_vpc_link_nlb_sg[0].id

  description = "Allows access to the NLB port from public since API Gateway VPC link traffic comes from Amazon accounts"

  type        = "ingress"
  cidr_blocks = ["0.0.0.0/0"]
  from_port   = 443
  to_port     = 443
  protocol    = "tcp"
}

resource "aws_lb_target_group" "api_nlb_tg" {
  count = var.enable_api_gateway ? 1 : 0

  name     = "${var.service_name}-api-gateway-nlb-alb"
  port     = 443
  protocol = "TLS"
  vpc_id   = var.vpc_id

  target_type       = "alb"
  proxy_protocol_v2 = true

  health_check {
    path     = "/health"
    protocol = "HTTPS"
  }
}

resource "aws_lb_target_group_attachment" "api_vpc_link_nlb_to_alb_target" {
  count = var.enable_api_gateway ? 1 : 0

  target_group_arn = aws_lb_target_group.api_nlb_tg[0].arn
  target_id        = aws_lb.alb[0].arn
  port             = 443
}

resource "aws_lb_listener" "api_vpc_link_nlb_listener" {
  count = var.enable_api_gateway ? 1 : 0

  load_balancer_arn = aws_lb.api_vpc_link_nlb[0].arn
  port              = 443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api_nlb_tg[0].arn
  }
}
