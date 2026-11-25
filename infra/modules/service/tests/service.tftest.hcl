mock_provider "aws" {
  mock_data "aws_iam_policy_document" {
    defaults = {
      json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}"
    }
  }
  # network/data module returns ids[0] — mock must return a non-empty list
  mock_data "aws_security_groups" {
    defaults = {
      ids = ["sg-0123456789abcdef0"]
    }
  }
}
mock_provider "external" {
  mock_data "external" {
    defaults = {
      result = { value = "mock-value" }
    }
  }
}

# Required variables shared across all runs
variables {
  aws_services_security_group_id = "sg-0123456789abcdef0"
  image_tag                      = "v1.0.0"
  image_repository_url           = "123456789012.dkr.ecr.us-east-1.amazonaws.com/my-app"
  network_name                   = "test"
  project_name                   = "simpler-grants-gov"
  service_name                   = "test-service"
}

run "rejects_service_name_with_uppercase_letters" {
  command = plan

  variables {
    service_name = "MyService"
  }

  expect_failures = [var.service_name]
}

run "rejects_service_name_with_spaces" {
  command = plan

  variables {
    service_name = "my service"
  }

  expect_failures = [var.service_name]
}

run "rejects_scheduled_job_with_invalid_role_override" {
  command = plan

  variables {
    scheduled_jobs = {
      "sync-job" = {
        task_command        = ["python", "sync.py"]
        schedule_expression = "rate(1 day)"
        state               = "ENABLED"
        role_override       = "admin"
      }
    }
  }

  expect_failures = [var.scheduled_jobs]
}

run "no_alb_created_when_load_balancer_disabled" {
  command = plan

  variables {
    load_balancer_mode = "none"
  }

  assert {
    condition     = length(aws_lb.alb) == 0
    error_message = "No ALB should be created when load_balancer_mode is none"
  }
}

run "alb_created_when_load_balancer_enabled" {
  command = plan

  assert {
    condition     = length(aws_lb.alb) == 1
    error_message = "One ALB should be created in the default public mode"
  }
}

run "no_autoscaling_resources_by_default" {
  command = plan

  assert {
    condition     = length(aws_appautoscaling_target.ecs_target) == 0
    error_message = "Autoscaling target should not be created when enable_autoscaling is false (default)"
  }
}

run "autoscaling_resources_created_when_enabled" {
  command = plan

  variables {
    enable_autoscaling = true
    min_capacity       = 2
    max_capacity       = 6
  }

  assert {
    condition     = length(aws_appautoscaling_target.ecs_target) == 1
    error_message = "Autoscaling target should be created when enable_autoscaling is true"
  }

  assert {
    condition     = aws_appautoscaling_target.ecs_target[0].min_capacity == var.min_capacity
    error_message = "Autoscaling min_capacity should match var.min_capacity"
  }

  assert {
    condition     = aws_appautoscaling_target.ecs_target[0].max_capacity == var.max_capacity
    error_message = "Autoscaling max_capacity should match var.max_capacity"
  }
}

run "second_mtls_alb_added_when_mtls_enabled" {
  command = plan

  variables {
    enable_mtls_load_balancer = true
    certificate_arn           = "arn:aws:acm:us-east-1:123456789012:certificate/abc"
    mtls_certificate_arn      = "arn:aws:acm:us-east-1:123456789012:certificate/def"
  }

  assert {
    condition     = length(aws_lb.alb) == 2
    error_message = "Two ALBs should exist when both load balancer and mTLS are enabled"
  }
}

run "ecs_cluster_name_matches_service_name" {
  command = plan

  assert {
    condition     = aws_ecs_cluster.cluster.name == var.service_name
    error_message = "ECS cluster name must match service_name"
  }
}

run "task_definition_family_matches_service_name" {
  command = plan

  assert {
    condition     = aws_ecs_task_definition.app.family == var.service_name
    error_message = "Task definition family must match service_name"
  }
}

run "ecs_run_task_retries_capacity_errors_but_not_task_failures" {
  command = plan

  assert {
    condition     = local.ecs_run_task_retry[0].ErrorEquals == ["ECS.AmazonECSException"]
    error_message = "Retry must cover ECS.AmazonECSException and nothing else: States.TaskFailed and ECS.ServerException can both fire after the container started, where a retry would double-run the job"
  }

  assert {
    condition     = local.ecs_run_task_retry[0].MaxDelaySeconds <= 120
    error_message = "Backoff must stay capped so a retried job cannot drift into the next run of an hourly schedule"
  }

  assert {
    condition     = local.ecs_run_task_catch[0].Next == "JobFailed"
    error_message = "Failures must be caught and routed to the JobFailed state"
  }

  assert {
    condition     = local.ecs_run_task_catch[0].ResultPath == "$.error"
    error_message = "Caught error must be placed at $.error so JobFailed can format it into the cause"
  }
}

# The rendered state machine definitions embed cluster and task-definition
# ARNs, so they are unknown at plan time and cannot be asserted on here.
# Instead both files build their CausePath from this one shared local, so a
# change in either file goes through an assertion.
run "job_failed_cause_passes_the_error_as_arguments" {
  command = plan

  # A quote or brace reaching the ASL template would break the intrinsic at
  # apply time or runtime, so the caught error must arrive as an argument.
  assert {
    condition     = endswith(local.job_failed_cause_suffix, "$.error.Error, $.error.Cause)")
    error_message = "JobFailed must pass the caught error as States.Format arguments, not interpolate it into the template"
  }

  # Two placeholders, matching the two arguments.
  assert {
    condition     = length(regexall("\\{\\}", local.job_failed_cause_suffix)) == 2
    error_message = "States.Format placeholder count must match the number of arguments passed"
  }
}

run "default_waf_metric_identity_is_unchanged" {
  command = plan
  assert {
    condition     = output.waf_metric_name == "WAF_Common_Protections"
    error_message = "Existing services must retain their existing WAF metric identity."
  }
}

run "explicit_waf_metric_identity_is_exported" {
  command = plan
  variables {
    waf_metric_name = "nofos-infra-dev-waf"
  }
  assert {
    condition     = output.waf_metric_name == "nofos-infra-dev-waf"
    error_message = "Monitoring must receive the actual visibility metric name."
  }
}

run "rejects_unknown_load_balancer_mode" {
  command = plan

  variables {
    load_balancer_mode = "internal"
  }

  expect_failures = [var.load_balancer_mode]
}

run "private_load_balancer_has_no_public_alb" {
  command = plan

  variables {
    load_balancer_mode = "private"
    domain_name        = "cms.staging.example.gov"
    certificate_arn    = "arn:aws:acm:us-east-1:123456789012:certificate/mock"
    internal_alb_ingress_security_group_ids = {
      frontend = "sg-0fedcba9876543210"
    }
  }

  assert {
    condition     = length(aws_lb.alb) == 0 && length(aws_security_group.alb_restricted) == 0
    error_message = "A private-only service must not create a public ALB"
  }

  assert {
    condition     = length(aws_lb.internal) == 1 && length(aws_lb_listener.internal_https) == 1
    error_message = "A private-only service must be served by the internal ALB over HTTPS"
  }

  assert {
    condition     = aws_route53_zone.internal_alb[0].name == "cms.staging.example.gov"
    error_message = "domain_name must resolve to the internal ALB through a private hosted zone"
  }

  assert {
    condition     = length(aws_security_group_rule.internal_alb_ingress_from_vpc) == 0
    error_message = "A private-only service must not allow VPC-wide ingress"
  }

  assert {
    condition     = keys(aws_security_group_rule.internal_alb_ingress_from_security_groups) == ["frontend"]
    error_message = "Only the listed security groups may reach the internal ALB"
  }
}

run "secure_alb_keeps_restricted_public_alb_and_vpc_ingress" {
  command = plan

  # Secure mode is used with the API Gateway VPC Link, as in the api service
  variables {
    load_balancer_mode = "secure"
    enable_api_gateway = true
    domain_name        = "api.staging.example.gov"
    internal_alb_ingress_security_group_ids = {
      ignored = "sg-0fedcba9876543210"
    }
  }

  override_data {
    target = data.aws_vpc.internal_alb[0]
    values = {
      cidr_block = "10.0.0.0/20"
    }
  }

  assert {
    condition     = length(aws_lb.alb) == 1 && length(aws_security_group.alb_restricted) == 1
    error_message = "Secure mode must keep the restricted public ALB"
  }

  assert {
    condition     = length(aws_security_group_rule.internal_alb_ingress_from_vpc) == 1
    error_message = "Secure mode must keep VPC-wide ingress to the internal ALB"
  }

  assert {
    condition     = length(aws_security_group_rule.internal_alb_ingress_from_security_groups) == 0
    error_message = "Named ingress applies only in private mode"
  }
}

run "usage_plan_id_env_var_set_when_api_gateway_enabled" {
  command = plan

  variables {
    load_balancer_mode = "secure"
    enable_api_gateway = true
    domain_name        = "api.staging.example.gov"
  }

  override_data {
    target = data.aws_vpc.internal_alb[0]
    values = {
      cidr_block = "10.0.0.0/20"
    }
  }

  assert {
    condition     = contains([for env_var in output.environment_variables : env_var.name], "API_GATEWAY_DEFAULT_USAGE_PLAN_ID")
    error_message = "API_GATEWAY_DEFAULT_USAGE_PLAN_ID must be set from the public usage plan when API Gateway is enabled"
  }
}

run "no_usage_plan_id_env_var_when_api_gateway_disabled" {
  command = plan

  assert {
    condition     = !contains([for env_var in output.environment_variables : env_var.name], "API_GATEWAY_DEFAULT_USAGE_PLAN_ID")
    error_message = "API_GATEWAY_DEFAULT_USAGE_PLAN_ID must not be set when API Gateway is disabled"
  }
}
