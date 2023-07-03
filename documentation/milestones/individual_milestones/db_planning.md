# DB & API Planning

| Field           | Value          |
| --------------- | -------------- |
| Document Status | Draft          |
| Epic Link       | TODO: Add Link |
| Epic Dashboard  | TODO: Add Link |
| Target Release  | TODO: Add Date |
| Product Owner   | Lucas Brown    |
| Document Owner  | Gina Carson    |
| Lead Developer  | Aaron Couch    |
| Lead Designer   | Andy Cochran   |


## Short description
<!-- Required -->

Formalize a series of architectural decisions about how data is stored, including the type of database we will use and the platform we'll use host it.

## Goals

### Business description & value
<!-- Required -->

{3-4 sentences that describe why this milestone is critical to the project}

### User Stories
<!-- Required -->

- As an **HHS Staff Member**, I want:
  - TODO
- As a **project maintainer**, I want to:
  - TODO
- As an **open source contributor**, I want:
  - TODO

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

- [ ] The tools and services chosen have been authorized under the Grants.gov ATO (Authority to Operate)
- [ ] An ADR has been recorded and published to `main` for each of the following choices:
  - [ ] Database Type
  - [ ] Database Management System (DBMS)
  - [ ] Database Hosting Service

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. {Metric 1}

### Destination for live updating metrics
<!-- Required -->

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

- [x] None

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
