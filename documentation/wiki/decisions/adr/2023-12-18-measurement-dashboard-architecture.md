# Public measurement dashboard architecture

- **Status:** Active <!-- REQUIRED -->
- **Last Modified:** 2023-12-18 <!-- REQUIRED -->
- **Related Issue:** [#845](https://github.com/HHS/simpler-grants-gov/issues/845) <!-- RECOMMENDED -->
- **Deciders:**
  - Lucas Brown
  - Aaron Couch
  - Michael Chouinard
  - Billy Daly
- **Tags:** analytics, data <!-- OPTIONAL -->

## Context and Problem Statement

One of the goals for this project is to make all of the Simpler.Grants.gov operational metrics publicly available and to publish as much non-sensitive data about the grants pipeline as possible. In order to help internal and external stakeholders make sense of this data, we'll need to create and maintain a set of public measurement dashboards that summarize and contextualize the key metrics we track in the project.

There are a number of architectural patterns we can follow to build and publish a set of dashboards, and the pattern we choose will influence how we set up our data engineering pipeline, as well as our infrastructure for analytics and business intelligence (ABI).

The goal of this ADR is to evaluate and recommend an architectural approach for our initial public measurement dashboard deliverable, which will focus on sprint and delivery metrics. However, this recommendation should also create a flexible yet robust foundation for future dashboards as well.

## Decision Drivers <!-- RECOMMENDED -->

#### Must have

- Members of the public can access the dashboard without a login
- Multiple related dashboards can be combined into a single "application" for external users
- New charts and dashboards are easy to implement
- Users can export or download the data behind a given dashboard
- Open source contributors can host a local version of our dashboards using exported data

#### Nice to have

- The platform used to build dashboards can also be used to answer ad-hoc questions about the data
- System-to-system users can programmatically access the data behind a given dashboard via API
- Dashboards can include narrative text that explains the metrics we publish

## Options Considered

- S3 bucket + dashboard user interface
- Analytics API + dashboard user interface
- Custom dashboard application (e.g. [Dash][plotly-dash] or [R Shiny][r-shiny])
- Open source dashboard solution (e.g. [Metabase][metabase] or [Redash][redash])
- SaaS dashboard solution (e.g. [PowerBI][power-bi], [Tableau][tableau], [Looker][looker], [Amazon Quicksight][quicksight], or [Domo][domo])

> [!NOTE]
> This ADR does not aim to recommend a *specific* platform or tool, but rather a general architectural approach to building and publishing dashboards. Once we select an approach from the list above (e.g. open source dashboard solution), we'll need to create a separate ADR that evaluates the options available within that approach (e.g. Metabase vs Redash).

## Decision Outcome <!-- REQUIRED -->

### Long-term

Our recommendation for a long-term dashboard architecture is to combine **analytics API + dashboard UI** with an **open source dashboard solution** in a way that allows us to quickly iterate on and test the value of new metrics or charts, then "promote" the ones we find most helpful to an official public dashboard.

The steps for this promotion strategy would likely include:

1. **ETL:** Write the data needed to calculate operational and program metrics to a data warehouse via an ETL pipeline.
2. **Ad hoc report:** Prototype a new metric by building an ad hoc SQL report in an open source dashboard solution (e.g. Metabase or Redash) connected to that data warehouse.
3. **Temporary dashboard:** If that ad hoc report is useful to stakeholders, then incorporate it into a temporary dashboard within the open source dashboard tool.
4. **Public dashboard and endpoint:** Once we get feedback on this temporary dashboard, formalize the metric in a new (or modified) API endpoint that is consumed by a new (or modified) page in the public-facing dashboard application.

### Short-term

Because setting up the infrastructure for the long-term dashboard architecture will take a significant amount of time and resources, in the short-term, we recommend following the **s3 bucket + dashboard UI** option. This approach reduces the upfront infrastructure investment needed to publish an initial dashboard, while still laying the foundation for parts of the long-term approach.

The steps for publishing a dashboard using this short-term strategy would likely include:

1. **ETL:** Use a simple ETL pipeline (e.g. scheduled GitHub action) to:
   1. Extract data needed to calculate operational and program metrics from external sources.
   2. Calculate the metrics we want to add to a dashboard.
   3. Load both the source data and the metrics results to s3 buckets.
2. **Dashboard UI:** Load the metrics from s3 and visualize them in a static UI (e.g. Jupyter notebook, static site, GitBook page) that gets refreshed with new data after the ETL pipeline runs.

### Positive Consequences <!-- OPTIONAL -->

- Minimizes the upfront investment in infrastructure needed to publish our first dashboard publicly.
- Enables us to experiment with different ETL and dashboard UI options that will help narrow the decision for the long-term architecture.
- In the long-term, provides a pipeline for testing and getting feedback on a new metric before "promoting" it to our public dashboard.

### Negative Consequences <!-- OPTIONAL -->

- In the short-term, requires a higher level technical expertise to build even basic dashboards.
- In the short-term, does not easily support ad hoc reporting that is accessible to non-engineers.
- In the short-term, because s3 does not provide fine-tuned access control to publicly accessible buckets, we'll have to limit our metrics to non-sensitive data or post only the aggregated results of metrics calculated from sensitive data.
- Once the long-term approach has been adopted, it may require reimplementing some ETL pipelines and/or dashboards that were built in the short-term.

## Pros and Cons of the Options <!-- OPTIONAL -->

### S3 bucket + user interface

This option involves running an analytics pipeline on a regular basis (likely once per day) then writing the results of the analysis to an s3 bucket as a static file (e.g. JSON, csv, etc.). That same pipeline, or a separate pipeline, could also refresh a standalone dashboard UI (e.g. Jupyter notebook, static site, etc.) which reads data from that s3 bucket and visualizes the results in a series of charts.

> [!TIP]
> **Bottom line:** This option is best if:
> - we want an easy-to-implement solution that gives us control over the look and feel of the dashboard *and* enables users to access the underlying data,
> - but we are willing to wait to adopt a more sustainable long-term solution that provides support for adhoc reporting and/or a more robust analytics API.

- **Pros**
  - Requires the least amount of upfront investment in infrastructure to build and publish a dashboard.
  - Provides more fine-grained control over the look and feel of the dashboard.
  - Enables S2S users to access underlying analytics data from the S3 bucket.
  - Allows us to include narrative text that explains the metrics we publish.
  - Enables open source contributors to host local versions of our dashboard or easily create their own dashboards.
  - Aligns with the open source values and approach of the project.
  - Creates a foundation for other options, such as the Analytics API + dashboard UI.
- **Cons**
  - Building or modifying dashboards is still quite technical, not something a business analyst could do on their own.
  - Harder to implement new charts or dashboards than SaaS or open source dashboard solution.
  - Sharing data via s3 bucket does not provide as good a developer experience as sharing data via a well-designed analytics API.
  - Does not easily support adhoc reports or dashboards in the same tool.
  - Not a sustainable option for a long-term data and analytics platform.

### Analytics API + user interface

This option involves building both a custom analytics API that will serve the data behind our key project metrics and a separate user interface to consume from that API and render these metrics as a dashboard for end users. Following this approach, we could choose to re-use our existing front-end and backend infrastructure or make slightly different tooling choices based on our needs.

> [!TIP]
> **Bottom line:** This option is best if:
> - we want to follow the existing architecture pattern of Simpler.Grants.gov *and* have maximum control over the structure and design of the public dashboard,
> - but we are willing to dedicate more engineering resources to building and hosting this dashboard *and* don't need to update the analytics endpoints or dashboards frequently.

- **Pros**
  - Provides the most fine-grained control over the look and feel of the dashboard application.
  - Enables us to combine multiple dashboards into a single application.
  - Enables S2S users to access underlying analytics data via API.
  - Allows us to include narrative text that explains the metrics we publish.
  - Enables open source contributors to host local versions of our dashboard or easily create their own dashboards.
  - Aligns with the open source values and approach of the project.
  - Data endpoints are simple and easy to understand.
- **Cons**
  - Building or modifying dashboards is quite technical, not something a business analyst could do on their own.
  - Publishing new charts or dashboards requires making changes both to the API and to the dashboard UI separately.
  - Hardest to maintain of all of the options considered.
  - Does not easily support adhoc reports or dashboards without using a separate tool.

### Custom dashboard app

This option involves building a custom dashboard app using an existing framework, such as [Dash][plotly-dash] (python) or [R Shiny][r-shiny]. This custom built application would be hosted as its own application and be slightly more integrated than a separate analytics API + dashboard UI, but it would be more customizable than using an open source or proprietary dashboard solution.

> [!TIP]
> **Bottom line:** This option would be best if:
> - we want to retain control over the look and feel of the dashboard *and* to manage the backend and frontend of the dashboard together,
> - but we are willing to commit more engineering resources to building and hosting it *and* don't need to expose analytics data via API.

- **Pros**
  - Provides more fine-grained control over the look and feel of the dashboard application, on par with option 1.
  - Allows a single engineer familiar with Python (or R if we use Shiny) to manage both the backend (e.g. analytics) and frontend (visualization and design of the dashboard).
  - Faster to implement new charts and dashboards than an analytics API and separate frontend.
  - Enables us to combine multiple dashboards into a single application.
  - Allows open source contributors to host local versions of our dashboards.
  - Aligns with the open source values and approach of the project.
- **Cons**
  - Building or modifying dashboards is still quite technical, not something a business analyst could do on their own.
  - Harder to implement new charts or dashboards than SaaS or open source dashboard solution.
  - Does not easily support adhoc reports or dashboards in the same tool.
  - Does not easily support exposing analytics data to S2S users via API.

### Open source dashboard solution

This option involves selecting and hosting an open source dashboard solution, such as [Metabase][metabase] or [Redash][redash]. This solution would most likely be self-hosted and connect directly to our data warehouse, and enable business analysts to build adhoc reporting and dashboards with SQL and a drag-and-drop interface. Individual dashboards can then be configured for broader publication to external stakeholders.

> [!TIP]
> **Bottom line:** This option would be best if:
> - we want to adopt an open source solution that enables business analysts to build *and* host dashboards with minimal support from engineers,
> - but we are willing to commit the upfront resources needed to set up the infrastructure *and* can compromise on the amount of control we have over the look and feel of those dashboards.

- **Pros**
  - Enables a business analyst or engineer with basic SQL experience to build and manage dashboards.
  - Faster and easier to implement new charts and dashboards than options 1 or 2.
  - Supports adhoc reports and dashboards in the same tool.
  - Allows open source contributors to host local versions of our dashboards (depending on the tool we choose).
  - Aligns with the open source values and approach of the project.
  - No per user cost to grant edit access to self-hosted version of dashboard solution.
- **Cons**
  - Harder to control the look and feel of the resulting dashboards.
  - Harder to combine multiple dashboards into a single "application".
  - Some solutions offer API access to underlying data, but endpoints are harder to understand and may not be publicly available. For example, here's the [Redash API docs][redash-api] and the [Metabase API docs][metabase-api].
  - Still somewhat harder to host and maintain than a fully SaaS dashboard solution.

### SaaS dashboard solution

This solution involves adopting a Software-as-a-Service dashboard solution, such as Tableau or PowerBI, and using this solution to enable business analysts to build adhoc reporting and dashboards with a drag-and-drop interface. Individual dashboards can then be configured for broader publication for external stakeholders.

> [!TIP]
> **Bottom line:** This option would be best if:
> - we want to adopt an externally hosted solution that enables business analysts to build dashboards with no direct support from engineers,
> - but we are willing to accept a higher per-user cost, closed-source tool, and fewer options for customization.

- **Pros**
  - Enables a business analyst to easily build and maintain dashboards, even with minimal SQL or programming experience.
  - Faster and easier to implement new charts and dashboards than options 1 or 2.
  - Supports adhoc reports and dashboards in the same tool.
  - Easier to combine multiple dashboards into a single "application" than open source dashboard solution.
- **Cons**
  - Harder to control the look and feel of the resulting dashboards (depending on the tool).
  - Harder to version control the structure and content of dashboards (depending on the tool).
  - Some solutions offer API access to underlying data, but endpoints are harder to understand and may not be publicly available. For example, here's the [Tableau API docs][tableau-api] and the [Looker API docs][looker-api].
  - Does not allow open source contributors to host local versions of our dashboards.
  - Higher direct costs than all of the other options.

## Links <!-- OPTIONAL -->

- [Dash][plotly-dash]
- [Shiny][r-shiny]
- [Metabase][metabase]
- [Redash][redash]
- [Tableau][tableau]
- [PowerBI][power-bi]
- [Looker][looker]
- [Amazon Quicksight][quicksight]
- [Domo][domo]

[plotly-dash]: https://dash.plotly.com/
[r-shiny]: https://shiny.posit.co/
[metabase]: https://www.metabase.com/
[metabase-api]: https://www.metabase.com/docs/latest/api-documentation#about-the-metabase-api
[redash]: https://redash.io/
[redash-api]: https://redash.io/help/user-guide/integrations-and-api/api
[tableau]: https://www.tableau.com/trial/tableau-software
[tableau-api]: https://help.tableau.com/current/api/rest_api/en-us/REST/rest_api_ref.htm
[power-bi]: https://www.microsoft.com/en-us/power-platform/products/power-bi
[looker]: https://cloud.google.com/looker
[looker-api]: https://developers.looker.com/api/explorer/4.0/
[quicksight]: https://aws.amazon.com/quicksight/
[domo]: https://www.domo.com/business-intelligence
