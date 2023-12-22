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

- As a **member of HHS staff**, I want:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}
- As an **open source contributor**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}

## Technical description

### Dashboard
<!-- Optional -->

{List requirements specific to this sub-deliverable, options to consider, etc.}

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

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [ ] [to be added]

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- [ ] [to be added]

### Open questions
<!-- Optional -->

#### Who are the intended users for the dashboard?

TODO

#### What kinds of questions are these users trying to answer?

TODO

#### We have this data separate and users could access those data points separately, but it would be good to understand how the users will be using that information?

TODO

#### With this first iteration of this, are we looking to validate a platform that can take multiple data sources?

TODO


### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. [to be added]

## Integrations

### Translations
<!-- Required -->

Does this milestone involve delivering any content that needs translation?

If so, when will English-language content be locked? Then when will translation be
started and completed?

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. [to be added]

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. [to be added]

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. [to be added]

### Security considerations
<!-- Required -->

Does this milestone expose any new attack vectors or expand the attack surface of the product?

If so, how are we addressing these risks?

1. [to be added]
