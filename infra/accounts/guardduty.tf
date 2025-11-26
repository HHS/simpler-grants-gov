#===================================
# GuardDuty
#===================================

# Import existing GuardDuty detector
# To import: terraform import aws_guardduty_detector.main 94c62cc0d4fe7b2eb627a33e8273238c
#checkov:skip=CKV2_AWS_3:This is a member account in an AWS Organization. Organization-level GuardDuty configuration is managed by the organization administrator account (215331682793).
resource "aws_guardduty_detector" "main" {
  enable                       = true
  finding_publishing_frequency = "SIX_HOURS"

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }
}

# GuardDuty.7: Enable EKS Runtime Monitoring
# This enables GuardDuty to monitor EKS runtime activity
resource "aws_guardduty_detector_feature" "eks_runtime_monitoring" {
  detector_id = aws_guardduty_detector.main.id
  name        = "EKS_RUNTIME_MONITORING"
  status      = "ENABLED"

  additional_configuration {
    name   = "EKS_ADDON_MANAGEMENT"
    status = "ENABLED"
  }
}

# GuardDuty.11: Enable Runtime Monitoring
# This enables GuardDuty to monitor ECS Fargate, EKS, and EC2 runtime activity
resource "aws_guardduty_detector_feature" "runtime_monitoring" {
  detector_id = aws_guardduty_detector.main.id
  name        = "RUNTIME_MONITORING"
  status      = "ENABLED"

  additional_configuration {
    name   = "ECS_FARGATE_AGENT_MANAGEMENT"
    status = "ENABLED"
  }

  additional_configuration {
    name   = "EKS_ADDON_MANAGEMENT"
    status = "ENABLED"
  }

  additional_configuration {
    name   = "EC2_AGENT_MANAGEMENT"
    status = "ENABLED"
  }
}
