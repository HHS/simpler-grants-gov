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
    Instance types for the bootstrap node group. Carries only cluster-critical
    add-ons; application workloads run on Karpenter-provisioned nodes (#11128).
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
    SSO reserved role granted cluster-admin via an EKS access entry. The suffix is
    per-account; null grants only the CI/CD role, leaving no human access.
  EOT

  # infra-dev's account (061664787759), matching infra/api/app-config/infra-dev.tf.
  # Override rather than inherit if this layer reaches another account.
  default = "AWSReservedSSO_AdministratorAccess_73856a8074e1d297"
}
