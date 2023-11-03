# Search MVP

| Field           | Value                                                      |
| --------------- | ---------------------------------------------------------- |
| Document Status | Completed                                                  |
| Epic Link       | [Issue 89](https://github.com/HHS/grants-equity/issues/89) |
| Epic Dashboard  | [Product Roadmap](https://github.com/orgs/HHS/projects/12) |
| Product Owner   | Lucas Brown                                                |
| Document Owner  | Billy Daly                                                 |
| Lead Developer  | Aaron Couch                                                |
| Lead Designer   | Andy Cochran                                               |


## Short description
<!-- Required -->

- **What:** Soft launch a minimum viable search feature for Simpler Grants.gov that allows users to filter and sort funding opportunities by *at least* one field and by keywords.
- **Why:** Proves the successful integration of front-end and backend systems in production and delivers basic search functionality that we can begin to leverage for user testing
- **Who:** Targeted group of external stakeholders with whom we'd like to conduct user research and testing

## Goals

### Business description & value
<!-- Required -->

The launch of a basic search feature primarily proves our ability to integrate front-end and backend systems in a production environment, while also providing a minimum viable product (MVP) that we can leverage for targeted user testing.

As a result, this deliverable aims to:

- Successfully integrate the front-end with the API for the first time in production
- Create the internal infrastructure needed to support future search functionality
- Establish simpler.grants.gov as the location where that functionality will be released
- Deliver a minimum viable product (MVP) that we can use to collect user feedback from a targeted set of stakeholders

By contrast, this MVP version of search ***does not*** attempt to:

- Replicate *all* of the search functionality currently supported by grants.gov
- Dramatically improve the accuracy of search results relative to those returned by grants.gov
- Replace grants.gov as the primary platform applicants use to find funding opportunities

### User Stories
<!-- Required -->

- As a **system-to-system user**, I want:
  - To be able to access all of the search features via the API, so that search results are the same whether I'm using the API or the UI.
  - The search functionality to be outlined in the API docs, so that I don't have to rely on experimentation to learn how to search for opportunities.
- As a **prospective applicant**, I want:
  - To be able to be able to search with filters applied, so that the only search results returned are ones that match both the keyword and field-based criteria I specified
  - The search results to have a link to the opportunity on grants.gov, so that I don't have to repeat my search on grants.gov after finding an opportunity I want to apply for on simpler.grants.gov
  - To receive an incentive if I participate in user research for simpler.grants.gov, so that I am fairly compensated for the time that I invest in testing out new features and answering questions
  - Filters and search terms to be added to the url, so that I can save or share the link to a particular set of search results
- As a **project maintainer**, I want:
  - To be notified when simpler.grants.gov experiences downtime, so that I can quickly troubleshoot the issue with minimal impact on end users
  - The system architecture we create for this deliverable to support future search features as well, so that we don't need to discard and re-build critical infrastructure

## Technical description

### Search API
<!-- Optional -->

The ability to search and filter opportunities should be provided through an API endpoint, which allows the user to:

- Search the list of opportunities with open ended key words
- Filter the search results by *at least* one structured field (e.g. award date, opportunity type, etc.)
- Sort the search results based on the value of *at least*

Through the design and development of this API endpoint, the team should answer the following questions and record the decisions in one or more ADRs:

- How should search and filter criteria be passed to the API endpoint used for search?
- How should we support basic logic such as greater than, less than, as well as and/or/not conditions?
- Which fields should support filtering and sorting?
- Do we use an existing search service (e.g. Elasticsearch) or build our own?

### Search Page

The primary page we'll need to deliver for the user interface (UI) is a search page, which should allow users to:

- Enter key words to search the list of funding opportunities
- Filter search results by *at least* one structured field (e.g. award date, opportunity type, etc.)
- View a common set of fields for each opportunity returned by the search (e.g. title, award date, summary, etc.)
- Sort the set of results returned by *at least* one structured field (e.g. award date, title, etc.)

### Definition of done
<!-- Required -->

- [ ] Basic requirements:
  - [ ] Code is deployed to `main` & PROD through our CI/CD pipeline
  - [ ] Services are live in PROD (may be behind feature flag)
  - [ ] Simpler site translations are live in PROD (if necessary). Translations of the search results content coming from grants.gov will not be included in this 30k ft deliverable. 
  - [ ] All new services have passed a security review (if necessary)
  - [ ] All new services have completed a 508 compliance review (if necessary)
  - [ ] Data needed for metrics is actively being captured in PROD
  - [ ] Key architectural decisions made about this deliverable are documented publicly
- [ ] Functional requirements:
  - [ ] Users can search for opportunities by key word
  - [ ] Users can filter search results by *at least one* structured field (e.g. award date, opportunity type, etc.)
  - [ ] Users can sort search results by *at least* one structured field (e.g. award date, title, etc.)
  - [ ] All of the search features available in the UI are also available via the API, and vice versa
  - [ ] Search criteria are reflected in the URL so that users can bookmark or share the link to a given set of search results
  - [ ] Users can access the corresponding grants.gov page for an opportunity they find on simpler.grants.gov via link on the search results

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. Total number of searches made via the UI
2. Total number of searches made via the API
3. Number of results returned per search
4. Number of searches made per search term
5. Number of searches made per filter combination
6. Click conversion rate from search results to the opportunity listing (on grants.gov)

### Destination for live updating metrics
<!-- Required -->

Page on the public wiki. **Note:** This will likely change once we deliver the [Public Measurement Dashboard milestone](https://github.com/HHS/grants-equity/issues/65)

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- **Front-end:** The search UI will build on the front-end work completed in both the [initial static site launch](https://github.com/HHS/grants-equity/issues/62) and the [subsequent improvements](https://github.com/HHS/grants-equity/issues/568) that created the following functionality:
  - **[Front-end CI/CD](https://github.com/HHS/grants-equity/issues/58):** Automatically tests and deploys front-end code
  - **[Foundational UI](https://github.com/HHS/grants-equity/issues/60):** Enforces a consistent user interface and web design system across the frontend
  - **[Translation Process](https://github.com/HHS/grants-equity/issues/81):** Facilitates and publishes translations of front-end content in multiple languages
- **API:** The search API will build on the existing backend work completed to launch the [GET Opportunities endpoint](https://github.com/HHS/grants-equity/issues/70) which delivered the following functionality:
  - **[Backend CI/CD](https://github.com/HHS/grants-equity/issues/57):** Automatically tests and deploys backend code
  - **[Database Replica](https://github.com/HHS/grants-equity/issues/54):** Maintains eventual consistency (with low latency) between the data in grants.gov and simpler.grants.gov and ensures that simpler.grants.gov services remain available when grants.gov services experience downtime
  - **[Data Architecture](https://github.com/HHS/grants-equity/issues/125):** Enables simpler.grants.gov to read data from an updated (and simplified) data model
  - **[API Docs](https://github.com/HHS/grants-equity/issues/71):** Documents the API endpoints released with each deliverable

What functionality do we expect to be in place by ***the end*** of work on this deliverable?

- **[Incident Response](https://github.com/HHS/grants-equity/issues/373):** Ensures that we have a robust incident response plan in place when simpler.grants.gov services are interrupted
- **[Search API](https://github.com/HHS/grants-equity/issues/90):** Enables system-to-system users to access the search features through the API
- **[Search Page](https://github.com/HHS/grants-equity/issues/576):** Enables all other users to access the search features through the user interface
- **[User Research Incentives](https://github.com/HHS/grants-equity/issues/84):** Enables us to engage stakeholders for user testing of the new search functionality

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- **AuthN/AuthZ:** Authentication (AuthN) and Authorization (AuthZ) will be the focus of a subsequent deliverable, so the MVP is not expected to support any features that require users to be logged in.

### Open questions
<!-- Optional -->

#### Does the metadata and the text of the opportunity need to be translated?

TODO

#### What metadata is currently available about each opportunity?

TODO

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this deliverable:

- **Personalization:** Because the MVP will not support a login experience, any personalized features that require authentication (e.g. saving searches) are explicitly descoped from this deliverable.
- **Opportunity Listing Page:** The MVP will not include an opportunity listing page, instead the search results will directly link to the corresponding opportunity listing page on grants.gov. An updated opportunity listing page will be completed in its own 30k ft deliverable.
- **Full Text Search:** The MVP is only expected to include (a subset of) filtering based on opportunity metadata that is already available in the existing grants.gov database, so searching the full text of the opportunity is explicitly descoped from this deliverable.

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

The translation process will be determined in the 30k ft deliverable in Public Launch: Static Site.

*If so, when will English-language content be locked? Then when will translation be started and completed?*

The translations process will be determined in the 30k ft deliverable: Static Site Public Launch.

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. **Search API:** Search functionality will be exposed via the API for the first time in this deliverable
2. **Search UI:** Search functionality will be exposed via the user interface for the first time in this deliverable

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. **API + Front-end:** This deliverable represents the first time the simpler.grants.gov front-end and API will be integrated in production

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. TODO

### Security considerations
<!-- Required -->

Does this 30k ft deliverable expose any new attack vectors or expand the attack surface of the product?

1. TODO

If so, how are we addressing these risks?

1. TODO
