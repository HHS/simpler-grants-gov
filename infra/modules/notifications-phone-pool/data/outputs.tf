locals {
  # Create per-region pool information
  pools_by_region = {
    for region, result in data.external.existing_pools : region => {
      pool_id  = result.result.pool_id
      pool_arn = result.result.pool_arn
      exists   = result.result.exists == "true"
    }
  }
}

# Main output - contains all pool information by region
output "pools_by_region" {
  description = "Map of region to pool information containing pool_id, pool_arn, and exists."
  value       = local.pools_by_region
}

# Convenience output - whether any pool exists in any region
output "any_pool_exists" {
  description = "Whether any existing phone pool was found in any searched region."
  value       = anytrue([for region, pool in local.pools_by_region : pool.exists])
}