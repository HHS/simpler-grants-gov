---
description: Create a public-facing dashboard with sprint and delivery metrics.
---

# Delivery dashboard

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>In Progress</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/65">Issue 65</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="delivery-dashboard.md#overview">Overview</a></p><ul><li><a href="delivery-dashboard.md#business-value">Business value</a></li><li><a href="delivery-dashboard.md#user-stories">User stories</a></li></ul></li><li><p><a href="delivery-dashboard.md#definition-of-done">Definition of done</a></p><ul><li><a href="delivery-dashboard.md#must-have">Must have</a></li><li><a href="delivery-dashboard.md#nice-to-have">Nice to have</a></li><li><a href="delivery-dashboard.md#not-in-scope">Not in scope</a></li></ul></li><li><a href="delivery-dashboard.md#proposed-metrics">Proposed metrics</a></li><li><a href="delivery-dashboard.md#open-questions">Open questions</a></li><li><p><a href="delivery-dashboard.md#logs">Logs</a></p><ul><li><a href="delivery-dashboard.md#change-log">Change log</a></li><li><a href="delivery-dashboard.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Release a basic public dashboard that allows internal and external stakeholders to track key sprint and delivery metrics for the project.
* **Why:** Publishing our metrics publicly encourages us to define and track key measures for each deliverable and builds public trust in the approach we’re taking. Tracking metrics around sprint and delivery, in particular, will help us scope and plan future deliverables more accurately by enabling us to understand team capacity and delivery velocity.
* **Who:**
  * Project maintainers who want to monitor team capacity and delivery velocity
  * Internal and external stakeholders who want to monitor our progress toward key deliverables

### Business value

#### Problem

Establishing and actively tracking operational metrics is critical to the long-term success of software projects. Often projects will start strong, quickly delivering features that add value and improve the user experience of their products. Without the accountability and insight that operational metrics provide, though, delivery velocity and value can decrease over time due to a number of factors, such as technical debt and deferred maintenance. And without a way to meaningfully engage with these metrics, such as a dashboard, trends or signals in the data can easily go undetected for extended periods of time, making it harder to address the underlying cause.

#### Value

Establishing robust operational metrics and publishing them to a public-facing dashboard are important steps in creating a data-driven culture that is focused on delivery. Defining clear operational metrics helps align the team around shared delivery goals and strategies for measuring progress. Making these metrics publicly available encourages us to monitor our operational data and respond to changes in performance.

By setting up the appropriate foundation to collect and publish data for delivery metrics, we also make it easier to publish future, more important, metrics about operational and program outcomes.

#### Goals

* Ensure that we are collecting the data needed to calculate proposed metrics
* Begin to create the infrastructure required for more advanced data analytics
* Begin to establish a framework to measure project impact and success
* Build public trust in our approach through transparency around core metrics
* Improve our ability to understand and manage team capacity and delivery velocity

#### Non-goals

* We're not trying to measure the performance of the team using these metrics. They are meant to be signals that inform planning and requests for additional capacity.
* The dashboard that is an output of this deliverable may not be the final or only dashboard that members of the public are meant to access long-term. This deliverable mainly proves our ability to publish metrics in _a_ public dashboard, but additional design and research work is needed for the long-term dashboard.

### User stories

* As a **project maintainer**, I want:
  * to be able to provide input on which metrics we publish and how they are presented in the dashboard, so that I can use the dashboard to meaningfully plan and manage delivery on the project.
  * to be able to provide additional details about the metrics included in the dashboard, so that other stakeholders know how to interpret these metrics correctly in the context of the project.
  * to be able to easily add new charts and metrics to the dashboard, so that we can continue to take a data-driven approach to the project and publicly report on the measures of success defined for each deliverable.
* As an **internal stakeholder**, I want:
  * the dashboard's key insights to be easy to understand at a glance, so that I don't need to spend a lot of time learning how to interpret the metrics correctly.
  * to be able to access the dashboard from the HHS network, so that I can easily monitor our metrics when I'm in the office.
  * to understand how the metrics are calculated, so that I can explain them to other stakeholders.
  * the data behind the dashboard to be updated regularly, so that I'm not sharing outdated information with other stakeholders.
* As a **member of the public**, I want:
  * to be able to easily navigate between the dashboard and other project resources (e.g. Simpler.Grants.gov or GitHub), so that I don't have to bookmark or remember the links for each resource separately.
  * all of the key project dashboards to be accessible in a central location, so that I don't have bookmark or remember multiple links to view all of the metrics.
  * to know when the data was last refreshed, so that I can understand how up-to-date the information in the dashboard is.
* As an **open source contributor**, I want:
  * to have access to the data behind the dashboard, so that I can explore and analyze the data myself.
  * to access the source code behind the dashboard, so that I can use this dashboard for my own project or submit code to improve upon the existing dashboard.
  * to understand how my contributions are reflected in the delivery metrics, so that I know what changes to expect when I contribute code or fix a bug.

## Definition of done

Following sections describe the acceptance criteria for this deliverable.

#### **Must have**

* [ ] Basic requirements
  * [ ] Code is deployed to main & PROD through our CI/CD pipeline
  * [ ] Services are live in PROD (may be behind feature flag)
  * [ ] All new services have passed a security review (as needed)
  * [ ] All new services have completed a 508 compliance review (as needed)
  * [ ] Data needed for metrics is actively being captured in PROD
  * [ ] Key architectural decisions made about this deliverable are documented publicly (as needed)
* [ ] &#x20;Functional requirements
  * [ ] HHS staff can view the dashboard when they are on the HHS network
  * [ ] Members of the public can view the dashboard without a login
  * [ ] The data within the dashboard is refreshed _at least_ once per day
  * [ ] The dashboard can be accessed from the static site and GitHub via links
  * [ ] The dashboard links to both the static site and GitHub
  * [ ] The dashboard contains the following Sprint metrics:
    * [ ] **Sprint velocity:** Number of tickets/points completed per sprint
    * [ ] **Sprint burndown:** Number of open tickets/points remaining in a sprint per day
    * [ ] **Sprint burnup:** Number of tickets/points opened and closed in a sprint per day
  * [ ] The dashboard contains the following delivery metrics:
    * [ ] **Completion percentage:** Percentage of all tickets/points completed per deliverable
    * [ ] **Deliverable burndown:** Number of open tickets/points remaining for a given deliverable per day
    * [ ] **Deliverable burnup:** Number of tickets/points opened and closed for a given deliverable per day
  * [ ] The following proposed metrics have been implemented to be tracked:&#x20;
    * [ ] Number of unique dashboard visitors
    * [ ] Total number of dashboard views
    * [ ] Dashboard availability
    * [ ] Number of failures to load data

#### **Nice to have**

* [ ] Open source contributors can host a copy of the dashboard locally
* [ ] The data that populates the dashboard is available to the public in a machine readable format
* [ ] The dashboard supports interactivity, such as drill-downs or filters
* [ ] The metrics included in the dashboard are accompanied by explanations of how they are calculated

#### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* **Additional metrics:** While the goal of this deliverable is to create the infrastructure for publishing operational and program metrics for the public, only sprint and delivery metrics are in scope for this initial deliverable. Additional metrics or dashboards will need to be added in future deliverables.
* **Additional ETL pipelines:** While other aspects of the project, e.g. transforming the current transactional data model to the new transactional data model, will likely require a similar ETL pipeline, this deliverable is only focused on building out the data pipeline needed for sprint and delivery metrics. That being said, the selection and implementation of an ETL infrastructure for this deliverable should take these future needs and use cases into consideration.
* **Email campaign:** While the dashboard will be publicly available, this deliverable does not include sending an email campaign to public stakeholders publicizing the dashboard. Email communications around the dashboard will likely be scoped into a future deliverable, for example, once program-related metrics are added to the dashboard (e.g. place of performance data).

## Measurement

### Proposed metrics

* Number of unique dashboard visitors
* Total number of dashboard views
* Dashboard availability
* Number of failures to load data

### Destination for live updating metrics

The metrics described above will not be immediately available in the dashboard we're publishing in this deliverable, but a future deliverable will involve adding those metrics to a new page in the dashboard. In the interim, we will share these metrics in the [Analytics section of our public wiki](broken-reference).

## Open questions

<details>

<summary>Who are the intended users of the dashboard</summary>

The dashboard will be publicly available, so any member of the public could be a user, but the primary audience includes:

* Project maintainers who need to monitor team capacity and delivery velocity to help plan upcoming sprints
* Internal and external stakeholders who want to monitor our progress toward key deliverables in the roadmap

</details>

<details>

<summary><strong>What kinds of questions are these users trying to answer?</strong></summary>

These stakeholders will likely be asking the following questions:

* About sprints:
  * How many tickets/points are completed per sprint on average?
  * How well are we estimating capacity in a given sprint?
  * How often are tickets added mid sprint?
  * Which deliverables or bodies of work are we focused on in a given sprint?
* About deliverables:
  * How many tickets/points are needed to complete a deliverable?
  * How have the tickets/points required to complete a deliverable grown over time?
  * How close are we to completing that deliverable?

</details>

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="282">Update</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td>4/9/2024</td><td>Incorporated comments on change request</td><td><ul><li><p>Changes to "Definition of done"</p><ul><li>Removed "Sprint Allocation" as a metric previously required for the dashboard</li><li>Moved public access to data to nice to have</li></ul></li><li><p>Changes to "Proposed metrics"</p><ul><li>Removed "Build time"</li><li>Added "Number of failures to load data"</li></ul></li><li><p>Changes to "Technical descriptions":</p><ul><li>Added additional considerations to decision drivers for dashboard UI</li></ul></li><li><p>Changes to "User stories":</p><ul><li>Added story for open source contributors wanting to see their impact on metrics</li><li>Added story for seeing last updated date on dashboard</li></ul></li></ul></td></tr><tr><td>4/10/2024</td><td>Moved part of the content of this spec into a technical spec</td><td><p>Moved the following into <a href="delivery-dashboard/delivery-dashboard-technical-spec.md">this spec</a>:</p><ul><li>Integrations</li><li>Technical descriptions</li></ul></td></tr><tr><td>5/6/2024</td><td>Moved deliverable status to "In Progress"</td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
