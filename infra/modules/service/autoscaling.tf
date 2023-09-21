resource "aws_cloudwatch_metric_alarm" "cpu_high" {
  count               = var.enable_autoscaling ? 1 : 0
  alarm_name          = "cpu-high-${var.service_name}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "30"
  statistic           = "Average"
  threshold           = "75"
  alarm_description   = "Alarm when CPU exceeds 75%"
  alarm_actions       = [aws_appautoscaling_policy.scale_up[0].arn]
  dimensions = {
    ClusterName = aws_ecs_cluster.cluster.name
    ServiceName = var.service_name
  }
}

resource "aws_appautoscaling_target" "ecs_target" {
  count = var.enable_autoscaling ? 1 : 0

  max_capacity       = var.max_capacity
  min_capacity       = var.min_capacity
  resource_id        = "service/${aws_ecs_cluster.cluster.name}/${var.service_name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "scale_up" {
  count = var.enable_autoscaling ? 1 : 0

  name               = "scale-up-${var.service_name}"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.ecs_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target[0].service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown                = 30
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      scaling_adjustment          = 1
    }
  }
}
