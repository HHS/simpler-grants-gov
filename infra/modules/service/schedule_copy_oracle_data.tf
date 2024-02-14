resource "aws_cloudwatch_log_group" "copy_oracle_data" {
  name = "${var.service_name}-copy-oracle-data"

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sfn_state_machine
resource "aws_sfn_state_machine" "copy_oracle_data" {
  count = var.schedule_copy_oracle_data ? 1 : 0

  name     = "${var.service_name}-copy-oracle-data"
  role_arn = aws_iam_role.task_executor.arn

  definition = jsonencode({
    "StartAt" : "ExecuteECSTask",
    "States" : {
      "ExecuteECSTask" : {
        "Type" : "Task",
        "Resource" : "arn:aws:states:::ecs:runTask.sync",
        "Parameters" : {
          "Cluster" : aws_ecs_cluster.cluster.arn,
          "TaskDefinition" : aws_ecs_task_definition.app.arn,
          "LaunchType" : "FARGATE",
          "NetworkConfiguration" : {
            "AwsvpcConfiguration" : {
              "Subnets" : var.private_subnet_ids,
            }
          },
          "Overrides" : {
            "ContainerOverrides" : [
              {
                "Name" : var.service_name,
                "Command" : [
                  "flask",
                  "data-migration",
                  "copy-oracle-data",
                ]
              }
            ]
          }
        },
        "End" : true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.copy_oracle_data.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
}

resource "aws_scheduler_schedule_group" "copy_oracle_data" {
  name = "${var.service_name}-copy-oracle-data"
}

# resource "aws_scheduler_schedule" "copy_oracle_data" {
#   name                         = "${var.service_name}-copy-oracle-data"
#   state                        = "ENABLED"
#   group_name                   = aws_scheduler_schedule_group.copy_oracle_data.id
#   schedule_expression          = "rate(5 minutes)"
#   schedule_expression_timezone = "US/Eastern"

#   flexible_time_window {
#     mode = "OFF"
#   }
# }
