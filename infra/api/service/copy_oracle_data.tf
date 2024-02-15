# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sfn_state_machine
resource "aws_sfn_state_machine" "copy_oracle_data" {

  name     = "${local.service_name}-copy-oracle-data"
  role_arn = module.service.task_role_arn

  definition = jsonencode({
    "StartAt" : "ExecuteECSTask",
    "States" : {
      "ExecuteECSTask" : {
        "Type" : "Task",
        # docs: https://docs.aws.amazon.com/step-functions/latest/dg/connect-ecs.html
        "Resource" : "arn:aws:states:::ecs:runTask.sync",
        "Parameters" : {
          "Cluster" : module.service.cluster_arn,
          "TaskDefinition" : module.service.task_definition_arn,
          "LaunchType" : "FARGATE",
          "NetworkConfiguration" : {
            "AwsvpcConfiguration" : {
              "Subnets" : data.aws_subnets.private.ids,
              "SecurityGroups" : [module.service.app_security_group_id],
            }
          },
          "Overrides" : {
            "ContainerOverrides" : [
              {
                "Name" : local.service_name,
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
    log_destination        = "${module.service.service_logs_arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tracing_configuration {
    enabled = true
  }
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/scheduler_schedule_group
resource "aws_scheduler_schedule_group" "copy_oracle_data" {
  name = "${local.service_name}-copy-oracle-data"
}

# docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/scheduler_schedule
resource "aws_scheduler_schedule" "copy_oracle_data" {
  # checkov:skip=CKV_AWS_297:Ignore the managed customer KMS key requirement for now

  name                         = "${local.service_name}-copy-oracle-data"
  state                        = "ENABLED"
  group_name                   = aws_scheduler_schedule_group.copy_oracle_data.id
  schedule_expression          = "rate(2 minutes)"
  schedule_expression_timezone = "US/Eastern"

  flexible_time_window {
    mode = "OFF"
  }

  # target is the state machine
  target {
    arn      = aws_sfn_state_machine.copy_oracle_data.arn
    role_arn = module.service.task_role_arn

    retry_policy {
      maximum_retry_attempts = 0 # dont retry, just wait for the next execution
    }
  }
}
