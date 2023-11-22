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
  - a streamlined way to manage site content and content approvals, so that minor copy edits aren't blocked by (or detract from) engineering capacity
  - a mechanism to collect and store feedback from site visitors, so that we can solicit user input and questions throughout the project
- As an **stakeholder whose primary language is not English**, I want:
  - the site contents to be translated into my primary language, so that I can understand how to use the simple.grants.gov without relying on automatic translations
  - to be able to easily toggle between the supported languages from an easy to locate portion of the site, so that I don't have to spend a lot of time searching for that functionality in my non-dominant language

## Technical description

### Content Management

As part of the static site improvements, we should define a formal process and/or tooling that enables non-technical stakeholders to propose and review content updates to the static site. This content management process/system should:

- Enable internal stakeholders to propose specific content edits asynchronously and in a format that is accessible to non-technical users
- Enable internal stakeholders users to preview a deployed version of those content edits before they become visible to all users on the PROD version of the site
- Track the amount of engineering time and effort required to make content edits (if internal stakeholders users aren't able to make these edits directly through a CMS)

Through the design and development of this tool or process, the team should answer the following questions and record the decisions in one or more ADRs:

- Should we adopt a CMS to enable stakeholders to directly manage content? If so, which CMS? Options include:
  - No CMS, changes requested through tickets or GitBook
  - Existing grants.gov cloud CMS, Storyblok
  - Open source headless CMS, e.g. Strapi
- How can we enable non-technical stakeholders to preview content changes before they are visible to all site visitors? Options include:
  - Preview deploys on feature branches
  - Dedicated STAGING environment
  - Feature flag on PROD

### Internationalization & Content Translation

As part of this deliverable we should define a system for facilitating and publish translations of site content into multiple languages. This internationalization and translation system should:

- Enable site visitors to select their default language from any page on the site
- Allow the public to track the percentage of site contents that have been translated into each supported language
- Ideally, enable open source contributors to assist with the translation process
- Track the amount of time it takes to translate new content first published in English

Through the design and development of this tool or process, the team should answer the following questions and record the decisions in one or more ADRs:

- Which languages should we commit to providing translation support for?
- Which criteria should determine whether or not content needs to be translated (e.g. audience, source, where it's hosted)?
- Should we adopt a tool that assists with localization and translation (e.g. [Crowdin](https://crowdin.com/))?
- How can/should translations be approved and moderated before they are published?

### Feedback Mechanism

As part of this deliverable we should define a system for soliciting user input and feedback via the site. This feedback mechanism should:

- Enable users to provide feedback or ask questions directly from the site
- Enable internal stakeholders to solicit input from users to specific questions or topics
- Allow internal stakeholders to view all responses

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
- [ ] Functional requirements for content management:
  - [ ] Internal stakeholders can initiate content changes through a formal process and/or tool that is accessible to non-technical users
  - [ ] Internal stakeholders can preview content and design changes before they become visible to all users on the PROD version of the site
  - [ ] A user guide describing the content management process/system has been published in GitBook
- [ ] Functional requirements for internationalization:
  - [ ] Static site content is supported in *at least* 3 languages
  - [ ] Users can change the default language from any page of the static site
  - [ ] A formal process and/or tool has been adopted to facilitate content translations
  - [ ] A user guide describing the translation process has been published in GitBook
- [ ] Functional requirements for feedback mechanism:
  - [ ] Users can provide feedback or ask questions about Simpler Grants.gov directly from the site
  - [ ] Internal stakeholders can view visitor feedback and/or questions in a centrally location
  - [ ] A user guide describing how to access and manage user feedback has been published in GitBook

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

Page on the public wiki. **Note:** This will likely change once we deliver the [Public Measurement Dashboard deliverable](https://github.com/HHS/grants-equity/issues/65)

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

*What existing services does the federal government provide for translation?*

-  [USWDS design pattern recommendations](https://designsystem.digital.gov/patterns/select-a-language/)


### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this deliverable:

1. **Search Functionality:** Because search requires the API, site improvements in this deliverable will ***not*** include any search functionality. That will be completed in a [search-specific deliverable](https://github.com/HHS/grants-equity/issues/89)

## Integrations

### Translations
<!-- Required -->

Does this deliverable involve delivering any content that needs translation?

- **Static site contents:** The contents of the static site should either be translated as part of this deliverable _or_ tickets should be created to track that outstanding work as part of a translation backlog.

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. **Translation process:** Depending on the translation process that is developed as part of this deliverable, we _may_ adopt a new system that enables open source contributors to provide translations, such as [Crowdin](https://crowdin.com/)
3. **Feedback mechanism:** Depending on our approach to collecting feedback as part of this deliverable, we _may_ adopt a new survey tool, such as [Medallia](https://www.medallia.com/), or re-use an existing survey tool like [Microsoft forms](https://www.microsoft.com/en-us/microsoft-365/online-surveys-polls-quizzes)

### Services being integrated in PROD for the first time
<!-- Required -->

_Are there multiple services that are being connected for the first time in PROD?_

1. **Static site + translation process:** This deliverable involves connecting our translation process to the repo for the static site and allowing site visitors to view that using our [internationalization framework](https://nextjs.org/docs/pages/building-your-application/routing/internationalization)
2. **Static site + feedback mechanism:** This deliverable involves embedding a feedback mechanism on our static site so that site visitors can submit feedback without leaving the site.

### Data being shared publicly for the first time
<!-- Required -->

_Are there any fields being shared publicly that have never been shared in PROD before?_

1. This deliverable will not be exposing any new fields from production data in grants.gov, but it will be sharing summary-level information about the user research conducted by Huge for the first time.

### Security considerations
<!-- Required -->

_Does this deliverable expose any new attack vectors or expand the attack surface of the product?_

1. TODO

_If so, how are we addressing these risks?_

1. TODO
