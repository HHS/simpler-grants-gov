variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "kubernetes_version" {
  description = "Kubernetes version for the control plane. See https://docs.aws.amazon.com/eks/latest/userguide/kubernetes-versions.html"
  type        = string
}

variable "vpc_id" {
  description = "The ID of the VPC the cluster runs in"
  type        = string
}

variable "subnet_ids" {
  description = "Private subnet IDs for the control plane ENIs and the node group"
  type        = list(string)
}

variable "endpoint_public_access" {
  description = "Whether the Kubernetes API server is reachable from the public internet. Defaults false; requires public_access_cidrs when enabled."
  type        = bool
  default     = false
}

variable "public_access_cidrs" {
  description = "CIDRs allowed to reach the public API endpoint. Ignored unless endpoint_public_access is true."
  type        = list(string)
  default     = []

  validation {
    # An open endpoint is never the intent here: authentication is IAM, but an
    # unrestricted endpoint exposes the API surface to the whole internet.
    condition     = !contains(var.public_access_cidrs, "0.0.0.0/0")
    error_message = "public_access_cidrs must not include 0.0.0.0/0. List specific office, VPN, or runner egress ranges."
  }
}

variable "node_instance_types" {
  description = "Instance types for the bootstrap managed node group"
  type        = list(string)
}

variable "node_desired_size" {
  description = "Desired node count for the bootstrap managed node group"
  type        = number
}

variable "node_min_size" {
  description = "Minimum node count for the bootstrap managed node group"
  type        = number
}

variable "node_max_size" {
  description = "Maximum node count for the bootstrap managed node group"
  type        = number
}

variable "node_disk_size" {
  description = "EBS volume size in GB for each node in the bootstrap managed node group"
  type        = number
  default     = 20
}

variable "log_retention_in_days" {
  description = "Retention for the control plane log group. Matches the 1827-day (5 year) retention used by the other service log groups."
  type        = number
  default     = 1827
}

variable "cluster_admin_role_arns" {
  description = "IAM role ARNs granted cluster-admin via EKS access entries. Typically the SSO administrator role and the CI/CD deploy role."
  type        = list(string)
  default     = []
}

variable "node_ami_type" {
  description = "EKS AMI type. Must match the architecture of node_instance_types (ARM_64 for Graviton, x86_64 otherwise)."
  type        = string
}
