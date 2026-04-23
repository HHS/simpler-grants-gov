# Authentication
# --------------

resource "aws_iam_policy" "app_db_access" {
  name   = module.interface.app_access_policy_name
  policy = data.aws_iam_policy_document.app_db_access.json
}

data "aws_iam_policy_document" "app_db_access" {
  # Policy to allow connection to RDS via IAM database authentication
  # which is more secure than traditional username/password authentication
  # https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html
  statement {
    actions = [
      "rds-db:connect"
    ]

    resources = [
      "${local.db_user_arn_prefix}/${module.interface.app_username}",
    ]
  }
}

resource "aws_iam_policy" "migrator_db_access" {
  name   = module.interface.migrator_access_policy_name
  policy = data.aws_iam_policy_document.migrator_db_access.json
}

data "aws_iam_policy_document" "migrator_db_access" {
  # Policy to allow connection to RDS via IAM database authentication
  # which is more secure than traditional username/password authentication
  # https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html
  statement {
    actions = [
      "rds-db:connect"
    ]

    resources = [
      "${local.db_user_arn_prefix}/${module.interface.migrator_username}",
    ]
  }
}
