# DMS (Database Migration Service) Networking
#
# This module creates VPC peering and routes to connect to MicroHealth's
# DMS VPC for database migration from Grants.gov Oracle database.
#
# NOTE: This file is separate from main.tf because main.tf is generated
# by the nava-platform CLI and would be overwritten during template updates.
# Keep DMS-specific configuration in this file to preserve it across updates.

module "dms_networking" {
  source                       = "../modules/dms-networking"
  environment_name             = var.environment_name
  our_vpc_id                   = module.network.vpc_id
  our_cidr_block               = module.network.vpc_cidr
  grants_gov_oracle_cidr_block = module.project_config.network_configs[var.environment_name].grants_gov_oracle_cidr_block
}
