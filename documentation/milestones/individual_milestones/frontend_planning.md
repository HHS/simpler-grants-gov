# Front-end Planning

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Document Status | Completed                                                            |
| Epic Link       | [Issue 49](https://github.com/HHS/grants-equity/issues/49)              |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-07-19                                                           |
| Product Owner   | Lucas Brown                                                          |
| Document Owner  | Billy Daly                                                           |
| Lead Developer  | Aaron Couch                                                          |
| Lead Designer   | Andy Cochran                                                         |


## Short description
<!-- Required -->

Formalize a series of architectural decisions about the front-end, including the technology stack we will use and the services we'll leverage to deploy and host it.

## Goals

### Business description & value
<!-- Required -->

We want to select a technology stack that will maximize the long-term maintainability and performance of the front-end application that we build.

The prime motivation for the decisions outlined below is to select tools that have a proven track record for front-end development, are relatively accessible to both internal and external stakeholders, and can support the future needs of the project both in terms of scale and complexity.


### User Stories
<!-- Required -->

- As an **HHS Staff Member**, I want:
  - the front-end application to be built using well-established tools and frameworks, so that it will be easier to hire future HHS staff and contractors who are familiar with the technology stack
  - the deployment services we select to be FedRAMP compliant and covered under our existing ATO (where possible), so that we minimize the amount of time we need to spend seeking approval for new technology
  - to balance direct operating and hosting costs with staff resources required to maintain these tools, so that we are making intentional investments that minimize maintenance overhead without exceeding our budget
- As a **project maintainer**, I want to:
  - select tools that satisfy both the current and future needs of the project, so that we can minimize the number of languages and frameworks we support (where possible) and don't need to reimplement existing features at a later point in the time
  - leverage hosting services that are relatively easy to maintain and scale, so that we can prioritize developing important product features over managing basic infrastructure
- As an **open source contributor**, I want:
  - the front-end to be built using tools that are popular with a robust open source community, so that I have a lot of resources to reference and learn from if I want to contribute to the project
- As an **applicant**, I want:
  - the Grants.gov website to load quickly, so that I move between pages quickly and without much friction

## Technical description

### Front-end Language

Evaluate and select the programming language we'll use to build the front-end application.

Some potential options include:

- JavaScript
- TypeScript
- Golang
- Others recommended by the dev team

Some factors to consider are:

- Is this language well established with a broad community of users?
- How difficult is it for developers to learn the language if they haven't used it before?
- How often is this language used for front-end development?
- Does the selection of this language make it easier to support other parts of the project (e.g. back-end development of the API or ETL )?
- How well does this language support important features like concurrency, type safety, and immutability?

### Front-end Framework

Evaluate and select the web framework or library we'll use to implement the front-end application in the chosen language.

Some potential options include:

- Next.js, Vue.js, or Svelte for JavaScript/TypeScript
- Hugo or Martini for Go
- Others recommended by the dev team

Some factors to consider are:

- Is this framework popular with a broad community of users?
- Is this framework actively maintained, with a strong governance structure?
- How easy 
- Does this framework support both Static Site Generation (SSG) and Server-side Rendering (SSR)?
- Is there an established set of plugins or libraries that extend the framework's key features? (e.g. AuthN/AuthZ, component library, etc.)

### Front-end Deployment Service

Evaluate and select an option used to deploy and host the Front-end.

Some potential options include:

- S3 buckets (for static content) and AWS Lambda (serverless functions)
- Dedicated EC2 instance or ECS cluster
- Vercel
- Netlify
- Others recommended by dev team

Some factors to consider are:

- Is this deployment option FedRAMP compliant?
- How commonly used is this deployment option? Is it easy for new developers to learn?
- How expensive is it to deploy a front-end application with this option, both in terms of direct operating costs and in terms of team resources?
- How easily does this option scale?


### Definition of done
<!-- Required -->

- [ ] The tools and services chosen have been authorized under the Grants.gov ATO (Authority to Operate)
- [ ] An ADR has been recorded and published to `main` for each of the following choices:
  - [ ] Front-end Language
  - [ ] Front-end framework
  - [ ] Front-end deployment service

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

#### One-time metrics

We recommend calculating the following metrics at least once to inform the selection of tools for this milestone:

1. Front-end language metrics
   1. Days since last patch or minor release
   2. Number of GitHub stars on main repository
   3. TIOBE index ranking
2. Front-end framework metrics
   1. Days since last patch or minor release
   2. Number of GitHub stars on main repository
   3. Number of downloads from primary package manager

#### Ongoing metrics

The following metrics should be tracked about the tools selected within this metric: 

1. Front-end framework metrics
   1. Days since last patch or minor release
   2. Number of GitHub stars on main repository

### Destination for live updating metrics
<!-- Required -->

Page on the public wiki. **Note:** This will likely change once we deliver [the Public Measurement Dashboard milestone](../milestone_short_descriptions.md#public-measurement-dashboards)

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

1. **Deploying services:** This milestone involves evaluating and selecting the tools that constitute the front-end technology stack, but does not involve actively setting up the code base to implement or deploying any services

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

*If so, when will English-language content be locked? Then when will translation be started and completed?*

- No

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

1. No, this is just a planning milestone

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

1. No, this is just a planning milestone

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

1. No, this is just a planning milestone

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

*If so, how are we addressing these risks?*

1. No, this is just a planning milestone
