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
    through an EKS access entry. The reserved-SSO role suffix differs per account,
    so this is set per environment. Null means only the CI/CD role gets access.
  EOT
  default     = null
}
