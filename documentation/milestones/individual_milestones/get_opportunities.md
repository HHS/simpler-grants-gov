# GET Opportunities Endpoint

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Document Status | Accepted                                                             |
| Epic Link       | [Issue 70](https://github.com/HHS/grants-equity/issues/70)           |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-10-11                                                           |
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
- Proves the successful completion of technical milestones that enable faster development on the API without sacrificing code quality or security
- Delivering another public win that both internal and external stakeholders can rally around, which helps build momentum and enthusiam for the project

### User Stories
<!-- Required -->

- As an **HHS staff member**, I want:
  - the API to adopt the proper security practices, so that we have a strategy for preventing and responding to security vulnerabilities before the API is launched
  - published data about opportunities to be consistent between legacy grants.gov and `beta.grants.gov`, so that users won't be confused by discrepancies between these sources
- As a **consumer of the API**, I want:
  - clear documentation and a user guide for the API, so that I don't have to rely on reading the source code to learn how to interact with and consume from it
  - changes made to a given endpoint to be backward-compatible, so that I can start building against this API without worrying about breaking changes
- As a **project maintainer**, I want:
  - most of the critical development infrastructure to be in place when we officially launch the API, so that we can deploy bug fixes or new features quickly once the site is live
- As an **open source contributor**, I want:
  - to be able run the code for the API locally, so that I can test my contributions to the codebase

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
  - [ ] Logging/monitoring is configured, and it both records the metrics defined below and alerts the development team when the API is down
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
6. Average response time

### Destination for live updating metrics
<!-- Required -->

Page on the public wiki that is updated at the end of each sprint. **Note:** This will likely change once we deliver [the Public Measurement Dashboard milestone](../milestone_short_descriptions.md#public-measurement-dashboards)

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

- [ ] **Performance Testing Framework:** While performance should be an important consideration during the development of this initial API endpoint, a fully implemented performance and load testing framework is scoped for a later milestone.
- [ ] **AuthN/AuthZ:** While the implementation of rate limiting or other API security measures may require some basic authentication, the full AuthN/AuthZ framework will be developed in a later milestone.

### Open questions
<!-- Optional -->

- [x] None

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. **User Interface:** Because this milestone is focused on the API endpoint, it will not include delivering a user interface for non-technical users to access a list of opportunities. That work will be incorporated in the Search UI milestone instead.
2. **Translating API Docs:** Translation of key documents will be covered in an upcoming milestone.

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

Yes, portions of the API user guide and docs will need to be translated.

*If so, when will English-language content be locked? Then when will translation be started and completed?*

Timeline and strategy for translation is still TBD.

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

1. **API:** This milestone is the official release of the `beta.grants.gov/api`
2. **Replica Database:** A replica of relevant tables from the legacy database, which also contains the new `beta.grants.gov` data model
3. **ETL Pipeline:** An ETL pipeline that both replicates data from legacy grants.gov and then transforms that data into the new `beta.grants.gov` data model

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

1. **API + Static Site or Wiki:** We will need to host the API docs and user guide on either the wiki platform or the static site.

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

1. **Opportunity Field(s):** This milestone will expose at least one field from the opportunity resource in production.

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

1. **Legacy DB Access:** Because this milestone requires replicating data from the legacy database, it exposes a new potential attack vector to that database.
2. **Replica Database Access:** This milestone expands the attack surface of the application by introducing the replica database as another data store that needs to be secured against unauthorized access.
3. **API:** This milestone milestone also expands the attack surface of the application by launching the API, which needs to be secured against Denial of Service (DoS) attackes.

*If so, how are we addressing these risks?*

1. **Authority to Operate (ATO):** Before the official launch of the API to the public, we will be reviewing our infrastructure and code security practices with the HHS team to ensure that they adhere to the Software Security Plan (SSP) for legacy grants.gov and are covered by the existing ATO.
2. **Developer Tools:** As part of the Developer Tools milestone, the team is setting up a series of tools that will enforce certain code quality standards and security checks. These include things like secrets management, code linting, dependency monitoring, etc.
3. **API Security Planning:** As part of the API Security Planning milestone, we will specifically be identifying and evaluating strategies to mitigate security risks for the API, such as the use of API tokens and/or rate limiting API requests.
