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

Several options were tested for a solution for displaying the delivery metric graphs.&#x20;

**ADR:** [**Business Intelligence Tool**](../../../../../decisions/adr/2024-04-10-dashboard-tool.md)

### ETL pipeline

It was decided to adapt the current analytics folder to run in an ECS container and push data to the data warehouse in Postgres.&#x20;

**ADR (ticketed):** [**\[ADR\]: Dashboard ETL orchestration strategy**](https://github.com/HHS/simpler-grants-gov/issues/1248)

### Data warehouse

Several options were considered including S3, Postgres, and Redshift. Postgres was chosen since it is not clear the storage requirements will necessitate a database like Redshift and Postgres is already used by the team so it is faster to deliver and easier to maintain.

**ADR:** [**Dashboard Data Storage**](../../../../../decisions/adr/2024-03-19-dashboard-storage.md)

## Technical milestones

* ### [Delivery dashboard - Planning](https://github.com/HHS/simpler-grants-gov/milestone/137)
  * Testing storage and BI tools and writing ADRs
* ### [Delivery dashboard - Infrastructure](https://github.com/HHS/simpler-grants-gov/milestone/139)
  * Infra to setup BI tool, storage, and run ETL task
* ### [Delivery dashboard - UI](https://github.com/HHS/simpler-grants-gov/milestone/138)
  * Setting up dashboards once BI tool is setup and data is loaded
* ### [Delivery dashboard - ETL](https://github.com/HHS/simpler-grants-gov/milestone/136)
  * Extending existing analytics folder to run in AWS and push to Postgres

## Integrations

### Translations

**Does this milestone involve delivering any content that needs translation?**

Dashboard explanatory material could be translated. This is out of scope since we don't have a translation service.

**If so, when will English-language content be locked? Then when will translation be started and completed?**

Dashboard explanatory material could be translated. This is out of scope since we don't have a translation service.

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Dashboard:** This deliverable includes deploying the first public dashboard to PROD.
* **Data warehouse:** This deliverable will also likely include setting up a data warehouse for the project.
* **ETL pipeline:** This deliverable also includes creating a simple ETL pipeline to load data into the data warehouse.

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **ETL pipeline + GitHub:** We'll need to connect the ETL pipeline to GitHub in order to extract the data needed for sprint and delivery metrics.
* **ETL pipeline + data warehouse:** We'll also need to connect the ETL pipeline to the data warehouse where it will load the data for analysis.
* **BI Tool + data warehouse:** The BI tool will connect to the data warehouse, and dashboards will be shared publicly and embedded in Gitbook.

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* All of the data needed to calculate sprint and delivery metrics is _already_ publicly available on GitHub, though we may be sharing that data in a format that is more conducive to analysis.

## Security considerations

### Attack vectors introduced

Does this milestone expose any new attack vectors or expand the attack surface of the product?

* **API keys or tokens:** In order to connect the ETL pipeline to GitHub and our data warehouse, we'll need to maintain a set of secrets (e.g. API tokens, database connection URI, etc.) that enable these integrations. Securely managing these secrets and integrations increases the attack surface of the product.
* **BI tool:** The BI tool will be able to connect to the data warehouse

### Mitigation strategies

If so, how are we addressing these risks?

* **Secrets manager:** We'll use the appropriate secrets manager for the tool we choose to orchestrate our ETL pipeline. For example, if we are using GitHub actions as a lightweight scheduler, we'll use [GitHub secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions). If we're using a more mature orchestration tool, like Airflow, we'll use its [secrets backend](https://airflow.apache.org/docs/apache-airflow-providers/core-extensions/secrets-backends.html) feature.
* **Least privilege:** In addition to managing these secrets securely, we'll also follow the principle of least privilege when creating and managing the scopes or roles associated with these integrations.
* **SSO and MFA**: Single-sign on and Multi-Factor auth will be required for the BI tool.
