# # docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/cloudwatch_log_group
# resource "aws_cloudwatch_log_group" "sprint_reports" {
#   name_prefix = "/aws/vendedlogs/states/${local.service_name}-sprint-reports"

#   # Conservatively retain logs for 5 years.
#   # Looser requirements may allow shorter retention periods
#   retention_in_days = 1827

#   # checkov:skip=CKV_AWS_158:skip requirement to encrypt with customer managed KMS key
# }

# # docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/sfn_state_machine
# resource "aws_sfn_state_machine" "sprint_reports" {

#   name     = "${local.service_name}-sprint-reports"
#   role_arn = module.service.task_role_arn

#   definition = jsonencode({
#     "StartAt" : "ExecuteECSTask",
#     "States" : {
#       "ExecuteECSTask" : {
#         "Type" : "Task",
#         # docs: https://docs.aws.amazon.com/step-functions/latest/dg/connect-ecs.html
#         "Resource" : "arn:aws:states:::ecs:runTask.sync",
#         "Parameters" : {
#           "Cluster" : module.service.cluster_arn,
#           "TaskDefinition" : module.service.task_definition_arn,
#           "LaunchType" : "FARGATE",
#           "NetworkConfiguration" : {
#             "AwsvpcConfiguration" : {
#               "Subnets" : data.aws_subnets.private.ids,
#               "SecurityGroups" : [module.service.app_security_group_id],
#             }
#           },
#           "Overrides" : {
#             "ContainerOverrides" : [
#               {
#                 "Name" : local.service_name,
#                 "Environment" : [
#                   {
#                     "Name" : "PY_RUN_APPROACH",
#                     "Value" : "local",
#                   },
#                   {
#                     "Name" : "SPRINT_FILE",
#                     "Value" : "/tmp/sprint-data.json",
#                   },
#                   {
#                     "Name" : "ISSUE_FILE",
#                     "Value" : "/tmp/issue-data.json",
#                   },
#                   {
#                     "Name" : "OUTPUT_DIR",
#                     "Value" : "/tmp/",
#                   }
#                 ]
#                 "Command" : [
#                   "make",
#                   "gh-data-export",
#                   "sprint-reports"
#                 ]
#               }
#             ]
#           }
#         },
#         "End" : true
#       }
#     }
#   })

#   logging_configuration {
#     log_destination        = "${aws_cloudwatch_log_group.sprint_reports.arn}:*"
#     include_execution_data = true
#     level                  = "ERROR"
#   }

#   tracing_configuration {
#     enabled = true
#   }
# }

# # docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/scheduler_schedule_group
# resource "aws_scheduler_schedule_group" "sprint_reports" {
#   name = "${local.service_name}-sprint-reports"
# }

# # docs: https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/scheduler_schedule
# resource "aws_scheduler_schedule" "sprint_reports" {
#   # checkov:skip=CKV_AWS_297:Ignore the managed customer KMS key requirement for now

#   name                         = "${local.service_name}-sprint-reports"
#   state                        = "ENABLED"
#   group_name                   = aws_scheduler_schedule_group.sprint_reports.id
#   schedule_expression          = "rate(1 days)"
#   schedule_expression_timezone = "US/Eastern"

#   flexible_time_window {
#     mode = "OFF"
#   }

#   # target is the state machine
#   target {
#     arn      = aws_sfn_state_machine.sprint_reports.arn
#     role_arn = module.service.task_role_arn

#     retry_policy {
#       maximum_retry_attempts = 0 # dont retry, just wait for the next execution
#     }
#   }
# }
