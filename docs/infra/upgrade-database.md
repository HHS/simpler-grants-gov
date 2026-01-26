# Upgrade database

These steps are a minimal starting point for the changes you'll need to make. As
with any major change to your codebase, you should carefully test the impact of
upgrading the database before applying it to a production environment. See also
the AWS documentation for [Upgrading the PostgreSQL DB engine for Amazon
RDS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_UpgradeDBInstance.PostgreSQL.html#USER_UpgradeDBInstance.PostgreSQL.MajorVersion.Process).

## Immediately

If you want more manual control over when the upgrade happens.

1. Apply any pending maintenance items to the cluster via the AWS console.
2. Prep update settings in
   [/infra/modules/database/resources/main.tf](/infra/modules/database/resources/main.tf).
  1. Set `allow_major_version_upgrade = true` in the `aws_rds_cluster` resource
  2. Set `apply_immediately = true` for both `aws_rds_cluster` and `aws_rds_cluster_instance`
  3. (if needed) Update the `serverlessv2_scaling_configuration`

    Set the `min_capacity` to 4.0 (and adjust the `max_capacity` accordingly).

    If your minimum is lower than this, the upgrade will fail with `FATAL: shared
    memory segment sizes are configured too large`.

4. Run `make infra-update-app-database APP_NAME=<APP_NAME> ENVIRONMENT=<ENV_NAME>`
5. Set the `engine_version` to your new desired version.
6. Run `make infra-update-app-database APP_NAME=<APP_NAME> ENVIRONMENT=<ENV_NAME>`
7. Undo changes from step 2.
6. Run `make infra-update-app-database APP_NAME=<APP_NAME> ENVIRONMENT=<ENV_NAME>`

## During RDS maintenance window

Upgrading the database between major versions (e.g., from Postgres 15 to 16)
asynchronously is a two-step process.

1. Create a new DBParameterGroup for the new engine version and upgrade the database.
2. Remove the old DBParamaterGroup for the prior engine version.

### 1. Creating a new DBParameterGroup and upgrading the database

1. Set `allow_major_version_upgrade = true` in the `aws_rds_cluster` resource in [/infra/modules/database/resources/main.tf](/infra/modules/database/resources/main.tf).

2. (if needed) Update the `serverlessv2_scaling_configuration`

Set the `min_capacity` to 4.0 (and adjust the `max_capacity` accordingly).
If your minimum is lower than this, the upgrade will fail with `FATAL: shared memory segment sizes are configured too large`.

3. Create a new DBParamaterGroup

The database will need access to a new parameter group as part of the upgrade, but the old parameter group can't be deleted until the upgrade is complete.

Make a copy of the `rds_query_logging` resource.
In the original, replace the `${local.engine_major_version}` variable with your current database version.
Then, in the duplicate version, modify the resource name to a new unique value.

E.g., if you were moving from Postgres 14 to Postgres 15, your configuration would look like:

```terraform
# This is the original; note we are manually specifying the family is v14 since after the changes are applied the new engine major version will be 15.
resource "aws_rds_cluster_parameter_group" "rds_query_logging" {
  family      = "aurora-postgresql14"

  ...
}

# This is the new parameter group; we have given it a new name to distinguish it.
resource "aws_rds_cluster_parameter_group" "rds_query_logging_15" {
  family      = "aurora-postgresql${local.engine_major_version}"

  ...
}
```

Modify the `db_cluster_parameter_group_name` to reference this new parameter group:

```terraform
resource "aws_rds_cluster" "db" {
    ...
    db_cluster_parameter_group_name = aws_rds_cluster_parameter_group.rds_query_logging_15.name
    ...
}
```

4. Set the `engine_version` to your new desired version.

5. Run `make infra-update-app-database APP_NAME=<APP_NAME> ENVIRONMENT=<ENV_NAME>`

Note that the upgrade is not applied immediately; it is queued for the next maintenance window.

If you wish to apply the upgrade immediately, you can manually change the engine version to match in the AWS Console. See also:

 - https://developer.hashicorp.com/terraform/tutorials/aws/aws-rds
 - https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Overview.DBInstance.Modifying.html


### 2. Removing the old DBParameter group

Once the upgrade has been applied, you can remove the old parameter group.

You should also remove `allow_major_version_upgrade = true` (or set it to false).

If you had to increase your autoscaling settings to support the upgrade, you may wish to revert that change now as well.

Finally, the new DBParameter group will have a new resource name (e.g., in the example above, `rds_query_logging_15`). You can revert this to the original name (`rds_query_logging`) without modifying the infrastructure by using [Terraform's moved block](https://developer.hashicorp.com/terraform/cli/state/move), e.g.:

```terraform
moved {
  from = aws_rds_cluster_parameter_group.rds_query_logging_15
  to   = aws_rds_cluster_parameter_group.rds_query_logging
}
```
