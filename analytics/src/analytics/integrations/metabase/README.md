# Metabase Dashboards: Backup and Recovery Guide

This directory contains a backup of critical SQL queries and dashboard
references used in the Metabase instance. In the event of a non-recoverable
failure of the production Metabase environment, this directory enables manual
restoration of dashboards and visualizations.

## Folder Structure

The `sql/` directory is organized into subfolders, each of which maps to a
specific Metabase "collection". The subfolders contain `.sql` files which 
contain backed-up copies of the SQL queries (known as "questions" in Metabase
parlance) within each collection.

For example (names are not exact):

- `sql/data-availability/` — SQL queries related to data quality, completeness,
  and availability monitoring.
- `sql/delivery-metrics/` — Queries tracking active deliverables and their
  completeness.
- `sql/etl-metrics/` — Metrics for ETL pipeline monitoring, such as anomaly 
  detection and data quality audits.
- `sql/quad-data/` — Metrics or queries associated with current performance
  period.
- `sql/sprint-metrics/` — Sprint-level metrics including burndown charts, point
  summaries, and velocity.

## Purpose

SGG dashboards in Metabase are powered by many complex SQL queries. The Metabase
instance itself is the canonical source of truth for the queries, and the queries
are not automatically backed-up in any source control system (other than DB 
snapshots). In the unlikely event of a catastrophic outage, all queries could be
lost. Therefore, the purpose of this directory is to provide a semi-automated
backup script and backup copies of each production query.

## Semi-Automated Backup Process

Follow the steps below to query the Metabase API for collections and questions, 
and write those collections and questions to the local filesystem. 

### Get API Key

Get an API key from the Metabase Admin interface if you have access, otherwise
   ask for a key from your team lead. 

### Set Environment Variables

Inspect the `local.env` file to find the `MB_API_URL`.  Set an environment 
variable with that value:

```bash
$ grep MB_API_URL ./local.env
MB_API_URL=http://metabase-dev-710651776.us-east-1.elb.amazonaws.com/api
$ export MB_API_URL=http://metabase-dev-710651776.us-east-1.elb.amazonaws.com/api
```

Set another environment variable with the API key from the previous step.

```bash 
export MB_API_KEY=mb_DjVxtH1sSn0tAr3A7k3YzLej4qabWr
```

### Run the Backup 

In a terminal, change directory to `simpler-grants-gov/analytics`.  Run the 
command `make mb-backup` and observe the output to ensure success.  After 
successful execution of the backup command, the `sql/` directory should
contain backup copies of all collections and SQL queries and an updated
`CHANGELOG.txt` file. 

### Open a PR  

As a final step, create a branch and add the `.sql` and `CHANGELOG.txt` files. Open a PR with the branch.

## Disaster Recovery Process

Follow the steps below to manually restore dashboards in Metabase using the backup 
copies of the SQL queries in this folder.

### 1. Recreate Metabase Questions

For each SQL file:

In the Metabase webapp:

1. Navigate to `+ New` → `>_ SQL query`.
2. Paste the contents of the `.sql` file.
3. **Important**: Some queries use Metabase-specific syntax with hardcoded
   references to saved questions, such as:

    ````sql
    WITH anomaly_detector AS {{#398-etl-data-quality-anomaly-detector}}
    ````

   These references (`{{#398-...}}`) point to other saved questions in Metabase.

   The following steps are required:

   - Identify the dependency (i.e., locate the referenced `.sql` file).
   - Create and save that question first.
   - Metabase will assign a new numeric ID to the saved question.
   - Update the referencing query with the new ID in place of the old one.

4. Choose the correct visualization type (e.g., table, bar chart, pie chart)
   and configure visualization settings (e.g., axes, stacking, colors, labels)
   according to how the question is expected to be displayed. Use the
   corresponding screenshot in the `screenshots/` directory as a reference.

5. Save the query as a Metabase question, using the same or a similar name as
   the filename.

Repeat this process for each file in the `sql` folder.

### 2. Recreate Dashboards

Once all required questions are recreated:

In the Metabase webapp: 
1. Navigate to `+ New` → `Dashboard`.
2. Use the screenshots in the `screenshots/` directory to:
   - Determine which questions belong to each dashboard.
   - Understand layout, visual types, and filter configurations.
3. Add the relevant saved questions to the dashboard via the `+` →
   `Saved Questions` interface.

Repeat this process for all dashboards.

## Recommendations

- Begin with queries that are dependencies for others to avoid broken
  references.
- Verify visualizations against the screenshots for accuracy.
- Maintain consistent naming conventions to simplify identification and reuse.

## Future Improvements

An automated solution is planned to export and version-control Metabase
questions and dashboards, and support restoration through scripts or APIs.
Until that solution is in place, this process provides a fallback method for
business continuity.

