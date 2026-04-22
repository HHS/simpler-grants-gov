# This module finds existing phone pool resources for reuse in temporary environments
data "aws_region" "current" {}
data "aws_caller_identity" "current" {}

locals {
  # Default to current region if no regions specified
  search_regions = var.regions != null ? var.regions : [data.aws_region.current.name]
}

# Check for existing phone pools in each specified region
data "external" "existing_pools" {
  for_each = toset(local.search_regions)
  program  = ["${path.module}/find-existing-pool.sh", each.value]
}