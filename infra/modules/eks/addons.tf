# Core add-ons.
#
# Managed as EKS add-ons rather than left to the versions EKS bootstraps with,
# so upgrades are explicit and visible in a plan. Versions resolve to the
# default for the cluster's Kubernetes version rather than being pinned, so a
# kubernetes_version bump carries them along.
#
# eks-pod-identity-agent is the current alternative to IRSA for granting pods
# IAM roles. The OIDC provider in main.tf covers IRSA; installing both leaves
# either path open, since ArgoCD (#11127) and Karpenter (#11128) differ in
# which they expect.
locals {
  # CoreDNS is separated from the rest because it is the only add-on that
  # schedules onto nodes: installed before the node group exists it has nowhere
  # to run and reports degraded. The other three are node agents that EKS rolls
  # out to instances as they join, so they must NOT wait for the node group —
  # nodes need vpc-cni and kube-proxy to reach Ready in the first place.
  node_agent_addons = toset(["vpc-cni", "kube-proxy", "eks-pod-identity-agent"])
  scheduled_addons  = toset(["coredns"])

  all_addons = setunion(local.node_agent_addons, local.scheduled_addons)
}

data "aws_eks_addon_version" "this" {
  for_each = local.all_addons

  addon_name         = each.value
  kubernetes_version = aws_eks_cluster.main.version
  most_recent        = true
}

resource "aws_eks_addon" "node_agent" {
  for_each = local.node_agent_addons

  cluster_name  = aws_eks_cluster.main.name
  addon_name    = each.value
  addon_version = data.aws_eks_addon_version.this[each.value].version

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"
}

resource "aws_eks_addon" "scheduled" {
  for_each = local.scheduled_addons

  cluster_name  = aws_eks_cluster.main.name
  addon_name    = each.value
  addon_version = data.aws_eks_addon_version.this[each.value].version

  resolve_conflicts_on_create = "OVERWRITE"
  resolve_conflicts_on_update = "PRESERVE"

  depends_on = [aws_eks_node_group.bootstrap]
}
