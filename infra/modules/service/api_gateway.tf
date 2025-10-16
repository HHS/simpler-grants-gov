resource "aws_api_gateway_rest_api" "api" {
  count = var.enable_api_gateway ? 1 : 0
  name  = var.service_name

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  body = jsonencode({
    "openapi" : "3.0.1",
    "paths" : {
      "/" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      "/health" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/health",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      # Login flow endpoints
      "/v1/users/login" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/v1/users/login",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      "/v1/users/login/callback" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/v1/users/login/callback",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      "/v1/users/login/result" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/v1/users/login/result",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      "/v1/users/token/logout" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/v1/users/token/logout",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      "/v1/users/token/refresh" : {
        "post" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "POST",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/v1/users/token/refresh",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      # Swagger
      "/docs" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/docs",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      "/static/{proxy+}" : {
        "get" : {
          "parameters" : [
            {
              "name" : "proxy",
              "in" : "path",
              "required" : true,
              "schema" : {
                "type" : "string"
              }
            }
          ],
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/static/{proxy}",
            "requestParameters" : {
              "integration.request.path.proxy" : "method.request.path.proxy"
            },
            "passthroughBehavior" : "when_no_match",
            "cacheKeyParameters" : [
              "method.request.path.proxy"
            ]
          }
        }
      },
      # DNS
      "/.well-known/pki-validation/{proxy+}" : {
        "get" : {
          "parameters" : [
            {
              "name" : "proxy",
              "in" : "path",
              "required" : true,
              "schema" : {
                "type" : "string"
              }
            }
          ],
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/.well-known/pki-validation/{proxy}",
            "requestParameters" : {
              "integration.request.path.proxy" : "method.request.path.proxy"
            },
            "passthroughBehavior" : "when_no_match",
            "cacheKeyParameters" : [
              "method.request.path.proxy"
            ]
          }
        }
      },
      # Bots
      "/robots.txt" : {
        "get" : {
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "GET",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/robots.txt",
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      # Legacy SOAP endpoint
      "/{service_name}services/v2/{service_port_name}" : {
        "post" : {
          "parameters" : [
            {
              "name" : "service_name",
              "in" : "path",
              "required" : true,
              "schema" : {
                "type" : "string"
              }
            },
            {
              "name" : "service_port_name",
              "in" : "path",
              "required" : true,
              "schema" : {
                "type" : "string"
              }
            }
          ],
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "POST",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/{service_name}services/v2/{service_port_name}",
            "requestParameters" : {
              "integration.request.path.service_name" : "method.request.path.service_name",
              "integration.request.path.service_port_name" : "method.request.path.service_port_name",
            },
            "passthroughBehavior" : "when_no_match"
          }
        }
      },
      # Else, proxy and require API token auth
      "/{proxy+}" : {
        "x-amazon-apigateway-any-method" : {
          "parameters" : [
            {
              "name" : "proxy",
              "in" : "path",
              "required" : true,
              "schema" : {
                "type" : "string"
              }
            }
          ],
          "security" : [
            {
              "api_key" : []
            }
          ],
          "x-amazon-apigateway-integration" : {
            "type" : "http_proxy",
            "httpMethod" : "ANY",
            "uri" : "https://${var.optional_extra_alb_domains[0]}/{proxy}",
            "requestParameters" : {
              "integration.request.path.proxy" : "method.request.path.proxy",
            },
            "passthroughBehavior" : "when_no_match",
            "timeoutInMillis" : 29000
          }
        }
      },
    }
  })
  # checkov:skip=CKV_AWS_237: Create before destroy is defined in deployment below
  put_rest_api_mode = "merge"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id = aws_api_gateway_rest_api.api[0].id

  triggers = {
    redeployment = sha1(jsonencode(aws_api_gateway_rest_api.api[0].body))
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
  # This will become a different variable since it will be the current API domain and cert
  domain_name              = var.domain_name
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  # checkov:skip=CKV_AWS_206: Address in future work
}

resource "aws_api_gateway_base_path_mapping" "api_domain_name_mapping_v1" {
  count       = var.enable_api_gateway ? 1 : 0
  api_id      = aws_api_gateway_rest_api.api[0].id
  domain_name = aws_api_gateway_domain_name.api[0].domain_name
  stage_name  = aws_api_gateway_stage.api_v1_stage[0].stage_name
}

resource "aws_api_gateway_usage_plan" "api_public_usage_plan" {
  count = var.enable_api_gateway ? 1 : 0

  name = "${var.service_name}-public-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.api[0].id
    stage  = aws_api_gateway_stage.api_v1_stage[0].stage_name
  }

  # Global level throttling for this usage plan
  throttle_settings {
    rate_limit  = 10
    burst_limit = 15
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

resource "aws_api_gateway_api_key" "frontend_api_access" {
  count = var.enable_api_gateway ? 1 : 0

  name = "internal-frontend-${var.environment_name}-key"

  # Because we can't automatically save the value of the token via terraform, we have to manually
  # save it to SSM. That parameter is created below
  description = "Frontend key for access the ${var.service_name} ECS service via the API Gateway"
}
