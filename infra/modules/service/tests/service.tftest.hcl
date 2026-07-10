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
    enable_load_balancer = false
  }

  assert {
    condition     = length(aws_lb.alb) == 0
    error_message = "No ALB should be created when enable_load_balancer is false"
  }
}

run "alb_created_when_load_balancer_enabled" {
  command = plan

  assert {
    condition     = length(aws_lb.alb) == 1
    error_message = "One ALB should be created when enable_load_balancer is true (default)"
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
