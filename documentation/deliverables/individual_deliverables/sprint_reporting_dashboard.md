# Public sprint and delivery dashboard

| Field              | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Document Status    | Completed                                                       |
| Deliverable ticket | [Issue 65](https://github.com/HHS/simpler-grants-gov/issues/65) |
| Roadmap dashboard  | [Product roadmap](https://github.com/orgs/HHS/projects/12)      |
| Product owner      | Lucas Brown                                                     |
| Document owner     | Billy Daly                                                      |
| Lead developer     | Aaron Couch                                                     |
| Lead designer      | Andy Cochran                                                    |


## Short description
<!-- Required -->

- **What:** Release a basic public dashboard that allows internal and external stakeholders to track key sprint and delivery metrics for the project.
- **Why:** Publishing our metrics publicly encourages us to define and track key measures for each deliverable and builds public trust in the approach we’re taking. And tracking metrics around sprint and delivery, in particular, will help us scope and plan future deliverables more accurately by enabling us to understand team capacity and delivery velocity.
- **Who:**
  - Project maintainers who want to monitor team capacity and delivery velocity
  - Internal and external stakeholders who want to monitor our progress toward key deliverables

## Goals

### Business description & value
<!-- Required -->

**Problem statement:** Establishing and actively tracking operational metrics is critical to the long-term success of software projects. Often projects will start strong, quickly delivering features that add value and improve the user experience of their products. Without the accountability and insight that operational metrics provide, though, delivery velocity and value can decrease over time due to a number of factors, such as technical debt and deferred maintenance. And without a way to meaningfully engage with these metrics, such as a dashboard, trends or signals in the data can easily go undetected for extended periods of time, making it harder to address the underlying cause.

**Value:** Establishing robust operational metrics and publishing them to a public-facing dashboard are important steps in creating a data-driven culture that is focused on delivery. Defining clear operational metrics helps align the team internally around key delivery goals and creates a shared understanding around how we measure progress to those goals. Making these metrics publicly available commits us to tracking and monitoring our operational data and encourages us to respond to changes in performance against those metrics. By setting up the appropriate foundation to collect and publish data for delivery metrics, we also make it easier to publish future, more important, metrics about operational and program outcomes.

**Goals**

- Ensure that we are collecting the data needed to calculate proposed metrics
- Begin to create the infrastructure required for more advanced data analytics
- Begin to establish a framework to measure project impact and success
- Build public trust in our approach through transparency around core metrics
- Improve our ability to understand and manage team capacity and delivery velocity

### User Stories
<!-- Required -->

- As a **project maintainer**, I want:
  - to be able to provide input on which metrics we publish and how they are presented in the dashboard, so that I can use the dashboard to meaningfully plan and manage delivery on the project.
  - to be able to provide additional details about the metrics included in the dashboard, so that other stakeholders know how to interpret these metrics correctly in the context of the project.
  - to easily add new charts and metrics to the dashboard, so that we can continue to take a data-driven approach to the project and publicly report on the measures of success defined for each deliverable.
- As an **internal stakeholder**, I want:
  - the dashboard's key insights to be easy to understand at a glance, so that I don't need to spend a lot of time learning how to interpret the metrics correctly.
  - to be able to access the dashboard from the HHS network, so that I can easily monitor our metrics when I'm in the office.
  - to understand how the metrics are calculated, so that I can explain them to other stakeholders.
  - the data behind the dashboard to be updated regularly, so that I'm not sharing outdated information with other stakeholders.
- As a **member of the public**, I want:
  - to be able to easily navigate between the dashboard and other project resources (e.g. Simpler.Grants.gov or GitHub), so that I don't have to bookmark or remember the links for each resource separately.
  - all of the key project dashboards to be accessible in a central location, so that I don't have bookmark or remember multiple links to view all of the metrics.
- As an **open source contributor**, I want:
  - to have access to the data behind the dashboard, so that I can explore and analyze the data myself.
  - to access the source code behind the dashboard, so that I can use this dashboard for my own project or submit code to improve upon the existing dashboard.

## Technical description

### Dashboard

This deliverable should implement the architecture to build and host dashboards that enables us to iteratively publish operational metrics related to the project.

Some options to consider include:

1. S3 bucket (or database connection) + Jupyter notebook
2. Analytics API + separate dashboard UI
3. Custom dashboard application (e.g. Plotly Dash or R Shiny app)
4. Open source dashboard solution (e.g. Metabase or Redash)
5. Software as a Service (SaaS) dashboard solutions (e.g. PowerBI or Tableau)

The criteria that should inform this decision include:

- How will members of the public access this dashboard? **Note:** This a core requirement for this deliverable.
- How much control do we have over the look and feel of the dashboard?
- How easy is it to add new charts and metrics?
- Can users can export or download the data behind a given dashboard?
- Can system-to-system users access the data via API?
- Can open source contributors host the dashboard locally?
- Does the platform used to build the dashboard also support ad hoc data analysis?
- Can the dashboard include narrative text that explains how the metrics are calculated?

### ETL pipeline

This deliverable should implement a strategy for extracting, transforming, and loading the data needed to calculate the operational metrics being published.

Some options to consider include:

1. GitHub actions + custom scripts
2. Orchestration tool (e.g. Airflow, Prefect, Dagster, etc.)
3. SaaS ETL tools (e.g. Talend, Informatica, etc.)

The criteria that should inform this decision include:

- How easy is it to build and maintain new ETL pipelines?
- How easy is it to connect to new sources or targets?
- Can the ETL pipeline execute transformations written in different languages (e.g. Python, SQL, Node.js)?
- What options are supported for scheduling, retries, and dependencies between steps?
- Can open source contributors host and execute their own version of this pipeline?

### Data warehouse

This deliverable should also implement a strategy for storing the data needed to calculate operational metrics and (potentially) the results of those calculations.

Some options to consider include:

1. Files stored in S3 buckets (e.g. json, csv)
2. Separate schema in our existing Postgres database
3. Self-hosted OLAP database (e.g. ClickHouse)
4. Third-party managed data warehouse (e.g. Snowflake)

The criteria that should inform this decision include:

- Can the warehouse support both structured and unstructured data?
- How easy is it to query the data for ad hoc reporting and analysis?
- What kind of access controls does the warehouse provide?
- Can open source contributors host their own version of this data warehouse?

### Definition of done
<!-- Required -->

#### Must have

- [ ] Basic requirements
  - [ ] Code is deployed to main & PROD through our CI/CD pipeline
  - [ ] Services are live in PROD (may be behind feature flag)
  - [ ] All new services have passed a security review (as needed)
  - [ ] All new services have completed a 508 compliance review (as needed)
  - [ ] Data needed for metrics is actively being captured in PROD
  - [ ] Key architectural decisions made about this deliverable are documented publicly (as needed)
- [ ] Functional requirements
  - [ ] HHS staff can view the dashboard when they are on the HHS network
  - [ ] Members of the public can view the dashboard without a login
  - [ ] Members of the public can access the data that populates the dashboard
  - [ ] The data within the dashboard is refreshed *at least* once per day
  - [ ] The dashboard can be accessed from the static site and GitHub
  - [ ] The dashboard links to both the static site and GitHub
  - [ ] The dashboard displays the following metrics (at a minimum):
    - [ ] Sprint metrics
      - [ ] Sprint velocity - Number of tickets/points completed per sprint
      - [ ] Sprint burndown - Number of open tickets/points remaining in a sprint per day
      - [ ] Sprint burnup - Number of tickets/points opened and closed in a sprint per day
      - [ ] Sprint allocation - Number of tickets/points related to each deliverable in a given sprint
    - [ ] Delivery metrics
      - [ ] Completion percentage - Percentage of all tickets/points completed per deliverable
      - [ ] Deliverable burndown - Number of open tickets/points remaining for a deliverable per day
      - [ ] Deliverable burnup - Number of tickets/points opened and closed for deliverable per day

#### Nice to have

- [ ] Open source contributors can host a copy of the dashboard locally
- [ ] The data that populates the dashboard is available via API
- [ ] The dashboard supports interactivity, such as drill-downs or filters
- [ ] The metrics included in the dashboard are accompanied by explanations of how they are calculated

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. Number of unique dashboard visitors
2. Total number of dashboard views
3. Dashboard availability
4. Deployment build time

### Destination for live updating metrics
<!-- Required -->

The metrics described above will not be immediately available in the dashboard we're publishing in this deliverable, but a future deliverable will involve adding those metrics to a new page in the dashboard.

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- [x] **Static site:** Depending on the architectural pattern we follow, we'll either need to embed the dashboard directly in the static site or, at a minimum, link to the dashboard from the site. As a result, the static site needs to be launched before we can complete work on this dashboard.
- [ ] **API:** If we want to populate the dashboard with data from a set of analytics API endpoints, the API will also need to be launched prior to completion of this dashboard.

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- [ ] **Translation process:** While including written explanations of how the dashboard metrics are calculated is a stretch goal of this deliverable, we do not expect to have the translation process in place to translate those explanations into other supported metrics.

### Open questions
<!-- Optional -->

#### Who are the intended users for the dashboard?

The dashboard will be publicly available, so any member of the public could be a user, but the primary audience includes:

- Project maintainers who need to monitor team capacity and delivery velocity to help plan upcoming sprints
- Internal and external stakeholders who want to monitor our progress toward key deliverables in the roadmap

#### What kinds of questions are these users trying to answer?

These stakeholders will likely be asking the following questions:

- About sprints:
  - How many tickets/points are completed per sprint on average?
  - How well are we estimating capacity in a given sprint?
  - How often are tickets added mid sprint?
  - Which deliverables or bodies of work are we focused on in a given sprint?
- About deliverables:
  - How many tickets/points are needed to complete a deliverable?
  - How have the tickets/points required to complete a deliverable grown over time?
  - How close are we to completing that deliverable?

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. **Additional metrics:** While the goal of this deliverable is to create the infrastructure for publishing operational and program metrics for the public, only sprint and delivery metrics are in scope for this initial deliverable. Additional metrics or dashboards will need to be added in future deliverables.
2. **Additional ETL pipelines:** While other aspects of the project, e.g. transforming the current transactional data model to the new transactional data model, will likely require a similar ETL pipeline, this deliverable is only focused on building out the data pipeline needed for sprint and delivery metrics. That being said, the selection and implementation of an ETL infrastructure for this deliverable should take these future needs and use cases into consideration.
3. **Email campaign:** While the dashboard will be publicly available, this deliverable does not include sending an email campaign to public stakeholders publicizing the dashboard. Email communications around the dashboard will likely be scoped into a future deliverable, for example, once program-related metrics are added to the dashboard (e.g. place of performance data).

## Integrations

### Translations
<!-- Required -->

Does this milestone involve delivering any content that needs translation?

1. **Metric explanations:** If we include explanations of the metrics included in the dashboard, those explanations should be translated. The ability to translate this content will depend on the architecture we choose for the dashboard.

If so, when will English-language content be locked? Then when will translation be
started and completed?

1. **Translations after launch:** The content will be finalized by when the dashboard is launched. We will create tickets that represent the translations need them and complete them as part of the translation process created for the static site, once that translation process is launched.

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. **Dashboard:** This deliverable includes deploying the first public dashboard to PROD.
2. **Data warehouse:** This deliverable will also likely include setting up a data warehouse for the project.
3. **ETL pipeline:** This deliverable also includes creating a simple ETL pipeline to load data into the data warehouse.

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. **ETL pipeline + GitHub:** We'll need to connect the ETL pipeline to GitHub in order to extract the data needed for sprint and delivery metrics.
2. **ETL pipeline + data warehouse:** We'll also need to connect the ETL pipeline to the data warehouse where it will load the data for analysis.
3. **Dashboard + static site:** The static site will, at a minimum, link to the dashboard. Depending on the architectural pattern we choose, the dashboard *may* be embedded directly within the static site.
4. **Dashboard + API:** Depending on the architectural pattern we choose, the dashboard *may* retrieve its data directly from a set of API endpoints.
5. **Data warehouse + API:** If we choose to populate the dashboard with data fetched from the API, then we'll also need to connect the API to the data warehouse.

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. All of the data needed to calculate sprint and delivery metrics is *already* publicly available on GitHub, though we may be sharing that data in a format that is more conducive to analysis.

### Security considerations
<!-- Required -->

Does this milestone expose any new attack vectors or expand the attack surface of the product?

1. **API keys or tokens:** In order to connect the ETL pipeline to GitHub and our data warehouse, we'll need to maintain a set of secrets (e.g. API tokens, database connection URI, etc.) that enable these integrations. Securely managing these secrets and integrations increases the attack surface of the product.

If so, how are we addressing these risks?

1. **Secrets manager:** We'll use the appropriate secrets manager for the tool we choose to orchestrate our ETL pipeline. For example, if we are using GitHub actions as a lightweight scheduler, we'll use [GitHub secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions). If we're using a more mature orchestration tool, like Airflow, we'll use its [secrets backend](https://airflow.apache.org/docs/apache-airflow-providers/core-extensions/secrets-backends.html) feature.
2. **Least privilege:** In addition to managing these secrets securely, we'll also follow the principle of least privilege when creating and managing the scopes or roles associated with these integrations.
