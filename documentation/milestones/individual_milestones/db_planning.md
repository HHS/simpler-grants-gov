# DB Planning

| Field           | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Document Status | Completed                                                    |
| Epic Link       | [Issue 48](https://github.com/HHS/grants-equity/issues/48)   |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12) |
| Product Owner   | Lucas Brown                                                  |
| Document Owner  | Gina Carson                                                  |
| Lead Developer  | Aaron Couch                                                  |
| Lead Designer   | Andy Cochran                                                 |


## Short description
<!-- Required -->

Formalize a series of architectural decisions about how data is stored, including the type of database we will use and the platform we'll use host it.

## Goals

### Business description & value
<!-- Required -->

This milestone is critical because it serves as the initial planning for the simpler.grants.gov database and ultimately future grants.gov database, and has large downstream impact for the APIs and development related to Grants.gov.

### User Stories
<!-- Required -->

- As an **HHS Staff Member**, I want:
  - to store data using well-established tools and platforms, so that it will be easier to hire future HHS staff and contractors who are familiar with the technology stack
  - the deployment services we select to be FedRAMP compliant and covered under our existing ATO (where possible), so that we minimize the amount of time we need to spend seeking approval for new technology
  - to balance direct operating and hosting costs with staff resources required to maintain these tools, so that we are making intentional investments that minimize maintenance overhead without exceeding our budget
- As a **project maintainer**, I want to:
  - evaluate and select the appropriate database type, database management system, and database hosting service so that I have a plan prior to initiating the replication of the Grants.gov database.
  - select tools that satisfy both the current and future needs of the project, so that we can minimize the number of languages and frameworks we support (where possible) and don't need to reimplement existing features at a later point in the time
  - leverage hosting services that are relatively easy to maintain and scale, so that we can prioritize developing important product features over managing basic infrastructure
- As an **open source contributor**, I want:
  - the API to be built using tools that are popular with a robust open source community, so that I have a lot of resources to reference and learn from if I want to contribute to the project
  - the API to use services that can be hosted or at least mocked locally, so that I can test all of the required parts of the application on my own machine without signing up for a new platform

## Technical description

### Type of Database

Evaluate and select the database paradigm we will use to store data.

Some potential options include:

- Relational
- Document
- Wide-column
- Key-value
- Others recommended by dev team

Some factors to consider are:

- What is the nature of the NOFO and grant data that we're storing? Do certain types of databases this type of data better than others?
- What are our expected access patterns for this data (i.e. will it be read-heavy or write-heavy, will there be lots of complex joins, will there be lots of grouping or aggregation)? Which type of database best suits these access patterns?
- What is the volume of data we expect to work with? Do certain types of databases offer performance optimizations tailored to this volume and type of data (e.g. sharding, indexing, micropartitioning)?
- Will we need multiple database types for different parts of our data or application?

### Database Management System

Evaluate and select a DBMS for the type of database we've chosen.

Some potential options include: (note some of these DBMS blend multiple paradigms)

- PostgreSQL or MySQL for relational
- MongoDB or DynamoDB for document-oriented
- Appache Cassandra or HBase for wide-column
- Redis or BerkleyDB for key-value
- Others recommended by dev team

Some factors to consider are:

- What hosting options are available for this DBMS?
- Can we easily mock or run this DBMS for local development and testing?
- Are there trusted libraries that support interfacing with this database in the language we've chosen for our API?

### Database Hosting Service

Evaluate and select a service to host and manage our database.

Some potential options include:

- Self hosted on an EC2 instance
- Managed service from cloud provider (e.g. Amazon RDS)
- Separate Database as a Service (e.g. Supabase)

Some factors to consider are:

- Is this deployment option FedRAMP compliant?
- How commonly used is this deployment option? Is it easy for new developers to learn?
- How expensive is it to host a database with this option, both in terms of direct operating costs and in terms of team resources?
- Does the service offer features like automatic backups or read replicas?

### Definition of done
<!-- Required -->

- [ ] The tools and services chosen have been authorized under the Grants.gov ATO (Authority to Operate) and/or are FedRAMP approved
- [ ] An ADR has been recorded and published to `main` for the following choices:
  - [ ] Database Type
  - [ ] Database Management System (DBMS)
  - [ ] Database Hosting Service

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

N/A for planning milestone

### Destination for live updating metrics
<!-- Required -->

N/A for planning milestone

## Planning

### Assumptions & dependencies
<!-- Optional -->

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [x] **Onboard dev team:** The dev team will be evaluating and making many of these key architectural decisions

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- [x] None

### Open questions
<!-- Optional -->

- [ ] Will this database serve as an OLTP system, OLAP system, or both? Will this database be used for analytics, and is there a need for a second database to be created with data pipelines?
- [ ] What are the current datastores that support the legacy Grants.gov system?
      - Oracle on RDS (used for opportunity data, etc)
      - MongoDB (I'm not sure exactly what data is in the document store)
      - Flat file storage with application data
- [ ] Is the existing Grants.gov database heavy on read or write transactions?
- [ ] How many external sources does the existing database have?

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. **Deploying services:** This milestone involves evaluating and selecting the tools that constitute the API technology stack, but does not involve actively setting up the code base to implement or deploying any services

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

*If so, when will English-language content be locked? Then when will translation be started and completed?*

- No

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

1. No

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

1. No

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

1. No

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

*If so, how are we addressing these risks?*

1. No
