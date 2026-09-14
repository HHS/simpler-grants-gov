# Bootstrap managed node group.
#
# Deliberately small. Karpenter (#11128) is intended to provision the real
# capacity, but Karpenter itself has to run somewhere — a cluster with no nodes
# cannot schedule the Karpenter controller. This group exists to host the
# controller and other cluster-critical add-ons; application workloads should
# land on Karpenter-provisioned nodes.
resource "aws_launch_template" "node" {
  # checkov:skip=CKV_AWS_341:A hop limit of 2 is required on EKS nodes. Pods reach IMDS through the container network, which costs an extra hop, so a limit of 1 breaks IRSA — the mechanism ArgoCD (#11127) and Karpenter (#11128) authenticate with. IMDSv2 is still enforced below.
  name_prefix = "${var.cluster_name}-node-"

  vpc_security_group_ids = [aws_security_group.node.id]

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = var.node_disk_size
      volume_type = "gp3"
      encrypted   = true
    }
  }

  # IMDSv2 required, and a hop limit of 2 so pods using the node's role can
  # still reach the metadata service through the container network.
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.cluster_name}-node"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_eks_node_group" "bootstrap" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${var.cluster_name}-bootstrap"
  node_role_arn   = aws_iam_role.node.arn
  subnet_ids      = var.subnet_ids
  instance_types  = var.node_instance_types

  scaling_config {
    desired_size = var.node_desired_size
    min_size     = var.node_min_size
    max_size     = var.node_max_size
  }

  launch_template {
    id      = aws_launch_template.node.id
    version = aws_launch_template.node.latest_version
  }

  update_config {
    max_unavailable = 1
  }

  lifecycle {
    # Whatever is running the cluster autoscaling — Karpenter, or manual
    # scaling during the evaluation — owns desired_size after creation.
    ignore_changes = [scaling_config[0].desired_size]
  }

  depends_on = [
    aws_iam_role_policy_attachment.node,
    aws_eks_access_entry.node,
  ]
}
