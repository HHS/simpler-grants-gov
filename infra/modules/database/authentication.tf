# Authentication
# --------------


# TODO: Delete when no longer in use. Part 3 of multipart update https://github.com/navapbc/template-infra/issues/354#issuecomment-1693973424
resource "aws_iam_policy" "db_access" {
  name   = var.access_policy_name
  policy = data.aws_iam_policy_document.db_access.json
}

# TODO: Delete when no longer in use. Part 3 of multipart update https://github.com/navapbc/template-infra/issues/354#issuecomment-1693973424
data "aws_iam_policy_document" "db_access" {
  # Policy to allow connection to RDS via IAM database authentication
  # which is more secure than traditional username/password authentication
  # https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.IAMPolicy.html
  statement {
    actions = [
      "rds-db:connect"
    ]

    resources = [
      "${local.db_user_arn_prefix}/${var.app_username}",
      "${local.db_user_arn_prefix}/${var.migrator_username}",
    ]
  }
}

resource "aws_iam_policy" "app_db_access" {
  name   = var.app_access_policy_name
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
      "${local.db_user_arn_prefix}/${var.app_username}",
    ]
  }
}

resource "aws_iam_policy" "migrator_db_access" {
  name   = var.migrator_access_policy_name
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
      "${local.db_user_arn_prefix}/${var.migrator_username}",
    ]
  }
}
