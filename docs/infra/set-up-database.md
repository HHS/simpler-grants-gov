# Set up database

The database setup process will:

1. Configure and deploy an application database cluster using [Amazon Aurora Serverless V2](https://aws.amazon.com/rds/aurora/serverless/)
2. Create a [PostgreSQL schema](https://www.postgresql.org/docs/current/ddl-schemas.html) `app` to contain tables used by the application.
3. Create an IAM policy that allows IAM roles with that policy attached to [connect to the database using IAM authentication](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/UsingWithRDS.IAMDBAuth.Connecting.html)
4. Create an [AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html), the "role manager", for provisioning the [PostgreSQL database users](https://www.postgresql.org/docs/8.0/user-manag.html) that will be used by the application service and by the migrations task.
5. Invoke the role manager function to create the `app` and `migrator` Postgres users.

## Important note

This is an optional step that can be skipped if the application does not have a database.

## Requirements

Before setting up the database you'll need to have:

1. [Set up the AWS account](./set-up-aws-account.md)
2. pip installed (pip is needed to download dependencies for the role manager Lambda function)

## 1. Configure backend

To create the `tfbackend` file for the new application environment, run

```bash
make infra-configure-app-database APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

`APP_NAME` needs to be the name of the application folder within the `infra` folder.
`ENVIRONMENT` needs to be the name of the environment you are creating. This will create a file called `<ENVIRONMENT>.s3.tfbackend` in the `infra/<APP_NAME>/service` module directory.

### (Optional) Enable any database extensions that require `rds_superuser`

To enable some extensions, such as [pgvector](https://github.com/pgvector/pgvector), requires the `rds_superuser` role. You can enable any such extensions via the `superuser_extensions` configuration variable, and set them to either enabled or disabled.

For example, to enable the pgvector extension:

```terraform
# infra/<APP_NAME>/app-config/env-config/main.tf

database_config = {
  ...

  superuser_extensions = {
    "vector" : true, # TODO
  }
}
```

Note that this should only be used for extensions that require the `rds_superuser` role to be created. For many extensions, you can (and should) instead enable them as part of your application's standard database migrations. This [list of trusted extensions from AWS](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html#PostgreSQL.Concepts.General.Extensions.Trusted) shows which extensions can be enabled via a database migrations.

If you're not sure whether you need to do anything here, you can skip this and come back to it later.

## 2. Create database resources

Now run the following commands to create the resources. Review the terraform before confirming "yes" to apply the changes. This can take over 5 minutes.

```bash
make infra-update-app-database APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

## 3. Create Postgres users

Trigger the role manager Lambda function that was created in the previous step to create the application and `migrator` Postgres users.

```bash
make infra-update-app-database-roles APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

The Lambda function's response should describe the resulting PostgreSQL roles and groups that are configured in the database. It should look like a minified version of the following:

```json
{
  "roles": [
    "postgres",
    "migrator",
    "app"
  ],
  "roles_with_groups": {
    "rds_superuser": "rds_password",
    "pg_monitor": "pg_read_all_settings,pg_read_all_stats,pg_stat_scan_tables",
    "postgres": "rds_superuser",
    "app": "rds_iam",
    "migrator": "rds_iam"
  },
  "schema_privileges": {
    "public": "{postgres=UC/postgres,=UC/postgres}",
    "app": "{migrator=UC/migrator,app=U/migrator}"
  }
}
```

### Updating the role manager

To make changes to the role manager such as updating dependencies or adding functionality, see [database access control](/docs/infra/database-access-control.md#update-the-role-manager)

### Note on Postgres table permissions

The role manager executes the following statement as part of database setup:

```sql
ALTER DEFAULT PRIVILEGES IN SCHEMA app GRANT ALL ON TABLES TO app
```

This will cause all future tables created by the `migrator` user to automatically be accessible by the `app` user. See the [Postgres docs on ALTER DEFAULT PRIVILEGES](https://www.postgresql.org/docs/current/sql-alterdefaultprivileges.html) for more info. As an example see the example app's migrations file [migrations.sql](https://github.com/navapbc/template-infra/blob/main/template-only-app/migrations.sql).

Why is this needed? The reason is that the `migrator` role will be used by the migration task to run database migrations (creating tables, altering tables, etc.), while the `app` role will be used by the web service to access the database. Moreover, in Postgres, new tables won't automatically be accessible by roles other than the creator unless specifically granted, even if those other roles have usage access to the schema that the tables are created in. In other words, if the `migrator` user created a new table `foo` in the `app` schema, the `app` user will not automatically be able to access it by default.

## 4. Check that database roles have been configured properly

```bash
make infra-check-app-database-roles APP_NAME=<APP_NAME> ENVIRONMENT=<ENVIRONMENT>
```

## Set up application environments

Once you set up the deployment process, you can proceed to [set up the application service](./set-up-app-env.md)
