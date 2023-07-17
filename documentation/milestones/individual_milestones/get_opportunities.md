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

- Exposes `beta.grants.gov/api/` as the public API for the project that technical stakeholders can access and where future endpoints will be released
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
