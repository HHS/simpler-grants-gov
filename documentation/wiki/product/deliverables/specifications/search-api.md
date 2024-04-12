---
description: Extend and transform the opportunity data model
---

# Search API

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Ready for approval</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/972">Issue 972</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="search-api.md#overview">Overview</a></p><ul><li><a href="search-api.md#business-value">Business value</a></li><li><a href="search-api.md#user-stories">User stories</a></li></ul></li><li><p><a href="search-api.md#technical-description">Technical description</a></p><ul><li><a href="search-api.md#definition-of-done">Definition of done</a></li><li><a href="search-api.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="search-api.md#assumptions-and-dependencies">Dependencies and assumptions</a></li><li><p><a href="search-api.md#logs">Logs</a></p><ul><li><a href="search-api.md#change-log">Change log</a></li><li><a href="search-api.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What**
  * **Expand the data model** beyond the single opportunity table
  * **Set up a transformation workflow** so the data from the current grants.gov live data model transforms into the new data model for simpler.grants.gov
  * **Enhance the Search API** endpoint to allow most basic search on title and description fields, sorting by title or date (or other low hanging fruit), and filtering
  * **Get security approval** for storing (but not sharing) non-public opportunities in Simpler AWS account
* **Why**
  * Allows us to expand from a title field to fields that support sorting, filtering, description, and other fields that produce a meaningful search experience, such as "status" and "agency"
  * Enables a broader and more robust API and enhances functionality, making it more versatile.
* **Who**
  * Subset of system-to-system users, including but not limited to:
    * Federal Demonstration Partnership (FDP)
    * US digital response (USDR)
    * S2S Federal User Group
  *   Internal development team


* **Out of scope**
  * Search engine, [full text search](https://www.postgresql.org/docs/current/textsearch-intro.html), or any other keyword search beyond basic query in title or description
  * Enhanced authentication
  * We're not handling rate-limiting or infrastructure changes as that would prepare for users and number of users outside of the scope of the limited audience

### Business value

#### Problem

The current GET Opp API, based on a single opportunity table with excessive and redundant data, provides limited value to consumers due to complexity and difficulty in obtaining desired information. This restricts the team's ability to build future functionalities and expand beyond the existing structure.

#### Value

By expanding the opportunity data model and transforming data into a new, simpler structure, we will:

* **Enhance API functionality:** Create a broader and more robust API with a well-defined endpoint, simplifying data access and retrieval for consumers
* **Increase developer productivity:** Decouple the API from the legacy grants.gov schema, enabling faster development of new features and functionalities
* **Improve data usability:** Organize data logically and eliminate redundancy, allowing easier searching, filtering, and analysis
* **Lay foundation for future expansion:** Enable building additional functionalities like advanced search based on the enriched data model

#### Goals

This effort aims to...&#x20;

* **Data model design:** Create the first version of a new, optimized data model with clear tables, relationships, and attributes that represent opportunities efficiently
* **Data transformation:** Implement a process to automatically convert data from the existing grants.gov model to the new simpler.grants.gov model
* **API development:** Update and expand the API based on the new data model, offering a well-defined endpoint for various data access needs
* **Testing and deployment:** Thoroughly test the new data model, transformation process, and API before deploying them to production
* **Documentation and training:** Document the new data model, API changes, and transformation process for developers and consumers

### User stories

* As a **member of HHS staff**, I want to:
  * I want to track the usage and impact of the API, allowing me to assess its effectiveness and make improvements
* As a **consumer of the API**, I want to:
  * easily access relevant opportunity data through well-defined API endpoints and documentation, enabling me to integrate the API into my systems so that I can efficiently utilize grants information
* As a **system-to-system user**, I want:
  * to be able to access search features via the API, so that search results are the same whether I'm using the API or the UI
  * the search functionality to be outlined in the API docs, so that I don't have to rely on experimentation to learn how to search for opportunities
* As a **HHS contracting engineer**, I want to:
  * clear and well-documented data model, API endpoints, and ETL processes, enabling me to maintain and update the system efficiently
  * easily understand the data transformation process and its dependencies, allowing me to troubleshoot issues and ensure data integrity

## Technical description

### **Expanded data model**&#x20;

**Goals**

* Enable the team to build future endpoints against a simplified data model instead of one that is tightly coupled to the existing schema in grants.gov live
* Create the foundation for expanding beyond the existing `opportunity` table, which will be useful for things like search

**Scope**&#x20;

Expand the data model in the new Postgres database beyond the single opportunity table.

* Propose an approach for the data model that will be reviewed by key stakeholders
* Investigation into current database structure
* Determine data conversions that will be needed

### **Data  Transformations**

**Goals**&#x20;

* Create a process that translates data between the current and future data model

**Scope**

Set up a tool that transforms the data from the current grants.gov live data model into the new data model for simpler.grants.gov.

* ADR to determine the technology for the ELT
* Infrastructure set up for running the ELT job(s)
* Setup logic for converting data
* Configure transformation tool to connect data sources

### **API development**

**Goals**

* Incorporate new data model into API
* Improve data accuracy by incorporating lookup value logic
* Update search API to provide filtering, sorting, and query search term for Search UI

**Scope**

Enhance GET Opp API functionality to accommodate new data models, ensuring seamless integration with the DMS copy, and incorporating lookup value logic for improved data accuracy. We should consider how to support basic logic such as greater than, less than, as well as and/or/not conditions.&#x20;

* Addition of opportunity tables for DMS copy.
* Inclusion of new tables based on data modeling work.
* Authentication that requires users to identify who they are such as key management
* Update API model with new fields from the introduced tables.
* Documentation and tech spec for lookup value work
* Implementation of lookup value logic for API and DB to recognize allowed values.
* Setup and implementation of an approach for loading lookup data
* Document API changes
* Determine how to handle how search and filter criteria will be passed to the API endpoint used for search. This may mean releasing functionality in a future version
* Determine how to handle basic logic such as greater than, less than, and/or/not. This may mean releasing functionality in a future version
* Determine which fields should support filtering and sorting. This may also be determined by design work in the Search UI effort

### **Security for API**&#x20;

**Goal**

Get approval to store non-public opportunities in the Simpler AWS production account.



### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* Static site updates will be completed in the Search UI deliverable.&#x20;
* Advanced data processing will not be implemented in this effort
* Data visualization and reporting capabilities within the API will not be completed in this effort
* Search engine, [full text search](https://www.postgresql.org/docs/current/textsearch-intro.html), or any other keyword search beyond basic query in title or description
* Enhanced authentication
* We're not handling rate-limiting or infrastructure changes as that would prepare for users and number of users outside of the scope of the limited audience

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

* **Must have**
  * [ ] Basic requirements
    * [ ] Code is deployed to main & PROD through our CI/CD pipeline
    * [ ] Services are live in PROD (may be behind feature flag)
    * [ ] All new services have passed a security review (as needed)
    * [ ] All new services have completed a 508 compliance review (as needed)
    * [ ] Data needed for metrics is actively being captured in PROD
    * [ ] Key architectural decisions made about this deliverable are documented publicly (as needed)
  * [ ] Functional requirements
    * [ ] The API reads data from a new opportunity data model with clearly defined tables, relationships, and attributes
    * [ ] The API pulls data from more than just the `opportunity` data of the Grants.gov live database.&#x20;
    * [ ] An ERD for the new data model is documented in a publicly accessible location, and the ERD is automatically updated with future changes to the data model
    * [ ] There is a service in place which transforms data from the old data model from Grants.gov live to a new, intuitive, easier-to-use data model.&#x20;
    * [ ] Changes made to data on grants.gov live are propagated to the new simpler.grants.gov data model within 1 hour
    * [ ] A new (minor) version of the `GET /opportunities` API endpoint has been released and includes fields from the expanded data model (e.g. status, agency, etc.)
    * [ ] A new search endpoint has been released that allows API consumers to:&#x20;
      * [ ] Search for opportunities by keyword
      * [ ] Filter opportunities by at least one structured field from the new data model
      * [ ] Sort opportunities by at least one structured field from the new data model
    * [ ] We've received security approval to host (but not share) non-public data in the AWS Simpler environments
    * [ ] Select a logging and monitoring tool for backend and frontend &#x20;
    * [ ] Started the procurement process for the logging and monitoring tool
* **Nice to have**
  * [ ] S2S users can sign up for the API with a self-service authentication option that replaces the key management method established previously
  * [ ] S2S users can learn how to consume from the API by following a publicly documented user guide, in addition to referencing our OpenAPI specification
  * [ ] Observability metrics set up to display metrics in the application logging/monitoring tool selected

### Proposed metrics

* Total number of unique users of the search endpoint&#x20;
* Total number of API requests to the search endpoint
* Track keywords searched in the API request
* Track filters used in the API request
* Regular reporting of error rate of API responses&#x20;
* Regular reporting of latency of API



## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

**API:** The search API will build on the existing backend work completed to launch the [GET Opportunities endpoint](https://github.com/HHS/simpler-grants-gov/issues/70) which delivered the following functionality:

* [**Backend CI/CD**](https://github.com/HHS/simpler-grants-gov/issues/57)**:** Automatically tests and deploys backend code
* [**Database Replica**](https://github.com/HHS/simpler-grants-gov/issues/54)**:** Maintains eventual consistency (with low latency) between the data in grants.gov and simpler.grants.gov and ensures that simpler.grants.gov services remain available when grants.gov services experience downtime
* [**Data Architecture**](https://github.com/HHS/simpler-grants-gov/issues/125)**:** Enables simpler.grants.gov to read data from an updated (and simplified) data model
* [**API Docs**](https://github.com/HHS/simpler-grants-gov/issues/71)**:** Documents the API endpoints released with each deliverable

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* The Search UI 30k deliverable will be happening in parallel with this effort. The Search UI effort will use the Search API&#x20;
* The data model for Grants as a Protocol will not be completed before this work starts and we will need to update the API in a future deliverable

### Open questions

<details>

<summary>How should we handle the following?</summary>

The ability to search and filter opportunities should be provided through an API endpoint, which allows the user to:

* Search the list of opportunities with open-ended keywords
* Filter the search results by _at least_ one structured field (e.g. award date, opportunity type, etc.)
* Sort the search results based on the value of _at least_ one structured field (e.g. award date, title, etc.)

</details>

<details>

<summary>How should we handle the following? </summary>

Through the design and development of this API endpoint, the team should answer the following questions and record the decisions in one or more ADRs:

* How should search and filter criteria be passed to the API endpoint used for search?
* How should we support basic logic such as greater than, less than, as well as and/or/not conditions?
* Which fields should support filtering and sorting?
* Do we use an existing search service (e.g. Elasticsearch) or build our own?

</details>

<details>

<summary>Can we search by opportunity number in the new search? </summary>

If so, that would be some very low-hanging fruit to pick up and make a better search experience than what's on g.gov!&#x20;

</details>

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

1. Not at this time

If so, when will English-language content be locked? Then when will translation be started and completed?

1. n/a

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

1. Tool that we will use for transformation of data

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

1. We will select a tool for ETL transformation and that will be going into production for the first time

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

1. Yes, new fields will be shared through this API but these fields have been shared publicly through grants.gov

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

1. There will be an increase in the number of tables.&#x20;
2. There is the potential for unauthorized access if it's not properly secured
3. There are risks associated with the transformation tool we choose if it is not well-vetted and configured securely&#x20;

If so, how are we addressing these risks?

1. Implement secure coding practices
2. Enforce strong authentication and authorization mechanisms such as key management
3. ETL tool will go through our ADR process and we will select a tool with security factors as a decision criteria&#x20;
4. Other security preventions include - scanning for vulnerabilities using automated tools and manual reviews, we have logging to track data access and usage, we will also go through the formal security review process to ensure that we are aligned with the SIA and security controls required

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="282">Update</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
