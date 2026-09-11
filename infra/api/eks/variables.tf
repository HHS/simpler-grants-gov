variable "environment_name" {
  type        = string
  description = "name of the application environment"
}

variable "kubernetes_version" {
  type        = string
  description = "Kubernetes control plane version. See https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html"
  default     = "1.33"
}

variable "node_instance_types" {
  type        = list(string)
  description = <<EOT
    Instance types for the bootstrap node group. Only has to carry
    cluster-critical add-ons (CoreDNS, and the Karpenter controller once
    #11128 lands) — application workloads are expected to run on
    Karpenter-provisioned nodes.
  EOT
  default     = ["t4g.medium"]
}

variable "node_desired_size" {
  type        = number
  description = "Desired size of the bootstrap node group. Two nodes so the add-ons survive losing one."
  default     = 2
}

variable "node_min_size" {
  type    = number
  default = 2
}

variable "node_max_size" {
  type        = number
  description = "Ceiling for the bootstrap group. Kept low on purpose: scaling is Karpenter's job, not this group's."
  default     = 4
}

variable "sso_admin_role_name" {
  type        = string
  description = <<EOT
    Name of the AWS IAM Identity Center (SSO) reserved role granted cluster-admin
    through an EKS access entry. The reserved-SSO role suffix
    (AWSReservedSSO_<PermissionSet>_<suffix>) is generated per AWS account, so an
    environment in a different account must override this with that account's own
    role — see search_sso_admin_role_name in infra/api/app-config for the same
    pattern and the per-account values already recorded there.

    Set to null to grant only the CI/CD role, which leaves the cluster reachable
    by automation but by no human operator.
  EOT

  # infra-dev's account (061664787759). Matches the value already used for the
  # same account in infra/api/app-config/infra-dev.tf. Only infra-dev has an EKS
  # layer today; revisit this default rather than inheriting it blindly if the
  # layer is extended to an environment in another account.
  default = "AWSReservedSSO_AdministratorAccess_73856a8074e1d297"
}
