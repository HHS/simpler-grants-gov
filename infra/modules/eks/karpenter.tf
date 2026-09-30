# Karpenter AWS-side prerequisites (#11128): the IRSA role the controller
# assumes, and the SQS queue plus EventBridge rules AWS uses to warn about spot
# interruption and instance retirement.
#
# The in-cluster install (Helm chart, NodePool, EC2NodeClass) is deliberately
# NOT here — see the note in variables.tf on enable_karpenter.
#
# Nodes Karpenter launches reuse aws_iam_role.node from iam.tf, so whatever the
# bootstrap group can do, they can too.
locals {
  karpenter_namespace       = "kube-system"
  karpenter_service_account = "karpenter"
}

# --- Interruption queue -------------------------------------------------------

# Karpenter watches this queue so it can drain a node before AWS reclaims it.
# Without it, spot reclamation and scheduled retirements terminate nodes with no
# graceful shutdown.
resource "aws_sqs_queue" "karpenter" {
  count = var.enable_karpenter ? 1 : 0

  name                      = "${var.cluster_name}-karpenter"
  message_retention_seconds = 300
  sqs_managed_sse_enabled   = true
}

data "aws_iam_policy_document" "karpenter_queue" {
  count = var.enable_karpenter ? 1 : 0

  statement {
    sid       = "AllowEventBridgeToSendMessages"
    effect    = "Allow"
    actions   = ["sqs:SendMessage"]
    resources = [aws_sqs_queue.karpenter[0].arn]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com", "sqs.amazonaws.com"]
    }
  }

  statement {
    sid       = "DenyInsecureTransport"
    effect    = "Deny"
    actions   = ["sqs:*"]
    resources = [aws_sqs_queue.karpenter[0].arn]
    principals {
      type        = "AWS"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_sqs_queue_policy" "karpenter" {
  count = var.enable_karpenter ? 1 : 0

  queue_url = aws_sqs_queue.karpenter[0].url
  policy    = data.aws_iam_policy_document.karpenter_queue[0].json
}

# EventBridge rules feeding the queue. Each covers one way AWS takes an
# instance away; Karpenter reacts to all of them the same way.
locals {
  karpenter_events = var.enable_karpenter ? {
    spot_interruption = {
      source      = "aws.ec2"
      detail_type = "EC2 Spot Instance Interruption Warning"
    }
    rebalance = {
      source      = "aws.ec2"
      detail_type = "EC2 Instance Rebalance Recommendation"
    }
    instance_state_change = {
      source      = "aws.ec2"
      detail_type = "EC2 Instance State-change Notification"
    }
    scheduled_change = {
      source      = "aws.health"
      detail_type = "AWS Health Event"
    }
  } : {}
}

resource "aws_cloudwatch_event_rule" "karpenter" {
  for_each = local.karpenter_events

  name          = "${var.cluster_name}-karpenter-${each.key}"
  event_pattern = jsonencode({ source = [each.value.source], "detail-type" = [each.value.detail_type] })
}

resource "aws_cloudwatch_event_target" "karpenter" {
  for_each = local.karpenter_events

  rule = aws_cloudwatch_event_rule.karpenter[each.key].name
  arn  = aws_sqs_queue.karpenter[0].arn
}

# --- Controller IAM role (IRSA) ----------------------------------------------

data "aws_iam_policy_document" "karpenter_controller_assume_role" {
  count = var.enable_karpenter ? 1 : 0

  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"
    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.cluster.arn]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:sub"
      values   = ["system:serviceaccount:${local.karpenter_namespace}:${local.karpenter_service_account}"]
    }
    condition {
      test     = "StringEquals"
      variable = "${replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")}:aud"
      values   = ["sts.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "karpenter_controller" {
  count = var.enable_karpenter ? 1 : 0

  name               = "${var.cluster_name}-karpenter"
  assume_role_policy = data.aws_iam_policy_document.karpenter_controller_assume_role[0].json
}

data "aws_iam_policy_document" "karpenter_controller" {
  count = var.enable_karpenter ? 1 : 0

  # Launching and terminating instances. Scoped by region and by the cluster's
  # own discovery tag so the controller cannot touch capacity belonging to
  # another cluster in the same account.
  statement {
    sid    = "AllowScopedEC2InstanceActions"
    effect = "Allow"
    actions = [
      "ec2:RunInstances",
      "ec2:CreateFleet",
      "ec2:CreateLaunchTemplate",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [data.aws_region.current.name]
    }
  }

  statement {
    sid       = "AllowScopedInstanceTermination"
    effect    = "Allow"
    actions   = ["ec2:TerminateInstances", "ec2:DeleteLaunchTemplate"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "ec2:ResourceTag/karpenter.sh/nodepool"
      values   = ["*"]
    }
  }

  # Read-only discovery of the subnets, security groups, AMIs, and instance
  # types Karpenter picks from.
  statement {
    sid    = "AllowRegionalReadActions"
    effect = "Allow"
    actions = [
      "ec2:DescribeInstances",
      "ec2:DescribeImages",
      "ec2:DescribeLaunchTemplates",
      "ec2:DescribeSecurityGroups",
      "ec2:DescribeSubnets",
      "ec2:DescribeInstanceTypes",
      "ec2:DescribeInstanceTypeOfferings",
      "ec2:DescribeSpotPriceHistory",
      "pricing:GetProducts",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [data.aws_region.current.name]
    }
  }

  statement {
    sid       = "AllowSSMReadForAMIResolution"
    effect    = "Allow"
    actions   = ["ssm:GetParameter"]
    resources = ["arn:${data.aws_partition.current.partition}:ssm:${data.aws_region.current.name}::parameter/aws/service/*"]
  }

  # Hand the node role to instances it launches. Restricted to that one role so
  # the controller cannot escalate by passing a more privileged one.
  statement {
    sid       = "AllowPassingNodeRole"
    effect    = "Allow"
    actions   = ["iam:PassRole"]
    resources = [aws_iam_role.node.arn]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ec2.amazonaws.com"]
    }
  }

  statement {
    sid    = "AllowInstanceProfileManagement"
    effect = "Allow"
    actions = [
      "iam:CreateInstanceProfile",
      "iam:DeleteInstanceProfile",
      "iam:GetInstanceProfile",
      "iam:TagInstanceProfile",
      "iam:AddRoleToInstanceProfile",
      "iam:RemoveRoleFromInstanceProfile",
    ]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [data.aws_region.current.name]
    }
  }

  statement {
    sid       = "AllowClusterRead"
    effect    = "Allow"
    actions   = ["eks:DescribeCluster"]
    resources = [aws_eks_cluster.main.arn]
  }

  statement {
    sid       = "AllowInterruptionQueueActions"
    effect    = "Allow"
    actions   = ["sqs:DeleteMessage", "sqs:GetQueueUrl", "sqs:ReceiveMessage"]
    resources = [aws_sqs_queue.karpenter[0].arn]
  }

  # Tagging is how Karpenter tracks the capacity it owns, so it must be able to
  # tag at launch and retag its own instances.
  statement {
    sid       = "AllowScopedResourceTagging"
    effect    = "Allow"
    actions   = ["ec2:CreateTags"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [data.aws_region.current.name]
    }
  }
}

resource "aws_iam_role_policy" "karpenter_controller" {
  count = var.enable_karpenter ? 1 : 0

  name   = "${var.cluster_name}-karpenter"
  role   = aws_iam_role.karpenter_controller[0].name
  policy = data.aws_iam_policy_document.karpenter_controller[0].json
}
