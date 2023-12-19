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

- Analytics API + static site
- Custom dashboard application (e.g. Dash or R Shiny)
- SaaS dashboard solution (e.g. PowerBI or Tableau)
- Open source dashboard solution (e.g. Metabase or Superset)

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### Analytics API + static site

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Custom dashboard app

This option involves building a custom dashboard app using an existing framework, such as Dash (python) or R Shiny. This custom built application would be hosted as its own application and be slightly more integrated than a separate analytics API + static site, but it would be more customizable than using an open source or proprietary dashboard solution.

> [!NOTE]
> **Bottom line:** This option would be best if we want to retain control over the look and feel of the dashboard and manage the backend and frontend of the dashboard together, but can dedicate more engineering resources to building and hosting it and don't need to expose analytics data via API.

- **Pros**
  - Provides more fine-grained control over the look and feel of the dashboard application, on par with option 1.
  - Allows a single engineer familiar with Python (or R if we use Shiny) to manage both the backend (e.g. analytics) and frontend (visualization and design of the dashboard).
  - Faster to implement new charts and dashboards than an analytics API and separate frontend.
  - Enables us to combine multiple dashboards into a single application.
- **Cons**
  - Building or modifying dashboards is still quite technical, not something a business analyst could do on their own.
  - Harder to implement new charts or dashboards than SaaS or open source dashboard solution.
  - Does not easily support adhoc reports or dashboards in the same tool.
  - Does not easily support exposing analytics data to S2S users via API.

### Open source dashboard solution

This option involves selected and hosting an open source dashboard solution, such as Metabase or Redash. This solution would most likely be self-hosted and connect directly to our data warehouse, and enable business analysts to build adhoc reporting and dashboards with SQL and a drag-and-drop interface. Individual dashboards can then be configured for broader publication to external stakeholders.

> [!NOTE]
> **Bottom line:** This option would be best if we want to adopt an open source solution that enables business analysts to build and host dashboards with minimal support from engineers, but are willing to compromise on the amount of control we have over the look and feel of those dashboards and don't need to expose analytics data via API.

- **Pros**
  - Enables a business analyst or engineer with basic SQL experience to build and manage dashboards.
  - Faster and easier to implement new charts and dashboards than options 1 or 2.
  - Supports adhoc reports and dashboards in the same tool.
  - Allows open source contributors to host local versions of our dashboards (depending on the tool we choose).
- **Cons**
  - Harder to control the look and feel of the resulting dashboards.
  - Harder to combine multiple dashboards into a single "application".
  - Does not easily support exposing analytics data to S2S users via API.
  - Still somewhat harder to host and maintain than a fully SaaS dashboard solution.

### SaaS dashboard solution

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

> [!NOTE]
> **Bottom line:** This option would be best if we want to adopt an externally hosted solution that enables business analysts to build dashboards with no direct support from engineers, but are willing to accept a higher per-user cost, closed-source tool, and fewer options for customization.

- **Pros**
  - Enables a business analyst to easily build and maintain dashboards, even with minimal SQL or programming experience.
  - Faster and easier to implement new charts and dashboards than options 1 or 2.
  - Supports adhoc reports and dashboards in the same tool.
  - Easier to combine multiple dashboards into a single "application" than open source dashboard solution.
- **Cons**
  - Harder to control the look and feel of the resulting dashboards (depending on the tool).
  - Harder to version control the structure and content of dashboards (depending on the tool).
  - Does not easily support exposing analytics data to S2S users via API.
  - Does not allow open source contributors to host local versions of our dashboards.
  - Higher direct costs than all of the other options.

## Links <!-- OPTIONAL -->

- [{Link name}](link to external resource)
- ...
