# GET Opportunities Endpoint

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Document Status | Accepted                                                             |
| Epic Link       | [Issue 70](https://github.com/HHS/grants-equity/issues/70)           |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-08-23                                                           |
| Product Owner   | Lucas Brown                                                          |
| Document Owner  | Billy Daly                                                           |
| Lead Developer  | Aaron Couch                                                          |
| Lead Designer   | Andy Cochran                                                         |

## Short description
<!-- Required -->

Deploy a public API endpoint to PROD that allows users to see at least one field per grant opportunity listed in grants.gov

## Goals

### Business description & value
<!-- Required -->

The launch of a public API endpoint which provides information about every grant opportunity in grants.gov represents the culmination of multiple internally focused deliverables and serves as the foundation for future development that relies on the API.

By delivering this public endpoint and ensuring it remains available even when the legacy grants.gov site is experiencing planned or unplanned outages, this milestone aims to demonstrate the following value propositions:

- Exposes `beta.grants.gov/api/` as the public API for the project that technical stakeholders can access and where future endpoints and/or features will be released
- Proves the succesful completion of technical milestones that enable faster development on the API without sacrificing code quality or security
- Delivering another public win that both internal and external stakeholders can rally around, which helps build momentum and enthusiam for the project

### User Stories
<!-- Required -->

- As a **{type of user 1}**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}
- As a **{type of user 2}**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}

## Technical description

### Infrastructural Requirements

The infrastructure developed to deploy and host the API should balance:

- Code quality
- Security
- Delivery velocity
- Cost & maintenance

### Developer Experience Requirements

The API should be developed and versioned in a way that balances:

- Discoverability
- Ease of adoption
- Backwards compatibility

### Data Requirements

The way that data is stored and delivered through the API should balance:

- Eventual consistency with legacy Grants.gov
- Improvements to the existing data model
- Ease of managing schema changes

### Definition of done
<!-- Required -->

- [ ] The following infrastructure requirements are satisfied:
  - [ ] The code needed to build and deploy the site is merged to `main`
  - [ ] The site is built and hosted with the tools selected in the [API Planning](https://github.com/HHS/grants-equity/issues/42) and [DB Planning](https://github.com/HHS/grants-equity/issues/48) milestones
  - [ ] All code quality checks set up in the [Developer Tools milestone](https://github.com/HHS/grants-equity/issues/50) are passing
  - [ ] The resources required to deploy and host the API are provisioned programmatically using the [Infrastructure-as-Code milestone](https://github.com/HHS/grants-equity/issues/123) framework
  - [ ] Code changes are deployed using the CI/CD pipeline set up in [the Back-end CI/CD milestone](https://github.com/HHS/grants-equity/issues/57)
- [ ] The following developer experience (DX) requirements are satisfied:
  - [ ] The API is live at `beta.grants.gov/api/`
  - [ ] Developers can learn how to interact with the API by referencing the API documentation
  - [ ] The endpoint path indicates which major version of the API the developer is consuming
  - [ ] Breaking changes are reflected in predictable changes to the endpoint path
  - [ ] The endpoint is available when legacy grants.gov experiences planned or unplanned downtime, maintenance, and upgrades
- [ ] The following data requirements are satisfied:
  - [ ] The endpoint returns all of the grant opportunities that are available on grants.gov
  - [ ] The endpoint returns at least one (1) field per opportunity
  - [ ] Updates to the data in legacy Grants.gov are propagated to the new endpoint within 24 hours

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. Number of unique users accessing API
2. Total number of API calls made
3. Error rate of API calls
4. Uptime of service
5. Deployment/hosting costs

### Destination for live updating metrics
<!-- Required -->

## Planning

### Assumptions & dependencies
<!-- Required -->

*What capabilities / milestones do we expect to be in place at the beginning of work on this milestone?*

- [ ] **[API Planning](https://github.com/HHS/grants-equity/issues/):** Determines the language, framework, and deployment service used to build and host the API.
- [ ] **[DB planning](https://github.com/HHS/grants-equity/issues/):** Determines the DMBS and hosting service used to store and manage the data serviced by the API.
- [ ] **[Developer tools](https://github.com/HHS/grants-equity/issues/):** Establishes a suite of tools used to ensure the quality and security of the API codebase.
- [ ] **[beta.grants.gov domain](https://github.com/HHS/grants-equity/issues/):** Secures access to the `beta.grants.gov` domain from which the API endpoints will be routed. 
- [ ] **[Back-end CI/CD](https://github.com/HHS/grants-equity/issues/):** Sets up a CI/CD pipeline that will be used to test and publish code changes to the API.
- [ ] **[Data architecture](https://github.com/HHS/grants-equity/issues/):** Establishes the updated data model used to support the new GET Opportunities endpoint.
- [ ] **[Test data and schema](https://github.com/HHS/grants-equity/issues/):** Enables both project maintainers and open source contributors to effectively mock the database when developing or testing locally.
- [ ] **[Database (DB) replica](https://github.com/HHS/grants-equity/issues/):** Ensures parity between the set of opportunities returned by the new GET Opportunities endpoint and the legacy system. It also allows users to access the endpoint when there are outages on the legacy system.
- [ ] **[Feature flag framework](https://github.com/HHS/grants-equity/issues/):** Enables us to deploy new features or changes without immediately exposing them to the public. 
- [ ] **[API documentation](https://github.com/HHS/grants-equity/issues/):** Establishes a location and strategy for publishing information about the GET Opportunities endpoint (and future API endpoints) that users can reference when learning how to interact with the API.
- [ ] **[API Versioning](https://github.com/HHS/grants-equity/issues/68):** Establishes a protocol for publishing breaking and non-breaking changes to the API.
- [ ] **[API Security Planning](https://github.com/HHS/grants-equity/issues/):** Sets up minimum security standards to protect the API endpoint, such as API keys, rate limits, and security incident response protocols.

*Are there any notable capabilities / milestones do NOT we expect to be in place at the beginning of work on this milestone?*

- [ ] **Performance Testing Framework:** While performance should be an important consideration during the development of this initial API endpoint. 
- [ ] **AuthN/AuthZ:** While the implementation of rate limiting or other API security measures may require some basic authentication, the full AuthN/AuthZ framework will be developed in a later milestone.

### Open questions
<!-- Optional -->

- [x] None

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. **User Interface:** Because this milestone is focused on the API endpoint, it will not include delivering a user interface for non-technical users to access a list of opportunities. That work will be incorporated in the Search UI milestone instead.

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

*If so, when will English-language content be locked? Then when will translation be started and completed?*

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

1. **API:** This milestone is the official release of the `beta.grants.gov/api`
2. **Replica Database:** A replica of relevant tables from the legacy database, which also contains the new `beta.grants.gov` data model
3. **ETL Pipeline:** An ETL pipeline that both replicates data from legacy grants.gov and then transforms that data into the new `beta.grants.gov` data model

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

1. **API + Static Site:** 
2. **API + Wiki Platform:**

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

1. **Opportunity Field(s):** This milestone will expose 

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

1. **Legacy DB Access:**
2. **Replica Database Access:**
3. **API:** 

*If so, how are we addressing these risks?*

1. **ATO:**
2. **API Security Planning:**
