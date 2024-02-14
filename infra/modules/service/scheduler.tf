resource "aws_scheduler_schedule_group" "group" {
  name = var.service_name
}

resource "aws_scheduler_schedule" "scheduler" {
  for_each = {
    for index, input in var.scheduler_inputs :
    input.name => input
  }

  name                         = "${var.service_name}-${each.value.name}-schedule"
  state                        = "ENABLED"
  group_name                   = aws_scheduler_schedule_group.group.id
  schedule_expression          = each.value.schedule_expression
  schedule_expression_timezone = "US/Eastern"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_ecs_cluster.cluster.arn
    role_arn = aws_iam_role.app_service.arn // !IMPORTANT! needs extra permissions probably ???

    ecs_parameters {
      task_definition_arn = aws_ecs_task_definition.app.arn
      task_count          = 1
      launch_type         = "FARGATE"

      network_configuration {
        assign_public_ip = false
        subnets          = var.private_subnet_ids
        security_groups  = [aws_security_group.app.id]
      }
    }
    retry_policy {
      maximum_event_age_in_seconds = each.value.maximum_event_age_in_seconds
      maximum_retry_attempts       = each.value.maximum_retry_attempts
    }

    input = jsonencode({
      containerOverrides = [{
        name    = var.service_name
        command = each.value.command
      }]
    })
  }
}
