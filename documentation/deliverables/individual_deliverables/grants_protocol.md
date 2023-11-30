# Grants protocol specification

| Field              | Value                                                      |
| ------------------ |------------------------------------------------------------|
| Document status    | Draft                                                      |
| Deliverable ticket | TODO: Add link                                             |
| Roadmap dashboard  | [Product Roadmap](https://github.com/orgs/HHS/projects/12) |
| Product owner      | Lucas Brown                                                |
| Document owner     | Billy Daly                                                 |
| Lead developer     | Aaron Couch                                                |
| Lead designer      | Andy Cochran                                               |


## Short description
<!-- Required -->

Deliver the initial specification of a data protocol for financial opportunities. This will include defining the schema and fields used for opportunity listings, as well as making a plan for adding future resources that are relevant to Grants.gov.



## Goals

### Business description & value
<!-- Required -->

{3-4 sentences that describe why this deliverable is critical to the project}

See also information in [GitBook](https://app.gitbook.com/o/cFcvhi6d0nlLyH2VzVgn/s/v1V0jIH7mb7Yb3jlNrgk/planning/grants-as-a-platform/grants-protocol-strategy).

### User stories
<!-- Required -->

- As a **{type of user 1}**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}
- As a **{type of user 2}**, I want to:
  - {perform action 1}, so that {goal or motivation for action}
  - {perform action 2}, so that {goal or motivation for action}

## Technical description

### Name

We will brainstorm and work with Emily on choosing a name for the protocol. The name should connote several things: the basic meaning of what the protocol is used for, that the protocol is easy to understand and use, and that it's used as a protocol for financial opportunities not just limited to Grants.gov.

Some early candidates for names include "Open Finance Protocol" (unfortunately, this is already used by a crypto project) or "Common Finance."

### {Optional sub-deliverable}
<!-- Optional -->

{List requirements specific to this sub-deliverable, options to consider, etc.}

### Definition of done
<!-- Required -->

*User experience:*
- [ ] The protocol has a name that is approved by Emily Ianacone in her role as UX lead for Grants.gov.
- [ ] Documentation is published that explains the protocol in an intuitive, accessible manner.

*Financial opportunities specification:*
- [ ] A complete draft specification is available that can be used to represent opportunity listings from Grants.gov, to be returned over the new Simpler Grants.gov APIs.

*Generic specification:*
- [ ] **Required fields:** One or more minimum necessary fields for any financial opportunity are included in the spec as required fields. An example field is the due date of applications for the financial opportunity.
- [ ] **Optional fields:** One or more fields that are either necessary for Grants.gov specifically, or are often used for financial opportunities in general but are not required, are implemented. These will be fields that have well-designed implementations that any implementer of the protocol can optionally implement (by choosing them from a catalog of schemas). An example field is the federal opportunity number.
- [ ] **Types:** For all these fields, well-designed field types exist and are joined one-to-many on these fields. (This means that every `type` can be used by one or more `field`s.) For instance, there could be a type for DateTime, a type for Geospatial, etc. Types can also include other types: such as an object with `type:Application` might include a field that has a `type:Timestamp`. Every `field` that is implemented has one and only one `type`.
- [ ] **Extensions:** There exists an easy method for any implementer of the protocol to extend the protocol to custom fields and types. These custom fields and types are not necessarily reflected in the shared protocol specification, and can be implemented "locally." Custom extensions are easy to share and reuse with other projects.
- [ ] **Proposals:** There are clear plans for putting processes and tools in place so that anyone can propose that their "local" extensions should become optional or required parts of the common spec.
- [ ] **Decisionmaking:** There are clear plans for putting processes and tools in place that support community decisionmaking to accept or reject proposals for modifications to the spec.

*Generic specification:*
- [ ] **Translation:** There are clear plans for putting tools and processes in place that translate the protocol's meaning and documentation into multiple languages. For instance, this could include building a data dictionary that defines the `fields` and `types` in multiple languages.

*Integration:*
- [ ] A decision has been made on where the code for the protocol will live -- either as part of `simpler-grants-gov` repo or a new open source repo -- and the code is hosted there publicly.
- [ ] Code is deployed to `main` & PROD
- [ ] Services are live in PROD (may be behind feature flag)
- [ ] Metrics are published in PROD.
- [ ] Translations are live in PROD (if necessary)

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. {Metric 1}

### Destination for live updating metrics
<!-- Required -->

[to be added]

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- [to be added]

What functionality do we expect to be in place by ***the end*** of work on this deliverable?

- `API Launch: GET Opportunities`

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- `API Launch: GET Opportunities` does not need to be complete before we begin work on the specification, but does need to be complete before we finish this deliverable.

### Open questions
<!-- Optional -->

- [to be added]

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this deliverable:

- [to be added]

## Integrations

### Translations
<!-- Required -->

Does this deliverable involve delivering any content that needs translation?

1. Documentation of protocol needs translation.

If so, when will English-language content be locked? Then when will translation be started and completed?

1. [to be added]

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

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

1. [to be added]

If so, how are we addressing these risks?

1. [to be added]
