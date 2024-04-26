---
description: Technical spec for the deliverable dashboard.
---

# Delivery dashboard - technical spec

{% hint style="warning" %}
**Note**

This is a draft version of a new technical specification template. The contents and structure of this page may change.
{% endhint %}

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable</strong></td><td><a href="../delivery-dashboard.md">Delivery dashboard</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><a href="delivery-dashboard-technical-spec.md#architecture-decisions">Architecture decisions</a></li><li><a href="delivery-dashboard-technical-spec.md#technical-milestones">Technical milestones</a></li><li><a href="delivery-dashboard-technical-spec.md#integrations">Integrations</a></li><li><a href="delivery-dashboard-technical-spec.md#security-considerations">Security considerations</a></li><li><a href="delivery-dashboard-technical-spec.md#logs">Change log</a></li></ul></td></tr></tbody></table>

## Architecture decisions

### Dashboard

This deliverable should implement the architecture to build and host dashboards that enables us to iteratively publish operational metrics related to the project.

Some options to consider include:

* S3 bucket (or database connection) + dashboard UI (e.g. jupyter notebook, static site, etc.)
* Analytics API + dashboard UI
* Custom dashboard application (e.g. Plotly Dash or R Shiny app)
* Open source dashboard solution (e.g. Metabase or Redash)
* Software as a Service (SaaS) dashboard solutions (e.g. PowerBI, Tableau, Looker, etc.)

The criteria that should inform this decision include:

* How will members of the public access this dashboard? **Note:** This a core requirement for this deliverable.
* How much control do we have over the look and feel of the dashboard?
* How easy is it to add new charts and metrics?
* Can users can export or download the data behind a given dashboard?
* Can system-to-system users access the data via API?
* Can open source contributors host the dashboard locally?
* Does the platform used to build the dashboard also support ad hoc data analysis?
* Can the dashboard include narrative text that explains how the metrics are calculated or expand on qualitative data and findings?
* Can the dashboard UI be easily translated?&#x20;
* Can the dashboard tool be used to grant individual stakeholders access to personalized views or subsets of the source data? For example, can we use this dashboard tool to enable grantors to view agency specific metrics for their grant pipeline.

### ETL pipeline

This deliverable should implement a strategy for extracting, transforming, and loading the data needed to calculate the operational metrics being published.

Some options to consider include:

* GitHub actions + custom scripts
* Orchestration tool (e.g. Airflow, Prefect, Dagster, etc.)
* SaaS ETL tools (e.g. Talend, Informatica, etc.)

The criteria that should inform this decision include:

* How easy is it to build and maintain new ETL pipelines?
* How easy is it to connect to new sources or targets?
* Can the ETL pipeline execute transformations written in different languages (e.g. Python, SQL, Node.js)?
* What options are supported for scheduling, retries, and dependencies between steps?
* Can open source contributors host and execute their own version of this pipeline?

### Data warehouse

This deliverable should also implement a strategy for storing the data needed to calculate operational metrics and (potentially) the results of those calculations.

Some options to consider include:

* Files stored in S3 buckets (e.g. json, csv)
* Separate schema in our existing Postgres database
* Self-hosted OLAP database (e.g. ClickHouse)
* Third-party managed data warehouse (e.g. Snowflake)

The criteria that should inform this decision include:

* Can the warehouse support both structured and unstructured data?
* How easy is it to query the data for ad hoc reporting and analysis?
* What kind of access controls does the warehouse provide?
* Can open source contributors host their own version of this data warehouse?

## Technical milestones

\[TODO] Add descriptions of technical milestones here

## Integrations

### Translations

Does this milestone involve delivering any content that needs translation?

* **Metric explanations:** If we include explanations of the metrics included in the dashboard, those explanations should be translated. The ability to translate this content will depend on the architecture we choose for the dashboard.

If so, when will English-language content be locked? Then when will translation be started and completed?

* **Translations after launch:** The content will be finalized by when the dashboard is launched. We will create tickets that represent the translations need them and complete them as part of the translation process created for the static site, once that translation process is launched.

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Dashboard:** This deliverable includes deploying the first public dashboard to PROD.
* **Data warehouse:** This deliverable will also likely include setting up a data warehouse for the project.
* **ETL pipeline:** This deliverable also includes creating a simple ETL pipeline to load data into the data warehouse.

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **ETL pipeline + GitHub:** We'll need to connect the ETL pipeline to GitHub in order to extract the data needed for sprint and delivery metrics.
* **ETL pipeline + data warehouse:** We'll also need to connect the ETL pipeline to the data warehouse where it will load the data for analysis.
* **Dashboard + static site:** The static site will, at a minimum, link to the dashboard. Depending on the architectural pattern we choose, the dashboard _may_ be embedded directly within the static site.

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* All of the data needed to calculate sprint and delivery metrics is _already_ publicly available on GitHub, though we may be sharing that data in a format that is more conducive to analysis.

## Security considerations

### Attack vectors introduced

Does this milestone expose any new attack vectors or expand the attack surface of the product?

* **API keys or tokens:** In order to connect the ETL pipeline to GitHub and our data warehouse, we'll need to maintain a set of secrets (e.g. API tokens, database connection URI, etc.) that enable these integrations. Securely managing these secrets and integrations increases the attack surface of the product.

### Mitigation strategies

If so, how are we addressing these risks?

* **Secrets manager:** We'll use the appropriate secrets manager for the tool we choose to orchestrate our ETL pipeline. For example, if we are using GitHub actions as a lightweight scheduler, we'll use [GitHub secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions). If we're using a more mature orchestration tool, like Airflow, we'll use its [secrets backend](https://airflow.apache.org/docs/apache-airflow-providers/core-extensions/secrets-backends.html) feature.
* **Least privilege:** In addition to managing these secrets securely, we'll also follow the principle of least privilege when creating and managing the scopes or roles associated with these integrations.
