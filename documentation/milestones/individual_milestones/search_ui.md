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

Launch a minimum viable search feature for Simpler Grants.gov that allows non-technical users to filter funding opportunities by *at least* one field and by keywords.

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

- As a **{type of user 1}**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}
- As a **{type of user 2}**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}

## Technical description

### {Optional Sub-deliverable}
<!-- Optional -->

{List reqiurements specific to this sub-deliverable, options to consider, etc.}

### Definition of done
<!-- Required -->

- [ ] [to be added]
- [ ] Code is deployed to `main` & PROD
- [ ] Services are live in PROD (may be behind feature flag)
- [ ] Metrics are published in PROD.
- [ ] Translations are live in PROD (if necessary)

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. {Metric 1}

### Destination for live updating metrics
<!-- Required -->

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- **Front-end:** The Search UI will build on the front-end work completed in both the initial static site launch and the subsequent improvements that created the following functionality:
  - **Front-end CI/CD:** Automatically tests and deploys front-end code
  - **Foundational UI:** Enforces a consistent user interface and web design system across the frontend
  - **Translation Process:** Facilitates and publishes translations of front-end content in multiple languages
- **API:** The Search API will build on the existing backend work completed to launch the GET Opportunities endpoint which delivered the following functionality:
  - **Backend CI/CD:** Automatically tests and deploys backend code
  - **Database Replica:** Maintains eventual consistency (with low latency) between the data in grants.gov and simpler.grants.gov and ensures that simpler.grants.gov services remain available when grants.gov services experience downtime
  - **Data Architecture:** Enables simpler.grants.gov to read data from an updated (and simplified) data model

What functionality do we expect to be in place by ***the end*** of work on this deliverable?

- **[Incident Response](https://github.com/HHS/grants-equity/issues/373):** Ensures that we have a robust incident response plan in place when simpler.grants.gov services are interrupted
- **[Search API](https://github.com/HHS/grants-equity/issues/90):** Enables system-to-system users to access the search features through the API
- **Search Page:** Enables all other users to access the search features through the user interface
- **[Opportunity Listing Page](https://github.com/HHS/grants-equity/issues/277):** Displays basic information about a given funding opportunity accessed from the search page
- **User Research Incentives:** Enables us to engage stakeholders for user testing of the new search functionality

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
- **Full Text Search:** The MVP is only expected to include (a subset of) filtering based on opportunity metadata that is already available in the existing grants.gov database, so searching the full text of the opportunity is explicitly descoped from this deliverable.
- **Full Text Listing:** Similarly, the first iteration of the opportunity listing page delivered is only expected to include opportunity fields that are already available in the existing grants.gov database. As a result, displaying the full text of the opportunity within the listing page is explicitly descoped from this deliverable.

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

*If so, when will English-language content be locked? Then when will translation be started and completed?*

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

Does this milestone expose any new attack vectors or expand the attack surface of the product?

1. TODO

If so, how are we addressing these risks?

1. TODO
