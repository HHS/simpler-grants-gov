locals {
  alpha_applications_model_name = "alphaApplicationsAttachments"
  # Root level paths, and their method types. If the method is an empty list, this has sub-paths, which will be defined
  # in another variable
  # Note that by default, API gateway will encode all bodies of requests, which can cause issues for attachments/uploads.
  # To handle this, you need to create an explicit endpoint that is expecting an upload, and have it use a model. See
  # /alpha/applications/{app_id}/attachments for an example of how this is done
  root_endpoints = [
    # Terraform does not like conditionally setting an object that has different keys, so we have to force set the values
    # from a list, with the index being what is conditional
    {},
    {
      ".well-known"        = [],
      "docs"               = [{ "method" : "GET" }],
      "alpha"              = [],
      "grantsws-agency"    = [],
      "grantsws-applicant" = [],
      "health"             = [{ "method" : "GET" }],
      "openapi.json"       = [{ "method" : "GET" }],
      "robots.txt"         = [{ "method" : "GET" }],
      "static"             = [],
      "v1"                 = [],
      "{proxy+}" = [
        {
          "method" : "ANY",
          "api_key_required" : true,
          "method_parameters" : {
            "method.request.path.proxy" = true
          },
          "request_parameters" : {
            "integration.request.path.proxy" : "method.request.path.proxy",
          }
        }
      ]
    }
  ][var.enable_api_gateway ? 1 : 0]

  first_level_endpoints = [
    {},
    {
      ".well-known/pki-validation"  = [],
      "alpha/applications"          = [],
      "alpha/forms"                 = [],
      "grantsws-agency/services"    = [],
      "grantsws-applicant/services" = [],
      "static/{proxy+}" = [{
        "method" : "ANY",
        "method_parameters" : {
          "method.request.path.proxy" = true
        },
        "request_parameters" : {
          "integration.request.path.proxy" : "method.request.path.proxy",
        }
      }],
      "v1/users" = [],
  }][var.enable_api_gateway ? 1 : 0]

  second_level_endpoints = [
    {},
    {
      ".well-known/pki-validation/{proxy+}" = [{
        "method" : "ANY",
        "method_parameters" : {
          "method.request.path.proxy" = true
        },
        "request_parameters" : {
          "integration.request.path.proxy" : "method.request.path.proxy",
        }
      }],
      "alpha/applications/{application_id}" = [],
      "alpha/forms/{form_id}"               = [],
      "grantsws-agency/services/v2"         = [],
      "grantsws-applicant/services/v2"      = [],
      "v1/users/login"                      = [{ "method" : "GET" }],
      "v1/users/token"                      = [],
  }][var.enable_api_gateway ? 1 : 0]

  third_level_endpoints = [
    {},
    {
      "alpha/applications/{application_id}/attachments" = [{
        "method" : "POST",
        "api_key_required" : true,
        "method_parameters" : {
          "method.request.path.application_id" = true
        },
        "request_parameters" : {
          "integration.request.path.application_id" : "method.request.path.application_id",
        },
        "request_models" : {
          "multipart/form-data" : local.alpha_applications_model_name
        }
      }],
      "alpha/forms/{form_id}/form_instructions" = [],
      "grantsws-agency/services/v2/{service_port_name}" = [{
        "method" : "POST",
        "method_parameters" : {
          "method.request.path.service_port_name" = true
        },
        "request_parameters" : {
          "integration.request.path.service_port_name" : "method.request.path.service_port_name",
        }
      }],
      "grantsws-applicant/services/v2/{service_port_name}" = [{
        "method" : "POST",
        "method_parameters" : {
          "method.request.path.service_port_name" = true
        },
        "request_parameters" : {
          "integration.request.path.service_port_name" : "method.request.path.service_port_name",
        }
      }],
      "v1/users/login/callback" = [{ "method" : "GET" }],
      "v1/users/login/result"   = [{ "method" : "GET" }],
      "v1/users/token/logout"   = [{ "method" : "GET" }],
      "v1/users/token/refresh"  = [{ "method" : "GET" }],
  }][var.enable_api_gateway ? 1 : 0]

  fourth_level_endpoints = [
    {},
    {
      "alpha/forms/{form_id}/form_instructions/{form_instruction_id}" = [{
        "method" : "PUT",
        "api_key_required" : true,
        "method_parameters" : {
          "method.request.path.form_id"             = true,
          "method.request.path.form_instruction_id" = true,
        },
        "request_parameters" : {
          "integration.request.path.form_id" : "method.request.path.form_id",
          "integration.request.path.form_instruction_id" : "method.request.path.form_instruction_id",
        },
        "request_models" : {
          "multipart/form-data" : local.alpha_applications_model_name
        }
      }],
      "alpha/applications/{application_id}/attachments/{application_attachment_id}" = [{
        "method" : "PUT",
        "api_key_required" : true,
        "method_parameters" : {
          "method.request.path.application_id"            = true,
          "method.request.path.application_attachment_id" = true,
        },
        "request_parameters" : {
          "integration.request.path.application_id" : "method.request.path.application_id",
          "integration.request.path.application_attachment_id" : "method.request.path.application_attachment_id",
        },
        "request_models" : {
          "multipart/form-data" : local.alpha_applications_model_name
        }
      }],
  }][var.enable_api_gateway ? 1 : 0]

  # In order to support multiple request methods, we need to be able to loop on all method types
  # the path might have
  flattened_root_endpoints = var.enable_api_gateway ? flatten([
    for endpoint, config_list in local.root_endpoints : [
      for config in config_list : {
        "id" : "${endpoint}-${config.method}",
        "endpoint" : endpoint,
        "method" : config.method,
        "api_key_required" : lookup(config, "api_key_required", false),
        "method_parameters" : lookup(config, "method_parameters", {}),
        "request_parameters" : lookup(config, "request_parameters", {}),
        "request_models" : lookup(config, "request_models", {}),
      }
    ]
  ]) : []
  flattened_first_level_endpoints = var.enable_api_gateway ? flatten([
    for endpoint, config_list in local.first_level_endpoints : [
      for config in config_list : {
        "id" : "${endpoint}-${config.method}",
        "endpoint" : endpoint,
        "method" : config.method,
        "api_key_required" : lookup(config, "api_key_required", false),
        "method_parameters" : lookup(config, "method_parameters", {}),
        "request_parameters" : lookup(config, "request_parameters", {}),
        "request_models" : lookup(config, "request_models", {}),
      }
    ]
  ]) : []
  flattened_second_level_endpoints = var.enable_api_gateway ? flatten([
    for endpoint, config_list in local.second_level_endpoints : [
      for config in config_list : {
        "id" : "${endpoint}-${config.method}",
        "endpoint" : endpoint,
        "method" : config.method,
        "api_key_required" : lookup(config, "api_key_required", false),
        "method_parameters" : lookup(config, "method_parameters", {}),
        "request_parameters" : lookup(config, "request_parameters", {}),
        "request_models" : lookup(config, "request_models", {}),
      }
    ]
  ]) : []
  flattened_third_level_endpoints = var.enable_api_gateway ? flatten([
    for endpoint, config_list in local.third_level_endpoints : [
      for config in config_list : {
        "id" : "${endpoint}-${config.method}",
        "endpoint" : endpoint,
        "method" : config.method,
        "api_key_required" : lookup(config, "api_key_required", false),
        "method_parameters" : lookup(config, "method_parameters", {}),
        "request_parameters" : lookup(config, "request_parameters", {}),
        "request_models" : lookup(config, "request_models", {}),
      }
    ]
  ]) : []
  flattened_fourth_level_endpoints = var.enable_api_gateway ? flatten([
    for endpoint, config_list in local.fourth_level_endpoints : [
      for config in config_list : {
        "id" : "${endpoint}-${config.method}",
        "endpoint" : endpoint,
        "method" : config.method,
        "api_key_required" : lookup(config, "api_key_required", false),
        "method_parameters" : lookup(config, "method_parameters", {}),
        "request_parameters" : lookup(config, "request_parameters", {}),
        "request_models" : lookup(config, "request_models", {}),
      }
    ]
  ]) : []

  root_endpoint_methods         = { for config in local.flattened_root_endpoints : config.id => config }
  first_level_endpoint_methods  = { for config in local.flattened_first_level_endpoints : config.id => config }
  second_level_endpoint_methods = { for config in local.flattened_second_level_endpoints : config.id => config }
  third_level_endpoint_methods  = { for config in local.flattened_third_level_endpoints : config.id => config }
  fourth_level_endpoint_methods = { for config in local.flattened_fourth_level_endpoints : config.id => config }
}

resource "aws_api_gateway_rest_api" "api" {
  # checkov:skip=CKV_AWS_237: Create before destroy is defined in deployment below
  count = var.enable_api_gateway ? 1 : 0
  name  = var.service_name

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  binary_media_types = [
    "multipart/form-data",
  ]
}

resource "aws_api_gateway_model" "alpha_applications_model" {
  count = var.enable_api_gateway ? 1 : 0

  rest_api_id  = aws_api_gateway_rest_api.api[0].id
  name         = local.alpha_applications_model_name
  description  = "Schema for allowing uploads to /alpha/applications/{app_id}/attachments"
  content_type = "application/form-data"

  schema = jsonencode({
    "$schema" : "http://json-schema.org/draft-04/schema#",
    "title" : "MediaFileUpload",
    "type" : "object",
    "properties" : {
      "file" : { "type" : "string" }
    }
  })
}

resource "aws_api_gateway_method" "root" {
  # checkov:skip=CKV_AWS_59: Public endpoints or endpoint that is used as part of a flow don't need auth. Auth is enforced on greedy proxy
  # checkov:skip=CKV2_AWS_53: Integration is proxy to downstream ECS, input validation is done at that level to reduce duplicative work
  count = var.enable_api_gateway ? 1 : 0

  depends_on = [aws_api_gateway_model.alpha_applications_model]

  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  resource_id   = aws_api_gateway_rest_api.api[0].root_resource_id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "root" {
  count = var.enable_api_gateway ? 1 : 0

  depends_on = [aws_api_gateway_method.root]

  http_method             = "GET"
  integration_http_method = "GET"

  resource_id = aws_api_gateway_rest_api.api[0].root_resource_id
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  type        = "HTTP_PROXY"

  passthrough_behavior = "WHEN_NO_MATCH"
  timeout_milliseconds = 29000

  uri = "https://${var.optional_extra_alb_domains[0]}/"
}

resource "aws_api_gateway_resource" "root_endpoints" {
  for_each = local.root_endpoints

  parent_id   = aws_api_gateway_rest_api.api[0].root_resource_id
  path_part   = each.key
  rest_api_id = aws_api_gateway_rest_api.api[0].id
}

resource "aws_api_gateway_method" "root_endpoints" {
  # checkov:skip=CKV2_AWS_53: Integration is proxy to downstream ECS, input validation is done at that level to reduce duplicative work
  for_each = local.root_endpoint_methods

  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  resource_id   = aws_api_gateway_resource.root_endpoints[each.value.endpoint].id
  http_method   = each.value.method
  authorization = "NONE"

  request_parameters = each.value.method_parameters
  request_models     = each.value.request_models
  api_key_required   = each.value.api_key_required
}

resource "aws_api_gateway_integration" "root_endpoints" {
  for_each = local.root_endpoint_methods

  depends_on = [aws_api_gateway_method.root_endpoints]

  http_method             = each.value.method
  integration_http_method = each.value.method

  resource_id = aws_api_gateway_resource.root_endpoints[each.value.endpoint].id
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  type        = "HTTP_PROXY"

  passthrough_behavior = "WHEN_NO_MATCH"
  timeout_milliseconds = 29000

  uri                = "https://${var.optional_extra_alb_domains[0]}/${replace(each.value.endpoint, "+", "")}"
  request_parameters = each.value.request_parameters
}

resource "aws_api_gateway_resource" "first_level_endpoints" {
  for_each = local.first_level_endpoints

  parent_id   = aws_api_gateway_resource.root_endpoints[split("/", each.key)[0]].id
  path_part   = split("/", each.key)[1]
  rest_api_id = aws_api_gateway_rest_api.api[0].id
}

resource "aws_api_gateway_method" "first_level_endpoints" {
  # checkov:skip=CKV2_AWS_53: Integration is proxy to downstream ECS, input validation is done at that level to reduce duplicative work
  for_each = local.first_level_endpoint_methods

  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  resource_id   = aws_api_gateway_resource.first_level_endpoints[each.value.endpoint].id
  http_method   = each.value.method
  authorization = "NONE"

  request_parameters = each.value.method_parameters
  request_models     = each.value.request_models
  api_key_required   = each.value.api_key_required
}

resource "aws_api_gateway_integration" "first_level_endpoints" {
  for_each = local.first_level_endpoint_methods

  depends_on = [aws_api_gateway_method.first_level_endpoints]

  http_method             = each.value.method
  integration_http_method = each.value.method

  resource_id = aws_api_gateway_resource.first_level_endpoints[each.value.endpoint].id
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  type        = "HTTP_PROXY"

  passthrough_behavior = "WHEN_NO_MATCH"
  timeout_milliseconds = 29000

  uri                = "https://${var.optional_extra_alb_domains[0]}/${replace(each.value.endpoint, "+", "")}"
  request_parameters = each.value.request_parameters
}

resource "aws_api_gateway_resource" "second_level_endpoints" {
  for_each = local.second_level_endpoints

  parent_id   = aws_api_gateway_resource.first_level_endpoints[join("/", slice(split("/", each.key), 0, 2))].id
  path_part   = split("/", each.key)[2]
  rest_api_id = aws_api_gateway_rest_api.api[0].id
}

resource "aws_api_gateway_method" "second_level_endpoints" {
  # checkov:skip=CKV2_AWS_53: Integration is proxy to downstream ECS, input validation is done at that level to reduce duplicative work
  for_each = local.second_level_endpoint_methods

  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  resource_id   = aws_api_gateway_resource.second_level_endpoints[each.value.endpoint].id
  http_method   = each.value.method
  authorization = "NONE"

  request_parameters = each.value.method_parameters
  request_models     = each.value.request_models
  api_key_required   = each.value.api_key_required
}

resource "aws_api_gateway_integration" "second_level_endpoints" {
  for_each = local.second_level_endpoint_methods

  depends_on = [aws_api_gateway_method.second_level_endpoints]

  http_method             = each.value.method
  integration_http_method = each.value.method

  resource_id = aws_api_gateway_resource.second_level_endpoints[each.value.endpoint].id
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  type        = "HTTP_PROXY"

  passthrough_behavior = "WHEN_NO_MATCH"
  timeout_milliseconds = 29000

  uri                = "https://${var.optional_extra_alb_domains[0]}/${replace(each.value.endpoint, "+", "")}"
  request_parameters = each.value.request_parameters
}

resource "aws_api_gateway_resource" "third_level_endpoints" {
  for_each = local.third_level_endpoints

  parent_id   = aws_api_gateway_resource.second_level_endpoints[join("/", slice(split("/", each.key), 0, 3))].id
  path_part   = split("/", each.key)[3]
  rest_api_id = aws_api_gateway_rest_api.api[0].id
}

resource "aws_api_gateway_method" "third_level_endpoints" {
  # checkov:skip=CKV2_AWS_53: Integration is proxy to downstream ECS, input validation is done at that level to reduce duplicative work
  for_each = local.third_level_endpoint_methods

  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  resource_id   = aws_api_gateway_resource.third_level_endpoints[each.value.endpoint].id
  http_method   = each.value.method
  authorization = "NONE"

  request_parameters = each.value.method_parameters
  request_models     = each.value.request_models
  api_key_required   = each.value.api_key_required
}

resource "aws_api_gateway_integration" "third_level_endpoints" {
  for_each = local.third_level_endpoint_methods

  depends_on = [aws_api_gateway_method.third_level_endpoints]

  http_method             = each.value.method
  integration_http_method = each.value.method

  resource_id = aws_api_gateway_resource.third_level_endpoints[each.value.endpoint].id
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  type        = "HTTP_PROXY"

  passthrough_behavior = "WHEN_NO_MATCH"
  timeout_milliseconds = 29000

  uri                = "https://${var.optional_extra_alb_domains[0]}/${replace(each.value.endpoint, "+", "")}"
  request_parameters = each.value.request_parameters
}

resource "aws_api_gateway_resource" "fourth_level_endpoints" {
  for_each = local.fourth_level_endpoints

  parent_id   = aws_api_gateway_resource.third_level_endpoints[join("/", slice(split("/", each.key), 0, 4))].id
  path_part   = split("/", each.key)[4]
  rest_api_id = aws_api_gateway_rest_api.api[0].id
}

resource "aws_api_gateway_method" "fourth_level_endpoints" {
  # checkov:skip=CKV2_AWS_53: Integration is proxy to downstream ECS, input validation is done at that level to reduce duplicative work
  for_each = local.fourth_level_endpoint_methods

  rest_api_id   = aws_api_gateway_rest_api.api[0].id
  resource_id   = aws_api_gateway_resource.fourth_level_endpoints[each.value.endpoint].id
  http_method   = each.value.method
  authorization = "NONE"

  request_parameters = each.value.method_parameters
  request_models     = each.value.request_models
  api_key_required   = each.value.api_key_required
}

resource "aws_api_gateway_integration" "fourth_level_endpoints" {
  for_each = local.fourth_level_endpoint_methods

  depends_on = [aws_api_gateway_method.fourth_level_endpoints]

  http_method             = each.value.method
  integration_http_method = each.value.method

  resource_id = aws_api_gateway_resource.fourth_level_endpoints[each.value.endpoint].id
  rest_api_id = aws_api_gateway_rest_api.api[0].id
  type        = "HTTP_PROXY"

  passthrough_behavior = "WHEN_NO_MATCH"
  timeout_milliseconds = 29000

  uri                = "https://${var.optional_extra_alb_domains[0]}/${replace(each.value.endpoint, "+", "")}"
  request_parameters = each.value.request_parameters
}

resource "aws_api_gateway_deployment" "api_deployment" {
  count = var.enable_api_gateway ? 1 : 0

  depends_on = [
    aws_api_gateway_integration.root,
    aws_api_gateway_integration.first_level_endpoints,
    aws_api_gateway_integration.second_level_endpoints,
    aws_api_gateway_integration.third_level_endpoints,
    aws_api_gateway_integration.fourth_level_endpoints,
  ]

  rest_api_id = aws_api_gateway_rest_api.api[0].id

  # Redeploys on any change to this file
  triggers = {
    redeployment = filesha1("${path.module}/api_gateway.tf")
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

resource "aws_api_gateway_usage_plan_key" "frontend_api_access" {
  count = var.enable_api_gateway ? 1 : 0

  key_id        = aws_api_gateway_api_key.frontend_api_access[0].id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.api_internal_usage_plan[0].id
}
