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
        # docs: https://docs.aws.amazon.com/step-functions/latest/dg/connect-ecs.html
        "Resource" : "arn:aws:states:::ecs:runTask.sync",
        "Parameters" : {
          "Cluster" : aws_ecs_cluster.cluster.arn,
          "TaskDefinition" : aws_ecs_task_definition.app.arn,
          "LaunchType" : "FARGATE",
          "NetworkConfiguration" : {
            "AwsvpcConfiguration" : {
              "Subnets" : var.private_subnet_ids,
              "SecurityGroups" : [aws_security_group.app.id],
            }
          },
          "Overrides" : {
            "ContainerOverrides" : [
              {
                "Name" : var.service_name,
                "Environment" : [
                  {
                    "Name" : "FLASK_APP",
                    "Value" : "src.app:create_app()",
                  }
                ]
                "Command" : [
                  "poetry",
                  "run",
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
    log_destination        = "${aws_cloudwatch_log_group.service_logs.arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/scheduler_schedule_group
resource "aws_scheduler_schedule_group" "copy_oracle_data" {
  count = var.schedule_copy_oracle_data ? 1 : 0
  name  = "${var.service_name}-copy-oracle-data"
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/scheduler_schedule
resource "aws_scheduler_schedule" "copy_oracle_data" {
  # checkov:skip=CKV_AWS_158:Ignore the managed customer KMS key requirement for now

  count                        = var.schedule_copy_oracle_data ? 1 : 0
  name                         = "${var.service_name}-copy-oracle-data"
  state                        = "ENABLED"
  group_name                   = aws_scheduler_schedule_group.copy_oracle_data[0].id
  schedule_expression          = "rate(2 minutes)"
  schedule_expression_timezone = "US/Eastern"

  flexible_time_window {
    mode = "OFF"
  }

  # target is the state machine
  target {
    arn      = aws_sfn_state_machine.copy_oracle_data[0].arn
    role_arn = aws_iam_role.task_executor.arn

    retry_policy {
      maximum_retry_attempts = 0 # dont retry, just wait for the next execution
    }
  }
}
