---
description: >-
  Create an opportunity listing page that contains the synopsis of the
  opportunity.
---

# Opportunity listing - Synopsis

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Prioritized</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/277">Issue 277</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="opportunity-listing-synopsis.md#overview">Overview</a></p><ul><li><a href="opportunity-listing-synopsis.md#business-value">Business value</a></li><li><a href="opportunity-listing-synopsis.md#user-stories">User stories</a></li></ul></li><li><p><a href="opportunity-listing-synopsis.md#technical-description">Technical description</a></p><ul><li><a href="opportunity-listing-synopsis.md#definition-of-done">Definition of done</a></li><li><a href="opportunity-listing-synopsis.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="opportunity-listing-synopsis.md#assumptions-and-dependencies">Dependencies and assumptions</a></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Create an initial opportunity listing page that allows applicants to view information from the synopsis of an opportunity on simpler.grants.gov.
* **Why:** Enables users to view the details of an opportunity within simpler.grants.gov, instead having to switch between grants.gov and simpler.grants.gov when searching for grants. It also enables us to conduct usability testing on a new user experience for the opportunity listing page.
* **Who**
  * Subset of prospective applicants who we invite to participate in usability testing
  * Open source contributors who want to experiment with presenting the opportunity synopsis information in a more user-friendly format

### Business value

#### Problem

When we first launch the search functionality, we plan to redirect users to the opportunity listing page on grants.gov when they click on that opportunity in the search results page in simpler.grants.gov. While this approach unblocks deployment of new search functionality, it makes it a bit harder for users to easily navigate between grant opportunities on simpler.grants.gov.

Additionally, while the current opportunity listing page on grants.gov contains valuable information from the opportunity synopsis, that information isn't always presented in the most accessible format. Until we build an initial page on simpler.grants.gov which contains the same information, it's hard to begin experimenting with different ways of presenting this information that improve the user experience.

#### Value

By creating an opportunity listing page that displays synopsis information and can be accessed directly from the search results on simpler.grants.gov, we make it easier for prospective applicants to browse opportunities within the simpler.grants.gov platform. Making the data that populates this page available via API also enables open source contributors to begin experimenting with different ways of presenting the synopsis data. And we can begin to use this page to conduct usability testing that will inform future user experience improvements to the opportunity listing.

#### Goals

* Determine the additional data needed to populate an opportunity listing page
* Create the infrastructure and API endpoint required to expose that data publicly
* Begin experimenting with more user-friendly ways of presenting the opportunity details to prospective applicants
* Begin conducting usability testing to surface additional needs and requirements around an improved opportunity listing page.

### User stories

* As a **project maintainer**, I want:
  * to have a basic opportunity listing page deployed in production, so that we can begin to conduct usability testing that may point to new features or functionality that can improve the search experience.
  * to be able to track how often users click into a given opportunity listing page from the search results, so that we can track the conversion rate and accuracy of our search results.
* As a **prospective applicant**, I want:
  * to be able to view the details about an opportunity on simpler.grants.gov, so that I don't have to keep switching between the grants.gov and simpler.grants.gov user interface when I'm searching for grants.
  * to be able to view or download the full text of the opportunity from the main opportunity listing page, so that I can quickly read more about a grant opportunity that seems like it might be a good fit.
* As an **open source contributor**, I want:
  * the data needed to populate an opportunity listing page to be available via API, so that I can begin experimenting with different ways of presenting the details about an opportunity.

## Technical description

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

* **Must have**
  * [ ] Basic requirements
    * [ ] Code is deployed to main & PROD through our CI/CD pipeline
    * [ ] Services are live in PROD (may be behind feature flag)
    * [ ] All new services have passed a security review (as needed)
    * [ ] All new services have completed a 508 compliance review (as needed)
    * [ ] Data needed for metrics is actively being captured in PROD
    * [ ] Key architectural decisions made about this deliverable are documented publicly (as needed)
  * [ ] Functional requirements
    * [ ] Users can view the summary-level details about an opportunity from a page within simpler.grants.gov
    * [ ] Users can access the corresponding grants.gov page for an opportunity they find on simpler.grants.gov via link on the opportunity listing page
    * [ ] All of the information needed to populate the opportunity listing page can also be accessed via the API
* **Nice to have**
  * [ ] Users can view or download the full text of the opportunity (as a PDF) from the opportunity listing page on simpler.grants.gov
  * [ ] System-to-system users can also access the full text of the opportunity (as PDF) via API

### Proposed metrics

* Total number of visitors per opportunity listing page
* Number of unique visitors per opportunity listing page
* Clickthrough rate from search results to each opportunity listing page
* Total number of requests to the API endpoint for opportunity details
* Unique number of users requesting the API endpoint for opportunity details

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver the [Public Measurement Dashboard milestone](https://github.com/HHS/simpler-grants-gov/issues/65).

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* [ ] **Search:** This deliverable depends on having the initial version of search in place, so that users can navigate to the opportunity listing page from the search results page.

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* **AuthN/AuthZ:** Users will not have access to a logged in experience by the time works starts on this deliverable, so the opportunity listing page cannot contain any features or functionality that requires authentication.

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* **Rendered opportunity text:** While enabling users to download the full text of the opportunity as a PDF is a stretch goal for this deliverable, rendering the opportunity text in browser is _not_ in scope. Rendering the opportunity text in the browser will be the focus on a subsequent deliverable.
* **Translating opportunity content:** While we may translate some of the common field names and other static elements on the opportunity listing page, translating the synopsis and other details about the opportunity are not in scope.
* **Application materials:** Including items that are related to applying for a given opportunity, such as a link to download the application package, are also out of scope for this deliverable.

### Open questions

<details>

<summary>Which of the grants.gov data stores currently holds the PDFs for each opportunity?</summary>



</details>

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

* Potentially, we may need to translate some of the field labels and other static content on the opportunity listing page.

If so, when will English-language content be locked? Then when will translation be started and completed?

* Translations will most likely need to happen _after_ the English version of the page is deployed. We'll track those translations in the process defined by the content translation process deliverable.

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Opportunity listing page:** This deliverable will deploy an opportunity listing page for the first time on simpler.grants.gov, where users can access details about a given opportunity.
* **PDF storage:** If we are able to hit the stretch goal of allowing users to download opportunity PDFs directly from the listing page on simpler.grants.gov, it will also be the first time we are storing and exposing PDFs within the simpler.grants.gov PROD environment.

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **Search + opportunity listing:** This deliverable will enable users to navigate between search results and the opportunity listing page for the first time on simpler.grants.gov.
* **PDF storage + Frontend & API:** If we're able to hit our stretch goal and allow users to download the full text of the opportunity as a PDF on simpler.grants.gov, then this deliverable will also be the first time we're integrating PDF storage with the API and frontend.

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* **Opportunity details:** All of the fields that we anticipate sharing on the simpler.grants.gov opportunity page are already publicly available on grants.gov, but this will be the first time we are making the synopsis and other opportunity metadata available on simpler.grants.gov.

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

* **PDF storage:** If we hit our stretch goal and enable users to download the full text of the opportunity as a PDF, then we'll need to evaluate the security implications of setting up file storage in the simpler.grants.gov environment.

If so, how are we addressing these risks?

* **Security review:** We'll following the security controls in place for grants.gov and evaluate the need for a separate Security Impact Assessment (SIA) for adding file storage.
