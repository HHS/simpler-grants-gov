# DB & API Planning

| Field           | Value          |
| --------------- | -------------- |
| Document Status | Draft          |
| Epic Link       | TODO: Add Link |
| Epic Dashboard  | TODO: Add Link |
| Target Release  | TODO: Add Date |
| Product Owner   | Lucas Brown    |
| Document Owner  | Billy Daly     |
| Lead Developer  | Aaron Couch    |
| Lead Designer   | TODO: Add Name |


## Short description
<!-- Required -->

Formalize a series of architectural decisions about the API, including the technology stack we will use, the type of API we will build, and the services we'll leverage to deploy and host it.

## Goals

### Business description & value
<!-- Required -->

{3-4 sentences that describe why this milestone is critical to the project}

### User Stories
<!-- Required -->

- As a **HHS Staff Member**, I want:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}
- As a **project maintainer**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}
- As an **open source contributor**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}

## Technical description

### API Language

Evaluate and select the programming language we'll use to build the API.

Some potential options include:

- Node.js
- Python
- Go
- Others recommended by the dev team

Some factors to consider are:

- Is this language well established with a broad community of users?
- How difficult is it for developers to learn the language if they haven't used it before?
- How often is this language used for API development?
- Does the selection of this language make it easier to support other parts of the project (e.g. ETL and data analysis for the analytics endpoints, or frontend development for the static site)?

### API Framework

Evaluate and select the web framework or library we'll use to implement the API in the chosen language.

Some potential options include:

- Flask or FastAPI for Python
- Express.js or Fastify for Node.js
- Gin or Fiber for Go
- Others recommended by the dev team

Some factors to consider are:

- Is this framework popular with a broad community of users?
- Is this framework actively maintained, with a strong governance structure?
- How does this framework support important features like concurrency, serialization, middleware?
- Is there an established set of plugins or libraries that extend the framework's key features? (e.g. AuthN/AuthZ, API documentation, etc.)

### Type of API

Evaluate and select the API paradigm our endpoints will adhere to.

Some potential options include:

- REST
- SOAP
- GraphQL
- RPC
- Others recommended by the dev team

Some factors to consider are:

- What functionality does our API need to support (e.g. recurring and predictable data requests, highly variable data queries, execution of internal functions, etc.)? Are certain API types better at supporting this functionality than others?
- Which API paradigms are most common? Are certain types of APIs easier for developers to learn and interact with than others?
- How often do we expect either the implementation or the interface of a given endpoint to change? Is it easier to make these changes with certain types of APIs than others?
- What are our needs around API performance? Do certain types of APIs handle performance optimization better than others?

### API Deployment Service

Evaluate and select an option used to deploy and host the API.

Some potential options include:

- Dedicated EC2 instance or ECS cluster
- AWS Fargate
- AWS Lambda + API Gateway
- Others recommended by dev team

Some factors to consider are:

- Is this deployment option FedRAMP compliant?
- How commonly used is this deployment option? Is it easy for new developers to learn?
- How expensive is it to deploy an API with this option, both in terms of direct operating costs and in terms of team resources?
- How easily does this option scale?

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
<!-- Optional -->

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [ ] [to be added]

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- [ ] [to be added]

### Open questions
<!-- Optional -->

- [ ] [to be added]

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. [to be added]

## Integrations

### Translations
<!-- Required -->

Does this milestone involve delivering any content that needs translation?

If so, when will English-language content be locked? Then when will translation be
started and completed?

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. [to be added]

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. [to be added]

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. [to be added]

### Security considerations
<!-- Required -->

Does this milestone expose any new attack vectors or expand the attack surface of the product? 

If so, how are we addressing these risks?

1. [to be added]
