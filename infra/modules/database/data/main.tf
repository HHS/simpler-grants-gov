module "interface" {
  source = "../interface"
  name   = var.name
}

data "aws_rds_cluster" "db_cluster" {
  cluster_identifier = var.name
}

data "aws_iam_policy" "app_db_access_policy" {
  name = module.interface.app_access_policy_name
}

data "aws_iam_policy" "migrator_db_access_policy" {
  name = module.interface.migrator_access_policy_name
}
