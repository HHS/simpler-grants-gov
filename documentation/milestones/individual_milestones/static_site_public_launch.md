# Static site public launch

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Document status    | Completed                                                         |
| Deliverable ticket | [Issue 692](https://github.com/HHS/simpler-grants-gov/issues/692) |
| Roadmap dashboard  | [Product Roadmap](https://github.com/orgs/HHS/projects/12)        |
| Product owner      | Lucas Brown                                                       |
| Document owner     | Billy Daly                                                        |
| Lead developer     | Aaron Couch                                                       |
| Lead designer      | Andy Cochran                                                      |


## Short description
<!-- Required -->

- **What:** Update the static site to prepare for a public launch and adopt tools needed to manage content changes and collect user feedback.
- **Why:** Continues to improve front-end infrastructure and begins to build public excitement for the Simpler Grants.gov initiative.
- **Who:**
  - Internal content managers
  - Subset of grants.gov mailing list

## Goals

### Business description & value
<!-- Required -->

- Begin sharing simpler.grants.gov with a targeted set of public stakeholders
- Develop a communication strategy for future stakeholder engagement
- Create the systems and processes needed to ensure the site remains available under heavier traffic

### User stories
<!-- Required -->

- As an **HHS staff member**, I want:
  - to approve the content on the site before we share it with the public, so that I know what information will be visible to external stakeholders.
  - to know when I can share the site publicly, so that I can direct key stakeholders to a centralized location where they can learn more about the Simpler.Grants.gov initiative.
  - to have a communications strategy for stakeholder engagement, so that we have clear expectations about which groups will receive updates on the Simpler.Grants.gov initiative and can review proposed messaging to those groups.
- As an **internal developer**, I want:
  - to be notified when the site goes down, so that I can work to troubleshoot the issue and minimize downtime.
  - the front-end infrastructure to auto-scale based on site traffic, so that I don't have to manually monitor traffic and provision additional resources when there is heavy usage.
- As a **site visitor**, I want:
  - the site to load quickly when I visit it, so that I don't have to wait a long time to access the information I'm looking for.
  - there to be minimal planned or unplanned downtime, so that I can trust the new Simpler.Grants.gov site will be reliable when I use it to apply for grants.

## Technical description

### {Optional sub-deliverable}
<!-- Optional -->

{List reqiurements specific to this sub-deliverable, options to consider, etc.}

### Definition of done
<!-- Required -->

- [ ] [to be added]
- [ ] Code is deployed to `main` & PROD
- [ ] Services are live in PROD (may be behind feature flag)
- [ ] Metrics are published in PROD

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

- [to be added]

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- [to be added]

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

1. [to be added]

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
