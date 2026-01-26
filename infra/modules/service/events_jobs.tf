#-----------------
# Background Jobs
#-----------------
# CloudWatch Event Rules and CloudWatch Event Targets that define event-based
# triggers for background jobs, such as jobs that trigger when a file is
# uploaded to an S3 bucket or jobs that trigger on a specified "cron" schedule.
#
# For each job configuration, there is a single event rule and an associated
# event target
#

# Event rules that trigger whenever an object is created in S3
# for a particular source bucket and object key prefix
resource "aws_cloudwatch_event_rule" "file_upload_jobs" {
  for_each = var.file_upload_jobs

  name        = "${local.cluster_name}-${each.key}"
  description = "File uploaded to bucket ${each.value.source_bucket} with path prefix ${each.value.path_prefix}"

  event_pattern = jsonencode({
    source      = ["aws.s3"],
    detail-type = ["Object Created"],
    detail = {
      bucket = {
        name = [each.value.source_bucket]
      },
      object = {
        key = [{
          prefix = each.value.path_prefix
        }]
      }
    }
  })
}

# Event target for each event rule that specifies what task command to run

resource "aws_cloudwatch_event_target" "document_upload_jobs" {
  for_each = var.file_upload_jobs

  target_id = "${local.cluster_name}-${each.key}"
  rule      = aws_cloudwatch_event_rule.file_upload_jobs[each.key].name
  arn       = aws_sfn_state_machine.file_upload_jobs[each.key].arn
  role_arn  = aws_iam_role.events.arn

  input_transformer {
    input_paths = {
      bucket_name = "$.detail.bucket.name",
      object_key  = "$.detail.object.key",
    }

    # When triggering the ECS task (via step functions), override the command to run in
    # the container to the command specified by the file_upload_job config. To do this
    # define an input_template that transforms the input S3 event:
    #   {
    #     detail: {
    #       bucket: { name: "mybucket" },
    #       object: { key: "uploaded/file/path" }
    #     }
    #   }
    # to match the Amazon ECS RunTask TaskOverride structure:
    #   {
    #     task_command = ["command", "to", "run"]
    #   }
    # (see https://docs.aws.amazon.com/eventbridge/latest/userguide/eb-targets.html#targets-specifics-ecs-task
    # and https://docs.aws.amazon.com/AmazonECS/latest/APIReference/API_TaskOverride.html)
    #
    # The task command can optionally use the bucket name or the object key in the command
    # by including the placeholder values "<bucket_name>" or "<object_key>", e.g.
    #   {
    #     task_command: ["process_file.sh", "--bucket", "<bucket_name>", "--object", "<object_key>"]
    #   }
    #
    # Since jsonencode will cause the string "<bucket_name>" to turn into
    # "U+003Cbucket_nameU+003E" and "<object_key>" to turn into "U+003Cobject_keyU+003E",
    # we need to replace the unicode characters U+003C and U+003E with < and > to reverse
    # the encoding.
    #
    # (see https://developer.hashicorp.com/terraform/language/functions/jsonencode and
    # https://github.com/hashicorp/terraform/pull/18871)
    input_template = replace(replace(jsonencode({
      task_command = each.value.task_command
    }), "\\u003c", "<"), "\\u003e", ">")
  }
}

resource "aws_sfn_state_machine" "file_upload_jobs" {
  for_each = var.file_upload_jobs

  name     = "${var.service_name}-${each.key}"
  role_arn = aws_iam_role.workflow_orchestrator.arn

  definition = jsonencode({
    "StartAt" : "RunTask",
    "States" : {
      "RunTask" : {
        "Type" : "Task",
        # docs: https://docs.aws.amazon.com/step-functions/latest/dg/connect-ecs.html
        "Resource" : "arn:aws:states:::ecs:runTask.sync",
        "Parameters" : {
          "Cluster" : aws_ecs_cluster.cluster.arn,
          "TaskDefinition" : aws_ecs_task_definition.app.arn,
          "LaunchType" : "FARGATE",
          "NetworkConfiguration" : {
            "AwsvpcConfiguration" : {
              "Subnets" : module.network.private_subnet_ids,
              "SecurityGroups" : [aws_security_group.app.id],
            }
          },
          "Overrides" : {
            "ContainerOverrides" : [
              {
                "Name" : local.container_name,
                "Command.$" : "$.task_command"
              }
            ]
          }
        },
        "End" : true
      }
    }
  })

  logging_configuration {
    log_destination        = "${aws_cloudwatch_log_group.file_upload_jobs[each.key].arn}:*"
    include_execution_data = true
    level                  = "ERROR"
  }

  tracing_configuration {
    enabled = true
  }
}

resource "aws_cloudwatch_log_group" "file_upload_jobs" {
  for_each = var.file_upload_jobs

  name_prefix = "/aws/vendedlogs/states/${var.service_name}-${each.key}/file-upload-jobs/"

  # Conservatively retain logs for 5 years.
  # Looser requirements may allow shorter retention periods
  retention_in_days = 1827

  # TODO(https://github.com/navapbc/template-infra/issues/164) Encrypt with customer managed KMS key
  # checkov:skip=CKV_AWS_158:Encrypt service logs with customer key in future work
}
