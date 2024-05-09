---
description: Template page for deliverable specifications.
---

# Grants protocol

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>DRAFT</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td>[Issue number]</td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="deliverable-spec-template.md#overview">Overview</a></p><ul><li><a href="deliverable-spec-template.md#business-value">Business value</a></li><li><a href="deliverable-spec-template.md#user-stories">User stories</a></li></ul></li><li><p><a href="deliverable-spec-template.md#definition-of-done">Definition of done</a></p><ul><li><a href="deliverable-spec-template.md#must-have">Must have</a></li><li><a href="deliverable-spec-template.md#nice-to-have">Nice to have</a></li><li><a href="deliverable-spec-template.md#not-in-scope">Not in scope</a></li></ul></li><li><a href="deliverable-spec-template.md#proposed-metrics">Proposed metrics</a></li><li><a href="deliverable-spec-template.md#open-questions">Open questions</a></li><li><p><a href="deliverable-spec-template.md#logs">Logs</a></p><ul><li><a href="deliverable-spec-template.md#change-log">Change log</a></li><li><a href="deliverable-spec-template.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Deliver the initial specification of a data protocol for financial opportunities. This will include defining the schema and fields used for opportunity listings, as well as making a plan for adding future resources that are relevant to Grants.gov.
* **Why:** Defining a shared protocol for grants data makes it easier to share information between existing systems in the grants ecosystem and helps different grant platforms align on a common standard.
* **Who**
  * Internal development team
  * Grants ecosystem partners (e.g. USDR, OpenGrants.io, etc.)

### Business value

#### Problem

\[2-3 sentences describing the problem that this deliverable attempts to solve]

#### Value

\[2-3 sentences describing the value that this deliverable provides by addressing the problem]

#### Goals

* \[Business goal 1]
* \[Business goal 2]

#### Non-goals

* \[Description of something that is explicitly not a goal of this deliverable]
* \[Description of something that is explicitly not a goal of this deliverable]

#### Assumptions and dependencies

* \[Description of assumption that informs or impacts the rest of this deliverable]

### User stories

* As a **\[type of user 1]**, I want to:
  * \[perform action 1], so that \[goal or motivation for action]
  * \[perform action 2], so that \[goal or motivation for action]
* As a **\[type of user 2]**, I want to:
  * \[perform action 1], so that \[goal or motivation for action]
  * \[perform action 2], so that \[goal or motivation for action]

## Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

#### **Must have**

*User experience:*
- [ ] The protocol has a name that is approved by Emily Ianacone in her role as UX lead for Grants.gov.
- [ ] Documentation is published that explains the protocol in an intuitive, accessible manner.
- [ ] **Translation:** There are clear plans for putting tools and processes in place that translate the protocol's meaning and documentation into multiple languages. For instance, this could include building a data dictionary that defines the `fields` and `types` in multiple languages.

- *Financial opportunities specification:*
  - [ ] A complete draft specification is available that can be used to represent opportunity listings from Grants.gov, to be returned over the new Simpler Grants.gov APIs.
- *Generic specification:*
  - [ ] **Required fields:** One or more minimum necessary fields for any financial opportunity are included in the spec as required fields. An example field is the due date of applications for the financial opportunity.
  - [ ] **Optional fields:** One or more fields that are either necessary for Grants.gov specifically, or are often used for financial opportunities in general but are not required, are implemented. These will be fields that have well-designed implementations that any implementer of the protocol can optionally implement (by choosing them from a catalog of schemas). An example field is the federal opportunity number.
  - [ ] **Types:** For all these fields, well-designed field types exist and are joined one-to-many on these fields. (This means that every `type` can be used by one or more `field`s.) For instance, there could be a type for DateTime, a type for Geospatial, etc. Types can also include other types: such as an object with `type:Application` might include a field that has a `type:Timestamp`. Every `field` that is implemented has one and only one `type`.
  - [ ] **Extensions:** There exists an easy method for any implementer of the protocol to extend the protocol to custom fields and types. These custom fields and types are not necessarily reflected in the shared protocol specification, and can be implemented "locally." Custom extensions are easy to share and reuse with other projects.
  - [ ] **Proposals:** There are clear plans for putting processes and tools in place so that anyone can propose that their "local" extensions should become optional or required parts of the common spec.
  - [ ] **Decisionmaking:** There are clear plans for putting processes and tools in place that support community decisionmaking to accept or reject proposals for modifications to the spec.
- *Schema validation:*
  - [ ] A schema validator is built that verifies whether a given implementation of the protocol (or perhaps, an individual response object provided to or from an API) is a valid implementation of the shared protocol.
  - [ ] The schema validator is setup to run automatically on Grants.gov APIs.
  - [ ] Nice-to-have: the schema validator is provided through a package manager (such as `pip` for Python packages or `npmjs.com` for Javascript).
- *Integration:*
  - [ ] A decision has been made on where the code for the protocol will live -- either as part of `simpler-grants-gov` repo or a new open source repo -- and the code is hosted there publicly.
  - [ ] Code is deployed to `main` & PROD
  - [ ] Services are live in PROD (may be behind feature flag)
  - [ ] Metrics are published in PROD.
  - [ ] Translations are live in PROD (if necessary)

#### **Nice to have**

* [ ] \[Must-have condition 1]
* [ ] \[Must-have condition 2]

#### Not in scope

* \[Description of item that is explicitly out of scope]

## Measurement

### Proposed metrics

* \[Metric 1]
* \[Metric 2]

### Location for publishing metrics

\[Description of where/how metrics will be shared with the public]

## Open questions

<details>

<summary>[Open question 1]</summary>



</details>

<details>

<summary>[Open question 2]</summary>



</details>

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="282">Update</th><th>Notes</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
