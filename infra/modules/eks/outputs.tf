output "cluster_name" {
  value = aws_eks_cluster.main.name
}

output "cluster_arn" {
  value = aws_eks_cluster.main.arn
}

output "cluster_endpoint" {
  description = "Kubernetes API endpoint. Private unless endpoint_public_access is set."
  value       = aws_eks_cluster.main.endpoint
}

output "cluster_certificate_authority_data" {
  description = "Base64 CA bundle for the API server, for building a kubeconfig."
  value       = aws_eks_cluster.main.certificate_authority[0].data
}

output "cluster_security_group_id" {
  description = "Security group this module manages for the control plane."
  value       = aws_security_group.cluster.id
}

output "cluster_managed_security_group_id" {
  description = "The security group EKS creates and attaches itself. Add-ons that need to reach the control plane often expect this one."
  value       = aws_eks_cluster.main.vpc_config[0].cluster_security_group_id
}

output "node_security_group_id" {
  description = "Security group for the nodes. Tagged for Karpenter discovery."
  value       = aws_security_group.node.id
}

output "node_role_arn" {
  description = "IAM role the nodes assume. Karpenter reuses this for the nodes it provisions."
  value       = aws_iam_role.node.arn
}

output "node_role_name" {
  value = aws_iam_role.node.name
}

output "oidc_provider_arn" {
  description = "IRSA provider ARN, for the trust policies of roles assumed by service accounts."
  value       = aws_iam_openid_connect_provider.cluster.arn
}

output "oidc_provider_url" {
  description = "IRSA issuer URL, without the https:// prefix, as trust policy conditions expect it."
  value       = replace(aws_iam_openid_connect_provider.cluster.url, "https://", "")
}

output "kms_key_arn" {
  description = "Key encrypting Kubernetes secrets and the control plane log group."
  value       = aws_kms_key.eks.arn
}

output "kubernetes_version" {
  value = aws_eks_cluster.main.version
}
