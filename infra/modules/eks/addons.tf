# Core add-ons.
#
# Managed as EKS add-ons rather than left to the versions EKS bootstraps with,
# so upgrades are explicit and visible in a plan. Versions are resolved to the
# default for the cluster's Kubernetes version rather than pinned, so a
# kubernetes_version bump carries them along.

data "aws_eks_addon_version" "this" {
  for_each = toset(["vpc-cni", "coredns", "kube-proxy", "eks-pod-identity-agent"])

  addon_name         = each.value
  kubernetes_version = aws_eks_cluster.main.version
  most_recent        = true
}

# vpc-cni and kube-proxy run on every node, so they must be in place before the
# node group's instances can become Ready.
resource "aws_eks_addon" "vpc_cni" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "vpc-cni"
  addon_version = data.aws_eks_addon_version.this["vpc-cni"].version

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"
}

resource "aws_eks_addon" "kube_proxy" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "kube-proxy"
  addon_version = data.aws_eks_addon_version.this["kube-proxy"].version

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"
}

# Pod Identity is the current alternative to IRSA for granting pods IAM roles.
# The OIDC provider in main.tf covers IRSA; this add-on leaves both paths open,
# since ArgoCD (#11127) and Karpenter (#11128) differ in which they expect.
resource "aws_eks_addon" "pod_identity" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "eks-pod-identity-agent"
  addon_version = data.aws_eks_addon_version.this["eks-pod-identity-agent"].version

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"
}

# CoreDNS schedules onto nodes, so it waits for the node group. Without this
# the add-on installs into a cluster with nowhere to run and reports degraded.
resource "aws_eks_addon" "coredns" {
  cluster_name  = aws_eks_cluster.main.name
  addon_name    = "coredns"
  addon_version = data.aws_eks_addon_version.this["coredns"].version

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"

  depends_on = [aws_eks_node_group.bootstrap]
}
