# Overview
This document goes through in detail all the parts of the
transformation process we have for pulling data from the
existing grants.gov database into our system.

There are two tasks documented here

[Setup Foreign Tables](#create-foreign-data-wrappers-script) which is a manually run task
that sets up tables that are backed by the existing Grants.gov Oracle database that we
query within our own Postgres DB.

[Load Transform](#load-transform-job) The process is an hourly ELT (extract-load-transform) process and
broadly works like so:
* Extract data from Grants.gov's Oracle DB via a foreign data wrapper to figure out updates/inserts/deletes since we last ran (generally hourly)
* Load all new/updated records into our staging tables, and mark deleted records
* Transform each table one by one - we have a separate custom transformation process for handling the conversion from the existing system to ours

## Terminology
The "transformation job" is a single script made up of multiple different tasks.
In our backend processing, a task represents some "chunk" of work, and doesn't say
anything about how it is run (ie. don't mix task up with ECS task, the container in which it runs).
In the case of the transformation job itself, there is a single script that is run
made up of multiple tasks that run sequentially. See [LoadTransformJob](#load-transform-job)
for further details.

We frequently use "script" and "ECS task" interchangeably as terms.
When we want to run one of our scripts, we tell ECS to spin
up a task with a particular command to run. Our common ECS tasks are
scheduled to run in [scheduled_jobs.tf](/infra/api/app-config/env-config/scheduled_jobs.tf)

[Foreign Data Wrappers (fdw)](https://www.postgresql.org/docs/current/postgres-fdw.html) / [Oracle fdw](https://github.com/laurenz/oracle_fdw)
are a way of setting up tables within your database that are actually backed by tables
in an external database. For example, calling `select` on a foreign table would actually
emit a `select` statement in the other database, and generally behave as if the table
was an ordinary table. There are many caveats (performance, types of queries possible), but the primary
benefit is that we're able to keep DB queries in our database, and we can minimize
the amount of our system that needs to interact with an Oracle database.

In our Postgres DB we have multiple schemas that we use for organizing tables
based on their purpose. We have the following schemas:
* `api` - The primary schema that anything we're building out for the system goes into
* `staging` - Where we put tables that we'll copy data from Grants.gov's database to directly
* `legacy` - Where we put tables that we'll configure with the Oracle Foreign Data Wrapper connected to Grants.gov's database

The `staging` tables match the Oracle tables for each column, but
we add a few additional columns for our transformation process.
* `transformed_at` - If null, the transform process will pick up the row, when it completes processing, it will set to the current timestamp. If a new update comes in, the copy-oracle-data process will null the column out again.
* `is_deleted` - Whether the row was deleted in the Oracle database. If true, the transform process will delete the record from our system.
* `transformation_notes` - Freeform text field for putting notes about the transformation if an odd circumstance was hit. Occasionally set for certain scenarios in transformations.
* `created_at`/`updated_at`/`deleted_at` - just metadata auditing columns, not directly used in the process

# First Time Environment Setup
If we are setting up an environment for the first time ever, we need to manually create
the Oracle FDW connection. This will require you have a username/password and have
setup our infra to allow a peering connecting to the Oracle DB.

- To configure the peering the connection, we need request these values from the legacy grants environment: vpc peer owner id and aws peer vpc id.
- Update the below aws ssm parameters values:
  - /network/{environment_name}/dms/peer-owner-id
  - /network/{environment_name}/dms/peer-vpc-id
- Ensure the vpc cdir ranges don't overlap with the peered vpc

Once we have that we can setup the foreign data wrapper connection like so.

```postgresql
CREATE SERVER oracle FOREIGN DATA WRAPPER oracle_fdw OPTIONS (dbserver '<server URL - will look like url:1521/something>');

-- TODO Creating the user mapping / setting up the user privileges

-- Change the isolation level to avoid connection issues as the default is unreliable.
alter server grants options (ADD isolation_level 'read_committed');
```

# Staging & Foreign Table Setup
For each table we want to copy, we define two SQLAlchemy tables,
a "staging" table where we'll copy the unchanged data directly,
and a corresponding "legacy" table that uses a foreign data wrapper to the Oracle database - [oracle_fdw](https://github.com/laurenz/oracle_fdw).

**The order that columns are defined must match exactly to what is defined in Oracle**

Let us assume we want to copy the following Oracle table:
```sql
CREATE TABLE texample(
    example_id NUMBER(6) NOT NULL,
    name     VARCHAR2(45) NOT NULL,
    email    VARCHAR2(30),
    created_date DATE NOT NULL,
    PRIMARY KEY(example_id)
);
```
We would create a mixin class like so:
```py
import datetime

from sqlalchemy.orm import Mapped, declarative_mixin, mapped_column

@declarative_mixin
class TExampleMixin:
    user_account_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]
    email: Mapped[str | None]
    created_date: Mapped[datetime]
```

And then create two separate class definitions, one for the staging table, and one for the legacy/foreign data wrapper table.
```py
# Create this in api/src/db/models/staging
from src.db.models.staging.staging_base import StagingBase, StagingParamMixin

class TExample(StagingBase, TExampleMixin, StagingParamMixin):
    __tablename__ = "texample"
```
and
```py
# Create this in api/src/db/models/foreign
from . import foreignbase

class TExample(foreignbase.ForeignBase, TExampleMixin):
    __tablename__ = "texample"
```
and update the staging __init__.py and the legacy/foreign __init__.py
```
from .import (
    opportunity,
    example,
)

metadata = staging_base.metadata

__all__ = [
    "metadata",
    "opportunity",
    "example",
]
```

We don't need to perfectly match everything about the Oracle system, it's fine to do the following:
* Different column types - see [Type Mapping](#type-mapping) for details
* Different column names - the order matters for the columns, but the column name doesn't need to match if there is an issue (unless there is an issue - keep the column names the same)
* Adding indexes and relationships - we sometimes add relationships to make certain queries simpler like in our test factories.
* Leaving out foreign keys - we intentionally do this to avoid complexity in copying the data over

## Type Mapping
The oracle_fdw handles most type conversions for us which means we don't
need to match the types as exactly as you might think. Here are a few general type
mappings you can follow:
* `VARCHAR(x)`/`VARCHAR2(x)` -> `TEXT`
* `CHAR(x)` -> `TEXT`
* `NUMBER(x)` -> Generally `Integer`/`BigInteger`, if it is defined as "Number(x,y)" that means it's a floating point number and should not be an int.
* `DATE` -> `TIMESTAMP`, the date type in Oracle stores time info as well, so can convert to timestamp
* `BLOB` -> Depends on what the blob represents, if it's a file, `BYTEA` works

For anything else, consult the [oracle_fdw](https://github.com/laurenz/oracle_fdw?tab=readme-ov-file#data-types) docs.

# Create Foreign Data Wrappers Script
* Running locally: `make cmd args="data-migration setup-foreign-tables"`
* Running in ECS (python command portion only): `["poetry", "run", "flask", "data-migration", "setup-foreign-tables"]`

[setup_foreign_tables.py](/api/src/data_migration/setup_foreign_tables.py) is a script that
will go through each table that is derived from the `ForeignBase` class and automatically generate
a command to create the table.

**This command assumes we've already setup a Foreign Data Wrapper to connect to the Oracle database
in a given environment. If we ever setup a new environment, we would need to redo that setup**

For each table it will create a command roughly like:
```postgresql
        CREATE FOREIGN TABLE IF NOT EXISTS foreign_example_table
        (ID integer OPTIONS (key 'true') NOT NULL,DESCRIPTION text)
        SERVER grants OPTIONS (schema 'EGRANTSADMIN', table 'EXAMPLE_TABLE')
```
With any of the columns you defined included in the create command.

Whenever we manually run this job, it runs the command for every table, including
ones that already exist.

If we ever need to fix a table we created (eg. correct a column type),
we first need to drop the foreign table and then run the command to
generate it again. No data is stored in these "tables" as they're just
wrappers/connectors to the actual tables that exist in Oracle.

**Locally we have no Oracle database, so instead of creating foreign tables, it just creates Postgres tables**

# Load-transform job
* Running locally: `make cmd args="data-migration load-transform --no-load --no-transform --no-set-current --no-store-version"`
* Running in ECS (python command portion only): `["poetry", "run", "flask", "data-migration", "load-transform", "--no-load", "--no-transform", "--no-set-current", "--no-store-version"]`

Note that these example commands disable all parts of the job, running
the above commands will just spin up the script and do nothing.

The job itself is made up of 4 parts which will be described in further detail below
* [LoadOracleData](#loadoracledata) - For each configured table, copy data from the Oracle tables to our staging tables, figuring out inserts/updates/deletes
* [TransformOracleData](#transformoracledata) - For each configured table, transform the data according to custom logic and create records in our API tables
* [SetCurrentOpportunities](#setcurrentopportunities) - Iterate over all opportunities and determine the opportunity status / current opportunity summary for the opportunity
* [StoreOpportunityVersion](#storeopportunityversion) - Iterate over all recently changed opportunities and create versioned opportunity data

## Load-transform options
Each of these jobs runs as part of the same script sequentially and each part can be enabled
by configuring the following parameters:
* `--load/--no-load` - Whether to run LoadOracleData
* `--transform/--no-transform` - Whether to run TransformOracleData
* `--set-current/--no-set-current` - Whether to run SetCurrentOpportunities
* `--store-version/--no-store-version` - Whether to run StoreOpportunityVersion

Additionally, we can set the following command line parameters:
* `--insert-chunk-size` (default 800) - Determines how many records LoadOracleData will process at a time.
* `--tables-to-load` (default declared in LoadOracleDataTask) - Determines which tables you want LoadOracleData to process - useful to set if we're setting up a new table and just want to populate it

There are more configuration options present as environment variables that will be discussed
in the relevant part of the job.

## LoadOracleData
[LoadOracleData](/api/src/data_migration/load/load_oracle_data_task.py) handles
getting data from the Oracle database into our equivalent staging table for every
table we have configured.

Unless the `--tables-to-load` parameter is set, it will process the tables that
are configured in the TABLES_TO_LOAD value defined in the file.

For each table it figures out the following:
* Updates - What rows already exist in our system, but have a greater `last_upd_date` than our staging table has
* Inserts - What rows (based on primary key) don't exist in our staging table at all
* Deletes - What rows exist in our staging table, but don't exist in the Oracle DB

It uses the primary keys of the given table in order to link data in the Oracle DB
with data in our system and handles any multi-column primary keys.

### Developer Notes
The `--insert-chunk-size` parameter exists as it might be necessary
to lower the number of rows we copy over as Oracle has a limitation
to the number of columns you can select in a single query. If we're
copying a table with a lot of columns, we might need to lower this value
while we get the bulk of the data imported. This is less important for
hour-to-hour runs because we rarely get more than a handful of records
for any table in any single hour.

When we first setup a new table we want to import, it is recommended
that we manually run the load command for a given table outside of the normal
hourly job. This is both because the load might take a while to run
and just to give us time to investigate any issues that might result.
Passing in the `--tables-to-process <whatever table>` parameter will
limit the job to just processing the chosen table.

## TransformOracleData
[TransformOracleData](/api/src/data_migration/transformation/transform_oracle_data_task.py)
is actually made up of several separate `SubTask` classes that each handle
the transformation of a single table.

Each of these subtasks can be turned on/off by an environment variable (for example: `TRANSFORM_ORACLE_DATA_ENABLE_OPPORTUNITY=false` would disable transform opportunities).

The order that the jobs runs is important as it makes sure data is setup
for any foreign keys we need to create (eg. we transform opportunities before the opportunity attachments)

Each transformation process is fairly custom, but follows the same general
approach of copying data from staging (AKA Source) tables to our API (AKA Destination) tables:
* Fetch all rows for a given table where `transformed_at` is null
* Fetch the row in our destination table if it exists
* Fetch any other relevant records in the query that might need to be linked to (eg. when processing most records, we need to also fetch the opportunity)
* For each row, if the source record is marked to be deleted, delete it from our destination table
* Otherwise, transform the record and insert/update it accordingly

## Developer Notes
If we ever have issues processing an individual row because the data is setup
in a way we do not expect, we'll error that row, but continue processing. That row
will then get picked up and processed again on each subsequent run. There are two common causes for this:
* Our transformation job was running right as an opportunity was created in the Oracle DB, we didn't pick up the opportunity row, but did pick up another part of it. These sort themselves out the following hour automatically when we pull the rest of the data.
* We genuinely hit a case we didn't account for (most often null fields, or fields with unexpected values) - we have to address these on a case-by-case basis. These are common in the lower environments, but fairly rare in production.

If a source row is marked for deletion, but does not exist in our destination table
we generally are okay with that. This happens very often with things that must be connected
to an opportunity. If we first delete an opportunity record, we also delete opportunity summary,
opportunity attachments, and so on. If when we later are processing the opportunity summary transformations
and need to delete one, it would have already been deleted. These "orphan deletes" happen very frequently
and to be safe we set the transformation_notes on the row in the source table to `orphaned_delete_record`

Inserts and updates have to have a very specific implementation. In our transformations that will look
roughly like:
```py
is_insert = target_record is None

transformed_record = transform_util.transform_record(source_record, target_record)
# Note that transform_record will always do something like "Record(...)" and make
# a completely new record, not updating the target_record directly even if it's not null

if is_insert:
    db_session.add(transformed_record)
else:
    db_session.merge(transformed_record)
```
This strange pattern is purely for the update scenario (inserts work uneventfully). In the event
that attempting to transform a record fails, we don't want to apply any updates to the target record.
This means we can't do any `target_record.x = "something"` because if the next line were to hit an issue
we'd need some way to undo that. Rather than have to solve that problem, we instead make a new object
and tell SQLAlchemy to [merge](https://docs.sqlalchemy.org/en/20/orm/session_state_management.html#merging) it in
which effectively makes it copy anything we did to the new record into the target record, but all at once.

## SetCurrentOpportunities
[SetCurrentOpportunities](/api/src/task/opportunities/set_current_opportunities_task.py)
isn't strictly a part of transformations, but makes sense to run immediately after transformations complete.

This job runs on every opportunity and does the following:
* Determines the "current opportunity summary"
* Determines the opportunity status for an opportunity

An opportunity can have between 0 and 2 opportunity summary objects because
we allow up to two opportunity summaries to exist (one forecast, one non-forecast).
This job handles figuring out which one (if any) should be seen as the "current"
and relevant one.

The logic to determine the opportunity summary is as follows:
* If the opportunity is a draft, it gets no current opportunity summary
* If an opportunity summary has a non-forecast opportunity summary after its post date, choose that one
* If an opportunity summary has a forecast opportunity summary after its post date, choose that one
* Otherwise, no current opportunity summary

Along with deciding the current opportunity summary, we figure out the opportunity status. The status
effectively goes with the current opportunity summary, if there is no current opportunity summary there is no status.
The statuses are based on the post_date, close_date, and archive_date as follows:
* Current date > archive_date -> Archived
* Current date > close_date -> Closed (note that forecasted summaries never set the close date)
* is_forecast=True -> Forecasted
* is_forecast=False -> Posted

Note that the last bit there effectively includes "Current date >= post_date" as we would have filtered
the summary out entirely otherwise.

### Developer Notes
We run this job hourly on _all_ opportunities because we have to handle two scenarios:
* An opportunity was recently modified in a way that would affect these values
* The current_date just changed, so we might have reached the post/close/archive data for a given opportunity

While we could in theory have some sort of DB trigger to know what opportunities changed
recently to catch the first scenario, the second scenario is based on data changing outside
of the system (eg. the passage of time).

The job is setup to be very efficient and won't even do updates if the values won't change.
While it seems inefficient to reprocess 80k+ opportunities hourly, this takes less than 2 minutes right now.

## StoreOpportunityVersion
[StoreOpportunityVersionTask](/api/src/task/opportunities/store_opportunity_version_task.py) iterates
over all opportunities and populates the `opportunity_version` table. It adds records
if the opportunity info stored in the version table differs from whatever already exists.

# Runbooks

## I want to copy and transform a new table from the Oracle DB

1. Figure out what the schema of the existing Oracle table is - this requires the ability to access the Oracle DB directly.
2. Using the existing schema, [follow the steps](#staging--foreign-table-setup) for setting up a foreign table.
3. Create a destination table in our API schema.
4. Build the transform class for processing the table from the staging table to our destination API table.
5. Run the `setup-foreign-tables` script to generate the Oracle foreign data wrapper table to the Oracle DB (required in all envs - manually run)
6. Manually test loading the table by running the job with load oracle data job with the following command `["poetry", "run", "flask", "data-migration", "load-transform", "--load", "--no-transform", "--no-set-current", "--no-store-version", "-t", "<TABLE_NAME>"]`
7. Manually test transforming the table by enabling the transformation task (env var based - see the config) and running `["poetry", "run", "flask", "data-migration", "load-transform", "--no-load", "--transform", "--no-set-current", "--no-store-version"]`
8. Enable the jobs to run automatically by adding updating the [LoadOracleDataTask config](https://github.com/HHS/simpler-grants-gov/blob/main/api/src/data_migration/load/load_oracle_data_task.py#L21) to include the job and the [TransformOracleDataTaskConfig](https://github.com/HHS/simpler-grants-gov/blob/main/api/src/data_migration/transformation/transform_oracle_data_task.py) to enable the transformation

Remember to update any relevant dashboards on New Relic.

## I want to run a task in ECS

**For the first few times you run a task non-locally, we recommend pairing with someone who is familiar - just in case**

This first requires you to be logged into the AWS console and authenticated with AWS
in your terminal (`aws configure sso` is one way to set this up). It also requires
that you have terraform initialized for a given environment locally which can be done
by running `bin/terraform-init infra/api/service {environment}` - note that only the most
recently initialized environment will be usable.

To run an ECS task we just need to call the `run-command` script we have which will
fetch terraform values and call ECS to run the task.

If you want to override any default environment variables, first create a JSON file
like so:
```json
[
        { "name" : "ENABLE_OPPORTUNITY_ATTACHMENT_PIPELINE", "value" : "true" },
        { "name" : "INCREMENTAL_LOAD_BATCH_SIZE", "value" : "100" }
]
```
Note that the values always need to be in strings even if they represent integers or other types.
The JSON needs to be valid and parseable by `jq`, which you can test by first doing `jq -c . your_file.json`

To run the query you can do the following:

Example in dev:
```sh
bin/run-command --environment-variables "$(jq -c . ~/env_vars/load_attachment.json)" api dev '["poetry", "run", "flask", "<BLUEPRINT NAME>", "<TASK NAME>", "<PARAMS (optional)>"]'
```
If you have no environment variables you want to override, feel free to exclude that section
of the command.

## I want to reload a table we already transformed
TODO - https://github.com/HHS/simpler-grants-gov/issues/1698
