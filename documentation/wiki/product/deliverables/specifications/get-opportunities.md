---
description: >-
  Deploy an API endpoint that shares public information about every opportunity
  on grants.gov.
---

# GET Opportunities

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>In Progress</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/70">Issue 70</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="get-opportunities.md#overview">Overview</a></p><ul><li><a href="get-opportunities.md#business-value">Business value</a></li><li><a href="get-opportunities.md#user-stories">User stories</a></li></ul></li><li><p><a href="get-opportunities.md#technical-description">Technical description</a></p><ul><li><a href="get-opportunities.md#definition-of-done">Definition of done</a></li><li><a href="get-opportunities.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="get-opportunities.md#assumptions-and-dependencies">Dependencies and assumptions</a></li><li><p><a href="get-opportunities.md#logs">Logs</a></p><ul><li><a href="get-opportunities.md#change-log">Change log</a></li><li><a href="get-opportunities.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Deploy a public API endpoint to PROD that allows users to see at least one field per grant opportunity listed in grants.gov.
* **Why:** Build iteratively, validate security approval and connection to the current production database, and set the groundwork for continued work on the API.
* **Who**
  * Internal development team
  * Internal HHS stakeholders

### Business value

#### Problem

A previous effort to modernize grants.gov attempted to replicate _all_ of the existing functionality in a sandbox environment, then replace the legacy system in production at a fixed cutover date. By isolating the release of new features from production data, this approach reduced the ability to conduct meaningful usability testing and significantly increased the overall risk associated with the migration.

However, getting the necessary security approvals to expose production data in a new software system takes a fair amount of effort and documentation. For this reason, many federal software projects opt to defer working with production data for as long as possible, despite the risk it adds to the success of the project overall.

#### Value

Publishing live data from grants.gov in a new simpler.grants.gov public API proves that we have successfully established a connection between grants.gov and simpler.grants.gov environments _and_ received the security approvals required to share production data through the simpler.grants.gov API publicly.&#x20;

Additionally, by building features on top of production data, we enable users to test this new functionality against real-life scenarios and needs. This approach significantly reduces the long-term risk of the project relative to building and testing features against mock data and then attempting to replace all of the existing functionality in a single migration multiple years into the project.

#### Goals

* Select a URL for the API
* Expose the chosen URL name as the public API for the project that technical stakeholders can access and where future endpoints and/or features will be released
* Prove the successful completion of technical deliverables that enable faster development on the API without sacrificing code quality or security
* Prove that we have gotten the necessary security approval to host and share grants.gov production data in simpler.grants.gov environments

### User stories

* As an **HHS staff member**, I want:
  * the API to adopt the proper security practices, so that we have a strategy for preventing and responding to security vulnerabilities before the API is launched
  * published data about opportunities to be consistent between legacy grants.gov and `simpler.grants.gov`, so that users won't be confused by discrepancies between these sources
* As a **consumer of the API**, I want:
  * clear documentation and a user guide for the API, so that I don't have to rely on reading the source code to learn how to interact with and consume from it
  * changes made to a given endpoint to be backward-compatible, so that I can start building against this API without worrying about breaking changes
  * a clear and relatively intuitive data model to represent the opportunities in the API, so that the data returned by the endpoints match my expectations and are easy to work with
  * reliable uptime for the API, so that I don't have to worry about interruptions in API service breaking any systems that I try to integrate with it
* As a **project maintainer**, I want:
  * most of the critical development infrastructure to be in place when we officially launch the API, so that we can deploy bug fixes or new features quickly once the API is live
  * to be alerted when the API is down, so that I can troubleshoot the issue with minimal downtime or interruption in service
  * to automatically collect data on API usage and service availability, so that I can better understand usage patterns and identify opportunities to improve the API performance and reliability
  * the API code to be designed to minimize repetitive configuration for the data model, so that updates to the definition of a field in the API does need to be manually changed in the core data classes, API documentation, DB migration scripts etc.
* As an **open source contributor**, I want:
  * to be able run the code for the API locally, so that I can test my contributions to the codebase.

## Technical description

### Infrastructure requirements

The infrastructure developed to deploy and host the API should balance:

* Code quality
* Security
* Delivery velocity
* Cost & maintenance

### Developer experience requirements

The API should be developed and versioned in a way that balances:

* Discoverability
* Ease of adoption
* Backwards compatibility
* Clear and intuitive data model
* Minimal repetitive configuration for data model

### Data requirements

The way that data is stored and delivered through the API should balance:

* Eventual consistency with legacy Grants.gov
* Improvements to the existing data model
* Ease of managing schema changes

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

* [x] The following infrastructure requirements are satisfied:
  * [x] The code needed to build and deploy the site is merged to `main`
  * [x] The site is built and hosted with the tools selected in the [API Planning](https://github.com/HHS/simpler-grants-gov/issues/42) and [DB Planning](https://github.com/HHS/simpler-grants-gov/issues/48) deliverables
  * [x] All code quality checks set up in the [Developer Tools deliverable](https://github.com/HHS/simpler-grants-gov/issues/50) are passing
  * [x] The resources required to deploy and host the API are provisioned programmatically using the [Infrastructure-as-Code deliverable](https://github.com/HHS/simpler-grants-gov/issues/123) framework
  * [x] Code changes are deployed using the CI/CD pipeline set up in [the Back-end CI/CD deliverable](https://github.com/HHS/simpler-grants-gov/issues/57)
  * [x] DB migrations are automatically configured through scripts that enable upgrading/downgrading database quickly and easily (e.g., by using Alembic [https://github.com/sqlalchemy/alembic](https://github.com/sqlalchemy/alembic))
  * [x] The API has been load tested using the framework established in the [Peformance Testing Framework deliverable](https://github.com/HHS/simpler-grants-gov/issues/69) to ensure that it remains performant under heavy user traffic
  * [x] Logging/monitoring is configured, and it both records the metrics defined below and alerts the development team when the API is down or other key monitoring thresholds are met (e.g. frequency of 4xx requests, response times, etc.) per the [API Logging & Monitoring deliverable](https://github.com/HHS/simpler-grants-gov/issues/370)
  * [x] An incident response protocol is in place and the on-call team have followed that protocol in at least one training or simulation per the [Incident Response deliverable](https://github.com/HHS/simpler-grants-gov/issues/373)
  * [x] The chosen API URL sub-domain has been secured for future deployment of the API and we've contacted the teams working on the existing service (if any) that is currently accessed through this sub-domain
* [x] &#x20;The following developer experience (DX) requirements are satisfied:
  * [x] The API is live at the chosen URL
  * [x] Developers can learn how to interact with the API by referencing the API documentation
  * [x] The endpoint path indicates which major version of the API the developer is consuming
  * [x] Breaking changes to the API follow a predictable protocol that is documented within the [API Versioning deliverable](https://github.com/HHS/simpler-grants-gov/issues/68)
  * [x] The endpoint is available when legacy grants.gov experiences planned or unplanned downtime, maintenance, and upgrades
  * [x] Test data is scripted to provide consistent and reliable test fixtures for integration tests and local development per the [Test Data and Schema deliverable](https://github.com/HHS/simpler-grants-gov/issues/)
  * [x] All developers (including open source contributors) are able to spin up either database replica or test fixture data so that they can conduct local development.
* [x] &#x20;The following data requirements are satisfied:
  * [x] &#x20;The endpoint returns all of the grant opportunities that are available on grants.gov
  * [x] &#x20;The endpoint returns at least one (1) field per opportunity
  * [x] &#x20;Updates to the data in legacy Grants.gov are propagated to the new endpoint within 1 hour
  * [ ] Our desired project metrics are captured and displayed in a public place

### Proposed metrics

* Number of unique users accessing API
* Total number of API calls made
* Error rate of API calls
* Uptime of service
* Deployment/hosting costs
* Average response time

### Destination for live updating metrics

Page on the public wiki that is updated at the end of each sprint. **Note:** This will likely change once we deliver [the Public Measurement Dashboard deliverable](https://github.com/HHS/simpler-grants-gov/issues/65)

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* &#x20;[**simpler.grants.gov domain**](https://github.com/HHS/simpler-grants-gov/issues/)**:** Secures access to the `simpler.grants.gov` domain from which the API endpoints will be routed.

Are there any notable capabilities / deliverables we **do** **not** expect to be in place by the completion of work on this deliverable?

* &#x20;**AuthN/AuthZ:** While the implementation of rate limiting or other API security measures may require some basic authentication, the full AuthN/AuthZ framework will be developed in a later deliverable.

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* **User Interface:** Because this deliverable is focused on the API endpoint, it will not include delivering a user interface for non-technical users to access a list of opportunities. That work will be incorporated in the Search UI deliverable instead.
* **Translating API Docs:** Translation of key documents will be covered in an upcoming deliverable.
* **Public communications:** This deliverable does _not_ include making a public announcement about the launch of the API. An announcement to targeted groups of system-to-system (S2S users) will be scoped into a subsequent deliverable.

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

* Yes, portions of the API user guide and docs will need to be translated.

If so, when will English-language content be locked? Then when will translation be started and completed?

* Timeline and strategy for translation is still TBD.

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **API:** This deliverable is the official release of the `simpler.grants.gov/api`
* **Replica Database:** A replica of relevant tables from the legacy database
* **Updated Data Model:** An updated data model that will provide the data for the GET Opportunities endpoint
* **ETL Pipeline:** An ETL pipeline that both replicates data from legacy grants.gov and then transforms that data into the new `simpler.grants.gov` data model

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **API + Static Site or Wiki:** We will need to host the API docs and user guide on either the wiki platform or the static site.

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* **Opportunity Field(s):** This deliverable will expose at least one field from the opportunity resource in production.

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

* **Legacy DB Access:** Because this deliverable requires replicating data from the legacy database, it exposes a new potential attack vector to that database.
* **Replica Database Access:** This deliverable expands the attack surface of the application by introducing the replica database as another data store that needs to be secured against unauthorized access.
* **API:** This deliverable deliverable also expands the attack surface of the application by launching the API, which needs to be secured against Denial of Service (DoS) attackes.

If so, how are we addressing these risks?

* **Security Approval:** Before the official launch of the API to the public, we will be reviewing our infrastructure and code security practices with the HHS team to ensure that they adhere to HHS standards.
* **Developer Tools:** As part of the Developer Tools deliverable, the team is setting up a series of tools that will enforce certain code quality standards and security checks. These include things like secrets management, code linting, dependency monitoring, etc.
* **API Security Planning:** As part of the API Security Planning deliverable, we will specifically be identifying and evaluating strategies to mitigate security risks for the API, such as the use of API tokens and/or rate limiting API requests.

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="246">Update</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td>4/5/2024</td><td>Adds acceptance criteria for publish metrics publicly to match GitHub issue</td><td>This acceptance criteria was added in GitHub on 3/14/24 to clarify the expectation around how stakeholders would access metrics for this 30k</td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="358">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td><p>All criteria except for:</p><ul><li>Our desired project metrics are captured and displayed in a public place</li></ul></td><td>Criteria were previously marked as completed in GitHub, with the exception of publishing metrics.</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
