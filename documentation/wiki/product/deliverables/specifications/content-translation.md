---
description: Create a translation process for Simpler.Grants.gov content and documentation.
---

# Content translation

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Planning</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/orgs/HHS/projects/12/views/8?pane=issue&#x26;itemId=40475988">Issue 568</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="content-translation.md#overview">Overview</a></p><ul><li><a href="content-translation.md#business-value">Business value</a></li><li><a href="content-translation.md#user-stories">User stories</a></li></ul></li><li><p><a href="content-translation.md#technical-description">Technical description</a></p><ul><li><a href="content-translation.md#definition-of-done">Definition of done</a></li><li><a href="content-translation.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="content-translation.md#assumptions-and-dependencies">Dependencies and assumptions</a></li><li><p><a href="content-translation.md#logs">Logs</a></p><ul><li><a href="content-translation.md#change-log">Change log</a></li><li><a href="content-translation.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Create a streamlined translation process for Simpler.Grants.gov content and use this process to translate both the content on the static site and other public facing documentation for the project.
* **Why:** Translating the contents of Simpler.Grants.gov makes it more accessible to public stakeholders whose primary language is not English. And translating our project documentation increases the size and diversity of the audience who can actively participate in our open source planning process.
* **Who**
  * Prospective applicants who speak a language other than English
  * Open source contributors who speak a language other than English

### Business value

#### Problem

English is the only language in which content is officially supported on grants.gov. While site visitors can use automatic translation services available in the browser, the resulting translations may not be completely accurate. These potential inaccuracies can introduce usability challenges and may discourage prospective applicants for whom English is a second language from even starting an application, despite meeting both the eligibility criteria and qualifications for a grant opportunity.

#### Value

By providing official support for translating contents into multiple languages, we can increase the accessibility of Simpler.Grants.gov and potentially broaden the base of applicants that grant programs have to choose from. Translating the documentation about the Simpler.Grants.gov initiative also enables stakeholders from a variety of backgrounds more easily contribute to our planning and design process.

#### Goals

* Make Simpler.Grants.gov more accessible to prospective applicants whose primary language is not English.
* Expanding the set of community members who can actively participate in the open source ecosystem in the project.
* Systematize the translation process so that content can be translated quickly after it is published in English.

### User stories

* As a **project maintainer**, I want:
  * a structured way to request support translating content from English into multiple supported languages, so that I don't have to manage translations myself.
  * a trusted stakeholder to review and approve translations submitted by members of the public, so that we can confirm they are accurate and do not substantively change the meaning of the original content.
* As a **stakeholder whose primary language is not English**, I want:
  * site contents and documentation to be translated into my primary language, so that I can understand how to use the simple.grants.gov without relying on automatic translations.
  * to be able to easily toggle between the supported languages from an easy to locate portion of the site, so that I don't have to spend a lot of time searching for that functionality in my non-dominant language.
* As an **open source contributor who speaks a language other than English**, I want:
  * project documentation in GitHub or the public wiki (e.g. README, contributing guidelines, etc.),  to be translated into my language, so that I can more easily learn about the project and how to contribute.
  * to assist with translating the contents of the site, so that other site visitors who also speak my language will find it easier to navigate.

## Technical description

### Translation process

As part of this deliverable we should define a system for facilitating and publishing translations of site content into multiple languages, that should:

* Enable project maintainers to indicate when site content or documentation needs to be translated into another language
* Track and monitor the progress of open requests for content translations
* Track the amount of time it takes to translate new content first published in English
* Ideally, allow members of the public to contribute translations in a language that they speak. **Note:** This is currently a stretch goal.

Through the design and development of this tool or process, the team should answer the following questions and record the decisions in one or more ADRs:

* Which languages should we commit to providing translation support for?
* Which criteria should determine whether or not content needs to be translated (e.g. audience, source, where it's hosted)?
* Should we adopt a tool that allows the public to contribute translations (e.g. [Crowdin](https://crowdin.com/))?
* How can/should translations be approved and moderated before they are published?

### Internationalization

Once we have a translation process set up, we also want to enable internationalization (i18n) on our site that:

* Allows project maintainers to publish translated content in multiple languages
* Allows site visitors to select their default language from any page on the site
* Allows the public to track the percentage of site content that has been translated into each supported language

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

* **Must have**
  * [ ] Basic requirements:
    * [ ] Code is deployed to `main` & PROD through our CI/CD pipeline
    * [ ] Services are live in PROD (may be behind feature flag)
    * [ ] Translations are live in PROD (or have a defined timeline for completion)
    * [ ] All new services have passed a security review (if necessary)
    * [ ] All new services have completed a 508 compliance review (if necessary)
    * [ ] Data needed for metrics is actively being captured in PROD
    * [ ] Key architectural decisions made about this deliverable are documented publicly
  * [ ] Functional requirements for internationalization:
    * [ ] Static  content is supported in _at least_ 3 languages
    * [ ] Users can change the default language from any page of the static site
    * [ ] A formal process and/or tool has been adopted to facilitate content translations
    * [ ] A user guide describing the translation process has been published in GitBook
* **Nice to have**
  * [ ] Members of the public can contribute to content translations
  * [ ] Translations from the public can be reviewed before they are published on the site

### Proposed metrics

1. Total number of site visits by language
2. Number of unique site visitors by language
3. Percentage of site content translated into each supported language
4. Length of time required to translate new content into each supported language

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver the [Public Measurement Dashboard deliverable](https://github.com/HHS/grants-equity/issues/65).

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* **Front-end:** These improvements will build on the front-end work completed in the [initial static site launch](https://github.com/HHS/grants-equity/issues/62) which delivered the following functionality:
  * [**Front-end CI/CD**](https://github.com/HHS/grants-equity/issues/58)**:** Automatically tests and deploys front-end code
  * [**Foundational UI**](https://github.com/HHS/grants-equity/issues/60)**:** Enforces a consistent user interface and web design system across the frontend

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* **Content Management System (CMS):** We do not expect to have a CMS in place by the time work starts on this deliverable. As a result, the translation process will need to manage translated content within the repository instead of in a CMS.

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* **Translating grant opportunity text:** While we would like to try to translate as much of the static content on simpler.grants.gov as possible, this does not extend to the text of grant opportunities posted on simpler.grants.gov. Opportunity text will only be translated if the program responsible for managing that opportunity chooses to translate it into another language themselves.
* **Translating GitHub issues:** While we'd also like to translate as much of the core documentation in the Github repository as possible (e.g. README, code of conduct, contributing guidelines), we will _**not**_ be translating the contents of issues in the repository. This is largely due to the volume of issues created and the frequency with which their contents change.
* **Translating sections of the codebase:** Similarly, we will not be translating _**all**_ sections of the codebase either. Highly technical documentation and code comments will not be in scope for translation.

### Open questions

<details>

<summary>What existing services does the federal government provide for translation?</summary>

* [USWDS design patterns](https://designsystem.digital.gov/patterns/select-a-language/) for internationalization
* [The US Department of State - Office of Language Services](https://www.state.gov/freelance-linguists-ols/) also offers support finding freelance contractors to assist with translation services

</details>

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

* **Static site contents:** The contents of the static site should either be translated as part of this deliverable _or_ tickets should be created to track that outstanding work as part of a translation backlog.
* **GitHub documentation:** A subset of the documentation in GitHub&#x20;

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Translation process:** Depending on the translation process that is developed as part of this deliverable, we _may_ adopt a new system that enables open source contributors to provide translations, such as [Crowdin](https://crowdin.com/).
* **Internationalization:** While the current template the team is using for our static site includes native support for internationalization, this deliverable represents be the first time we enable users to choose the language in which they view the contents of the site using that framework.

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **Static site + translation process:** This deliverable involves connecting our translation process to the repo for the static site and allowing site visitors to view that using our [internationalization framework](https://nextjs.org/docs/pages/building-your-application/routing/internationalization).

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

1. This deliverable will not be exposing any new fields from production data in grants.gov and all of the translated content included in this deliverable will be from previously published&#x20;

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

1. **Accepting public translations:** If we choose to allow members of the public to propose translations in languages that the team is not fluent in, it would introduce a risk of content being misrepresented or translated inaccurately.

If so, how are we addressing these risks?

1. **Translation review:** In the event that we accept translations from the public, we'll want to set up a review and approval process to ensure that the translations are accurate and consistent with our community guidelines.

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="282">Update</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
