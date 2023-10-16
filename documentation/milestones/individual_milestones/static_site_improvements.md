# Static Site Improvements

| Field           | Value                                                        |
| --------------- | ------------------------------------------------------------ |
| Document Status | Completed                                                    |
| Epic Link       | [Issue 568](https://github.com/HHS/grants-equity/issues/568) |
| Epic Dashboard  | [Product Roadmap](https://github.com/orgs/HHS/projects/12)   |
| Product Owner   | Lucas Brown                                                  |
| Document Owner  | Billy Daly                                                   |
| Lead Developer  | Aaron Couch                                                  |
| Lead Designer   | Andy Cochran                                                 |


## Short description
<!-- Required -->

- **What:** Update the static site to include additional functionality and infrastructure that was excluded from the launch, such as content management, translations, and feedback mechanisms.
- **Why:** Reinforces the agile approach we're taking and improves the infrastructure that supports long-term site maintenance.
- **Who:** The functionality included in this deliverable has two primary audiences:
  - Stakeholders who speak a language other than English
  - Internal stakeholders and project maintainers

## Goals

### Business description & value
<!-- Required -->

By delivering the next batch of updates to the static site, this body of work aims to:

- Reinforce the iterative approach we're taking with product improvements and releases
- Continue to build critical infrastructure to support:
  - Enabling internal, non-technical stakeholders to more easily make content changes
  - Translating content into multiple languages
  - Collecting feedback from site visitors

### User Stories
<!-- Required -->

- As a **project maintainer**, I want:
  - a streamlined way to manage site content, so that minor copy edits aren't blocked by (or detract from) engineering capacity
  - a mechanism to collect and store feedback from site visitors, so that we can solicit user input and questions throughout the project
- As an **stakeholder whose primary language is not English**, I want:
  - the site contents to be translated into my primary language, so that I can understand how to use the simple.grants.gov without relying on automatic translations
  - to be able to easily toggle between the supported languages from an easy to locate portion of the site, so that I don't have to spend a lot of time searching for that functionality in my non-dominant language

## Technical description

### Content Management

TODO

### Internationalization & Content Translation

TODO

### Feedback Mechanism

TODO

### Definition of done
<!-- Required -->

- [ ] Basic requirements:
  - [ ] Code is deployed to `main` & PROD through our CI/CD pipeline
  - [ ] Services are live in PROD (may be behind feature flag)
  - [ ] Translations are live in PROD (or have a defined timeline for completion)
  - [ ] All new services have passed a security review (if necessary)
  - [ ] All new services have completed a 508 compliance review (if necessary)
  - [ ] Data needed for metrics is actively being captured in PROD
  - [ ] Key architectural decisions made about this deliverable are documented publicly
- [ ] Functional requirements:
  - [ ] Internal stakeholders can initiate content changes through a formal process and/or tool that is accessible to non-technical users
  - [ ] Internal stakeholders can preview content and design changes before they become visible to all users on the PROD version of the site
  - [ ] Static site content is supported in *at least* 3 languages
  - [ ] Users can change the default language from any page of the static site
  - [ ] A formal process and/or tool has been adopted to facilitate content translations
  - [ ] Users can provide feedback or ask questions about Simpler Grants.gov directly from the site
  - [ ] Internal stakeholders can view visitor feedback and/or questions in a centrally location

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. Total number of site visits by language
2. Total number of form responses
3. Number of unique site visitors by language
4. Number of unique form respondents
5. Percentage of site content translated into each supported language
6. Percentage of total points per sprint allocated to content updates
7. Length of time required to translate new content into each supported language
8. Length of time required to deploy content updates requested by internal stakeholders

### Destination for live updating metrics
<!-- Required -->

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- **Front-end:** These improvements will build on the front-end work completed in the [initial static site launch](https://github.com/HHS/grants-equity/issues/62) which delivered the following functionality:
  - **[Front-end CI/CD](https://github.com/HHS/grants-equity/issues/58):** Automatically tests and deploys front-end code
  - **[Foundational UI](https://github.com/HHS/grants-equity/issues/60):** Enforces a consistent user interface and web design system across the frontend

What functionality do we expect to be in place by ***the end*** of work on this deliverable?

- **[Content Management](https://github.com/HHS/grants-equity/issues/75):** Enables non-technical users to either directly make content updates to the site or to propose and review content changes that are implemented by the engineering team.
- **[Internationalization](https://github.com/HHS/grants-equity/issues/64):** Enables users to change the language in which they view site contents
- **[Translation Process](https://github.com/HHS/grants-equity/issues/81):** Facilitates and publishes translations of front-end content in multiple languages
- **[Feedback Mechanism](https://github.com/HHS/grants-equity/issues/596):** Enables users to provide feedback or ask questions directly from the site

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- **API:** Work on the API will be completed as part of [a separate deliverable](https://github.com/HHS/grants-equity/issues/70), so functionality that requires the API is explicitly out of scope in this deliverable.

### Open questions
<!-- Optional -->

- [ ] TODO

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. **Search Functionality:** Because search requires the API, site improvements in this deliverable will ***not*** include any search functionality. That will be completed in a [search-specific deliverable](https://github.com/HHS/grants-equity/issues/89)

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

TODO

*If so, when will English-language content be locked? Then when will translation be started and completed?*

TODO

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. TODO

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. TODO

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. TODO

### Security considerations
<!-- Required -->

Does this milestone expose any new attack vectors or expand the attack surface of the product?

If so, how are we addressing these risks?

1. TODO
