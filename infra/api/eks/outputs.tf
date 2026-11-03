output "cluster_name" {
  value = module.eks.cluster_name
}

output "cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "cluster_certificate_authority_data" {
  value = module.eks.cluster_certificate_authority_data
}

# Consumed by ArgoCD (#11127) and Karpenter (#11128) when building the IAM
# trust policies for their service accounts.
output "oidc_provider_arn" {
  value = module.eks.oidc_provider_arn
}

output "oidc_provider_url" {
  value = module.eks.oidc_provider_url
}

# Karpenter reuses the bootstrap node role for the nodes it provisions.
output "node_role_arn" {
  value = module.eks.node_role_arn
}

output "node_security_group_id" {
  value = module.eks.node_security_group_id
}
