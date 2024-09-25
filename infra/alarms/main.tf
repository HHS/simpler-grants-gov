# Global alarms for the account go here

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

locals {
  # This must match the name of the bucket created while bootstrapping the account in set-up-current-account.sh
  tf_state_bucket_name = "${module.project_config.project_name}-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}-tf"

  # Choose the region where this infrastructure should be deployed.
  region = module.project_config.default_region

  # Set project tags that will be used to tag all resources.
  tags = merge(module.project_config.default_tags, {
    description = "Backend resources required for terraform state management and GitHub authentication with AWS."
  })
}

terraform {

  required_version = "< 1.9.7"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.68.0"
    }
  }

  backend "s3" {
    encrypt = "true"
  }
}

provider "aws" {
  region = local.region
  default_tags {
    tags = local.tags
  }
}

module "project_config" {
  source = "../project-config"
}

# Alarm if logs aren't being created for the containers
resource "aws_cloudwatch_metric_alarm" "container_log_failure" {
  alarm_name          = "logs-missing"
  alarm_description   = "Logs failing for containers"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 5
  metric_name         = "DeliveryErrors"
  namespace           = "AWS/Logs"
  period              = 60
  statistic           = "Sum"
  treat_missing_data  = "ignore"
  alarm_actions       = [aws_sns_topic.log_failure.arn]
}
resource "aws_sns_topic" "log_failure" {
  name = "security-no-logs"
  # checkov:skip=CKV_AWS_26:SNS encryption for alerts is unnecessary
}

resource "aws_sns_topic_subscription" "log_failure" {
  topic_arn = aws_sns_topic.log_failure.arn
  protocol  = "email"
  endpoint  = "grantsalerts@navapbc.com"
}
