# GET Opportunities Endpoint

| Field              | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Document status    | Completed                                                       |
| Deliverable ticket | [Issue 70](https://github.com/HHS/simpler-grants-gov/issues/70) |
| Roadmap dashboard  | [Product roadmap](https://github.com/orgs/HHS/projects/12)      |
| Product owner      | Lucas Brown                                                     |
| Document owner     | Billy Daly                                                      |
| Lead developer     | Aaron Couch                                                     |
| Lead designer      | Andy Cochran                                                    |

## Short description

<!-- Required -->

- **What:** Deploy a public API endpoint to PROD iteratively that allows users to see at least one field per grant opportunity listed in grants.gov.
- **Why:** Build iteratively, validate connection to the database, and set the groundwork to continue to enhance the API.
- **Who:** This release of the API will be mainly focused on delivering for the API consumer.

## Goals

### Business description & value

<!-- Required -->

The launch of a public API endpoint which provides information about every grant opportunity in grants.gov represents the culmination of multiple internally focused deliverables and serves as the foundation for future development that relies on the API.

By delivering this public endpoint and ensuring it remains available even when the legacy grants.gov site is experiencing planned or unplanned outages, this 30k effort aims to demonstrate the following value propositions:

- Select a URL for the API
- Expose the chosen URL name as the public API for the project that technical stakeholders can access and where future endpoints and/or features will be released
- Proves the successful completion of technical deliverables that enable faster development on the API without sacrificing code quality or security
- Delivering another public win that both internal and external stakeholders can rally around, which helps build momentum and enthusiam for the project

### User Stories

<!-- Required -->

- As an **HHS staff member**, I want:
  - the API to adopt the proper security practices, so that we have a strategy for preventing and responding to security vulnerabilities before the API is launched
  - published data about opportunities to be consistent between legacy grants.gov and `simpler.grants.gov`, so that users won't be confused by discrepancies between these sources
- As a **consumer of the API**, I want:
  - clear documentation and a user guide for the API, so that I don't have to rely on reading the source code to learn how to interact with and consume from it
  - changes made to a given endpoint to be backward-compatible, so that I can start building against this API without worrying about breaking changes
  - a clear and relatively intuitive data model to represent the opportunities in the API, so that the data returned by the endpoints match my expectations and are easy to work with
  - reliable uptime for the API, so that I don't have to worry about interruptions in API service breaking any systems that I try to integrate with it
- As a **project maintainer**, I want:
  - most of the critical development infrastructure to be in place when we officially launch the API, so that we can deploy bug fixes or new features quickly once the API is live
  - to be alerted when the API is down, so that I can troubleshoot the issue with minimal downtime or interruption in service
  - to automatically collect data on API usage and service availability, so that I can better understand usage patterns and identify opportunities to improve the API performance and reliability
  - the API code to be designed to minimize repetitive configuration for the data model, so that updates to the definition of a field in the API does need to be manually changed in the core data classes, API documentation, DB migration scripts etc.
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
- Clear and intuitive data model
- Minimal repetitive configuration for data model

### Data Requirements

The way that data is stored and delivered through the API should balance:

- Eventual consistency with legacy Grants.gov
- Improvements to the existing data model
- Ease of managing schema changes

### Definition of done

<!-- Required -->

- [ ] The following infrastructure requirements are satisfied:
  - [ ] The code needed to build and deploy the site is merged to `main`
  - [ ] The site is built and hosted with the tools selected in the [API Planning](https://github.com/HHS/simpler-grants-gov/issues/42) and [DB Planning](https://github.com/HHS/simpler-grants-gov/issues/48) deliverables
  - [ ] All code quality checks set up in the [Developer Tools deliverable](https://github.com/HHS/simpler-grants-gov/issues/50) are passing
  - [ ] The resources required to deploy and host the API are provisioned programmatically using the [Infrastructure-as-Code deliverable](https://github.com/HHS/simpler-grants-gov/issues/123) framework
  - [ ] Code changes are deployed using the CI/CD pipeline set up in [the Back-end CI/CD deliverable](https://github.com/HHS/simpler-grants-gov/issues/57)
  - [ ] DB migrations are automatically configured through scripts that enable upgrading/downgrading database quickly and easily (e.g., by using Alembic https://github.com/sqlalchemy/alembic)
  - [ ] The API has been load tested using the framework established in the [Peformance Testing Framework deliverable](https://github.com/HHS/simpler-grants-gov/issues/69) to ensure that it remains performant under heavy user traffic
  - [ ] Logging/monitoring is configured, and it both records the metrics defined below and alerts the development team when the API is down or other key monitoring thresholds are met (e.g. frequency of 4xx requests, response times, etc.) per the [API Logging & Monitoring deliverable](https://github.com/HHS/simpler-grants-gov/issues/370)
  - [ ] An incident response protocol is in place and the on-call team have followed that protocol in at least one training or simulation per the [Incident Response deliverable](https://github.com/HHS/simpler-grants-gov/issues/373)
  - [ ] The chosen API URL sub-domain has been secured for future deployment of the API and we've contacted the teams working on the existing service (if any) that is currently accessed through this sub-domain
- [ ] The following developer experience (DX) requirements are satisfied:
  - [ ] The API is live at the chosen URL
  - [ ] Developers can learn how to interact with the API by referencing the API documentation
  - [ ] The endpoint path indicates which major version of the API the developer is consuming
  - [ ] Breaking changes to the API follow a predictable protocol that is documented within the [API Versioning deliverable](https://github.com/HHS/simpler-grants-gov/issues/68)
  - [ ] The endpoint is available when legacy grants.gov experiences planned or unplanned downtime, maintenance, and upgrades
  - [ ] Test data is scripted to provide consistent and reliable test fixtures for integration tests and local development per the [Test Data and Schema deliverable](https://github.com/HHS/simpler-grants-gov/issues/)
  - [ ] All developers (including open source contributors) are able to spin up either database replica or test fixture data so that they can conduct local development.
  - [ ] Feature flag framework is implemented so that functionality can be deployed to PROD without being turned on per the [Feature flag framework deliverable](https://github.com/HHS/simpler-grants-gov/issues/)
- [ ] The following data requirements are satisfied:
  - [ ] The endpoint returns all of the grant opportunities that are available on grants.gov
  - [ ] The endpoint returns at least one (1) field per opportunity
  - [ ] Updates to the data in legacy Grants.gov are propagated to the new endpoint within 1 hour

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

Page on the public wiki that is updated at the end of each sprint. **Note:** This will likely change once we deliver [the Public Measurement Dashboard deliverable](https://github.com/HHS/simpler-grants-gov/issues/65)

## Planning

### Assumptions & dependencies

<!-- Required -->

_What capabilities / deliverables do we expect to be in place by the completion of work on this deliverable?_

- [ ] **[API Planning](https://github.com/HHS/simpler-grants-gov/issues/):** Determines the language, framework, and deployment service used to build and host the API.
- [ ] **[DB planning](https://github.com/HHS/simpler-grants-gov/issues/):** Determines the DMBS and hosting service used to store and manage the data serviced by the API.
- [ ] **[Developer tools](https://github.com/HHS/simpler-grants-gov/issues/):** Establishes a suite of tools used to ensure the quality and security of the API codebase.
- [ ] **[simpler.grants.gov domain](https://github.com/HHS/simpler-grants-gov/issues/):** Secures access to the `simpler.grants.gov` domain from which the API endpoints will be routed.
- [ ] **[Back-end CI/CD](https://github.com/HHS/simpler-grants-gov/issues/):** Sets up a CI/CD pipeline that will be used to test and publish code changes to the API.
- [ ] **[Data architecture](https://github.com/HHS/simpler-grants-gov/issues/):** Establishes the updated data model used to support the new GET Opportunities endpoint.
- [ ] **[Test data and schema](https://github.com/HHS/simpler-grants-gov/issues/):** Enables both project maintainers and open source contributors to effectively mock the database when developing or testing locally.
- [ ] **[Database (DB) replica](https://github.com/HHS/simpler-grants-gov/issues/):** Ensures parity between the set of opportunities returned by the new GET Opportunities endpoint and the legacy system. It also allows users to access the endpoint when there are outages on the legacy system.
- [ ] **[Feature flag framework](https://github.com/HHS/simpler-grants-gov/issues/):** Enables us to deploy new features or changes without immediately exposing them to the public.
- [ ] **[API documentation](https://github.com/HHS/simpler-grants-gov/issues/):** Establishes a location and strategy for publishing information about the GET Opportunities endpoint (and future API endpoints) that users can reference when learning how to interact with the API.
- [ ] **[API Versioning](https://github.com/HHS/simpler-grants-gov/issues/68):** Establishes a protocol for publishing breaking and non-breaking changes to the API.
- [ ] **[API Security Planning](https://github.com/HHS/simpler-grants-gov/issues/):** Sets up minimum security standards to protect the API endpoint, such as API keys, rate limits, and security incident response protocols.
- [ ] **[API Logging & Monitoring](https://github.com/HHS/simpler-grants-gov/issues/370):** Sets up logging for the API service and automatic alerts when there is an interruption in service
- [ ] **[Incident Response](https://github.com/HHS/simpler-grants-gov/issues/373):** Documents and trains staff on the incident response plan.
- [ ] **[Performance Testing Framework](https://github.com/HHS/simpler-grants-gov/issues/69):** Configures a framework for conducting performance and load testing of the API.

_Are there any notable capabilities / deliverables do NOT we expect to be in place by the completion of work on this deliverable?_

- [ ] **AuthN/AuthZ:** While the implementation of rate limiting or other API security measures may require some basic authentication, the full AuthN/AuthZ framework will be developed in a later deliverable.

### Open questions

<!-- Optional -->

- [x] None

### Not doing

<!-- Optional -->

The following work will _not_ be completed as part of this deliverable:

1. **User Interface:** Because this deliverable is focused on the API endpoint, it will not include delivering a user interface for non-technical users to access a list of opportunities. That work will be incorporated in the Search UI deliverable instead.
2. **Translating API Docs:** Translation of key documents will be covered in an upcoming deliverable.

## Integrations

### Translations

<!-- Required -->

_Does this deliverable involve delivering any content that needs translation?_

Yes, portions of the API user guide and docs will need to be translated.

_If so, when will English-language content be locked? Then when will translation be started and completed?_

Timeline and strategy for translation is still TBD.

### Services going into PROD for the first time

<!-- Required -->

_This can include services going into PROD behind a feature flag that is not turned on._

1. **API:** This deliverable is the official release of the `simpler.grants.gov/api`
2. **Replica Database:** A replica of relevant tables from the legacy database
3. **Updated Data Model:** An updated data model that will provide the data for the GET Opportunities endpoint
4. **ETL Pipeline:** An ETL pipeline that both replicates data from legacy grants.gov and then transforms that data into the new `simpler.grants.gov` data model

### Services being integrated in PROD for the first time

<!-- Required -->

_Are there multiple services that are being connected for the first time in PROD?_

1. **API + Static Site or Wiki:** We will need to host the API docs and user guide on either the wiki platform or the static site.

### Data being shared publicly for the first time

<!-- Required -->

_Are there any fields being shared publicly that have never been shared in PROD before?_

1. **Opportunity Field(s):** This deliverable will expose at least one field from the opportunity resource in production.

### Security considerations

<!-- Required -->

_Does this deliverable expose any new attack vectors or expand the attack surface of the product?_

1. **Legacy DB Access:** Because this deliverable requires replicating data from the legacy database, it exposes a new potential attack vector to that database.
2. **Replica Database Access:** This deliverable expands the attack surface of the application by introducing the replica database as another data store that needs to be secured against unauthorized access.
3. **API:** This deliverable deliverable also expands the attack surface of the application by launching the API, which needs to be secured against Denial of Service (DoS) attackes.

_If so, how are we addressing these risks?_

1. **Security Approval:** Before the official launch of the API to the public, we will be reviewing our infrastructure and code security practices with the HHS team to ensure that they adhere to HHS standards.
2. **Developer Tools:** As part of the Developer Tools deliverable, the team is setting up a series of tools that will enforce certain code quality standards and security checks. These include things like secrets management, code linting, dependency monitoring, etc.
3. **API Security Planning:** As part of the API Security Planning deliverable, we will specifically be identifying and evaluating strategies to mitigate security risks for the API, such as the use of API tokens and/or rate limiting API requests.
