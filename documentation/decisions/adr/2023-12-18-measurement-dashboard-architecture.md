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
- New charts can be added to existing dashboards relatively easily
- New dashboards can be created and published relatively easily
- Users can export or download the data behind a given dashboard
- Open source contributors can host a local version of our dashboards using exported data

#### Nice to have

- The platform used to build dashboards can also be used to answer ad-hoc questions about the data
- System-to-system users can programmatically access the data behind a given dashboard via API
- Dashboards can include narrative text that explains the metrics we publish

## Options Considered

- Analytics API + static site
- Dashboard application (e.g. Dash or R Shiny)
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

### {option 1}

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### {option 2}

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

## Links <!-- OPTIONAL -->

- [{Link name}](link to external resource)
- ...
