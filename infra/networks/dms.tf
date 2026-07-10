# DMS (Database Migration Service) Networking
#
# This module creates VPC peering and routes to connect to MicroHealth's
# DMS VPC for database migration from Grants.gov Oracle database.
#
# NOTE: This file is separate from main.tf because main.tf is generated
# by the nava-platform CLI and would be overwritten during template updates.
# Keep DMS-specific configuration in this file to preserve it across updates.

# DMS peering is only created for networks that connect to the Grants.gov Oracle
# database. A network can opt out by setting enable_dms = false in its network_config
# (see infra/project-config/networks.tf) — e.g. grantor1, which has no DMS peering and
# therefore no /network/<env>/dms/* SSM parameters. Defaults to enabled when unset so
# existing networks are unaffected.
module "dms_networking" {
  count = try(module.project_config.network_configs[var.environment_name].enable_dms, true) ? 1 : 0

  source                       = "../modules/dms-networking"
  environment_name             = var.environment_name
  our_vpc_id                   = module.network.vpc_id
  our_cidr_block               = module.network.vpc_cidr
  grants_gov_oracle_cidr_block = module.project_config.network_configs[var.environment_name].grants_gov_oracle_cidr_block
}

# Adding count above turns module.dms_networking into module.dms_networking[0]. This
# moved block tells Terraform the existing (un-indexed) DMS resources in networks that
# already have peering (dev/staging/prod/grantee1/grantee2) are the same as the new [0]
# instance, so they are NOT destroyed and recreated. It is a no-op for networks like
# grantor1 that have no prior DMS state.
moved {
  from = module.dms_networking
  to   = module.dms_networking[0]
}
