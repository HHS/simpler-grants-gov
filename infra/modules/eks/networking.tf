data "aws_vpc" "cluster" {
  id = var.vpc_id
}

# Control plane security group. EKS also creates its own managed cluster
# security group and attaches it alongside this one; this group is what we
# control directly.
resource "aws_security_group" "cluster" {
  name_prefix = "${var.cluster_name}-cluster-"
  description = "EKS control plane for ${var.cluster_name}"
  vpc_id      = var.vpc_id

  lifecycle {
    create_before_destroy = true
  }
}

# Nodes reach the Kubernetes API. Scoped to the node security group rather than
# a CIDR so it stays correct if the VPC is re-addressed.
resource "aws_vpc_security_group_ingress_rule" "cluster_from_nodes" {
  security_group_id            = aws_security_group.cluster.id
  description                  = "Kubernetes API from nodes"
  referenced_security_group_id = aws_security_group.node.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
}

# The control plane calls back into the nodes — webhooks, kubectl exec/logs, and
# the metrics server all rely on this.
resource "aws_vpc_security_group_egress_rule" "cluster_to_nodes" {
  security_group_id            = aws_security_group.cluster.id
  description                  = "Control plane to node kubelet and webhooks"
  referenced_security_group_id = aws_security_group.node.id
  from_port                    = 1025
  to_port                      = 65535
  ip_protocol                  = "tcp"
}

# --- Nodes -------------------------------------------------------------------

resource "aws_security_group" "node" {
  name_prefix = "${var.cluster_name}-node-"
  description = "EKS nodes for ${var.cluster_name}"
  vpc_id      = var.vpc_id

  # Required so Karpenter (#11128) can discover this group by tag when it
  # builds launch templates for the nodes it provisions.
  tags = {
    "karpenter.sh/discovery" = var.cluster_name
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Pod-to-pod traffic across nodes. Kubernetes assumes a flat network between
# nodes, so this is deliberately wide within the group.
resource "aws_vpc_security_group_ingress_rule" "node_from_node" {
  security_group_id            = aws_security_group.node.id
  description                  = "Node to node, all ports"
  referenced_security_group_id = aws_security_group.node.id
  ip_protocol                  = "-1"
}

resource "aws_vpc_security_group_ingress_rule" "node_from_cluster" {
  security_group_id            = aws_security_group.node.id
  description                  = "Kubelet and webhooks from the control plane"
  referenced_security_group_id = aws_security_group.cluster.id
  from_port                    = 1025
  to_port                      = 65535
  ip_protocol                  = "tcp"
}

# Nodes must reach the Kubernetes API to join the cluster and stay registered.
resource "aws_vpc_security_group_egress_rule" "node_to_cluster" {
  security_group_id            = aws_security_group.node.id
  description                  = "Kubernetes API"
  referenced_security_group_id = aws_security_group.cluster.id
  from_port                    = 443
  to_port                      = 443
  ip_protocol                  = "tcp"
}

# Egress to the internet, via the VPC's NAT gateways. Needed to pull container
# images from registries outside our ECR and to reach AWS API endpoints that
# have no interface endpoint in this VPC.
#
# Wider than the ECS services in this project, which scope egress to specific
# VPC endpoints. Nodes run arbitrary workloads whose destinations are not known
# in advance, so tightening this means enumerating what the workloads need —
# worth revisiting once the evaluation settles what actually runs here.
resource "aws_vpc_security_group_egress_rule" "node_to_internet" {
  security_group_id = aws_security_group.node.id
  description       = "Outbound internet for image pulls and AWS APIs"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "-1"
}
