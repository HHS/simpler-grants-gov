# Static Site with NOFO Content

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Document Status | Final Draft                                                          |
| Epic Link       | [Issue 62](https://github.com/HHS/grants-api/issues/62)              |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-08-23                                                           |
| Product Owner   | Lucas Brown                                                          |
| Document Owner  | Billy Daly                                                           |
| Lead Developer  | Aaron Couch                                                          |
| Lead Designer   | Andy Cochran                                                         |

## Short description

TODO

## Goals

### Business description & value

TODO

### User stories

- As a **full-time HHS staff member**, I want:
  - TODO
- As a **grantor**, I want:
  - TODO
- As a **member of an HHS contractor team**, I want:
  - TODO
- As an **open source contributor**, I want:
  - TODO
- As a **prospective grant applicant**, I want:
  - TODO

## Technical description

### {Sub-deliverable}

TODO

### Definition of done

- [ ] The following infrastructure requirements are satisfied:
  - [ ] The code needed to build and deploy the site is merged to `main`
  - [ ] Site is built and hosted with the tools selected in the [Front-end Planning milestone](https://github.com/HHS/grants-equity/issues/49)
  - [ ] All code quality checks set up in the [Developer Tools milestone](https://github.com/HHS/grants-equity/issues/50) are passing
  - [ ] The resources required to deploy and host the site are provisioned programmatically using the framework established in the [Infrastructure-as-Code milestone](https://github.com/HHS/grants-equity/issues/123)
  - [ ] Code changes are deployed using the CI/CD pipeline set up in [the Front-end CI/CD milestone](https://github.com/HHS/grants-equity/issues/58)
- [ ] The following user experience (UX) requirements are satisfied:
  - [ ] Site is live and can be accessed at beta.grants.gov
  - [ ] Site adopts the UI principles and framework established in the [Foundational UI milestone](https://github.com/HHS/grants-equity/issues/60)
  - [ ] TODO
- [ ] The following content requirements are satisfied:
  - [ ] TODO

### Proposed metrics for measuring goals/value/definition of done

TODO

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver [the Public Measurement Dashboard milestone](../milestone_short_descriptions.md#public-measurement-dashboards)

## Planning

### Assumptions & dependencies
<!-- Required -->

*What capabilities / milestones do we expect to be in place at the beginning of work on this milestone?*

TODO

*Are there any notable capabilities / milestones do NOT we expect to be in place at the beginning of work on this milestone?*

- [x] **Internationalization:** While there will be content delivered within this milestone that needs to be translated in the future, we do not expect to have a framework for managing translations set up by the time this milestone is delivered.

### Open questions
<!-- Optional -->

- [x] None

### Not doing
<!-- Optional -->

*The following work will* not *be completed as part of this milestone:*

1. **Translating onboarding documents:** Translation of key documents will be covered in an upcoming milestone

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

*If so, when will English-language content be locked? Then when will translation be started and completed?*

TODO

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

TODO

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

TODO

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

TODO

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

TODO

*If so, how are we addressing these risks?*

TODO
