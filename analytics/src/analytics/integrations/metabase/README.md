# Metabase Dashboards: Disaster Recovery Guide

This directory contains a backup of critical SQL queries and dashboard
references used in the Metabase instance. In the event of a non-recoverable
failure of the production Metabase environment, this directory enables manual
restoration of dashboards and visualizations.

## Folder Structure


The `sql/` directory is organized into subfolders based loosely on dashboard 
categories. Each subfolder contains `.sql` files corresponding to Metabase 
questions.

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

Metabase dashboards rely on complex SQL queries that are currently stored
only within the Metabase interface and not under source control. Until an
automated backup and restore solution is implemented, this folder serves as a
manual disaster recovery mechanism.

## Manual Disaster Recovery Process

Follow the steps below to manually restore dashboards using the contents of
this folder:

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

