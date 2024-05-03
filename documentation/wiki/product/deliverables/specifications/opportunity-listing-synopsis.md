---
description: >-
  Create an opportunity listing page that contains the synopsis of the
  opportunity.
---

# Opportunity listing - Synopsis

Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Prioritized</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/277">Issue 277</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="opportunity-listing-synopsis.md#overview">Overview</a></p><ul><li><a href="opportunity-listing-synopsis.md#business-value">Business value</a></li><li><a href="opportunity-listing-synopsis.md#user-stories">User stories</a></li></ul></li><li><p><a href="opportunity-listing-synopsis.md#definition-of-done">Definition of done</a></p><ul><li><a href="opportunity-listing-synopsis.md#must-have">Must have</a></li><li><a href="opportunity-listing-synopsis.md#nice-to-have">Nice to have </a></li><li><a href="opportunity-listing-synopsis.md#not-in-scope">Not in scope</a></li></ul></li><li><a href="opportunity-listing-synopsis.md#proposed-metrics">Proposed metrics</a></li><li><a href="opportunity-listing-synopsis.md#open-questions">Open questions</a></li><li><p><a href="opportunity-listing-synopsis.md#logs">Logs</a></p><ul><li><a href="opportunity-listing-synopsis.md#change-log">Change log</a></li><li><a href="opportunity-listing-synopsis.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

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

* By creating an opportunity listing page that displays synopsis information and can be accessed directly from the search results on simpler.grants.gov, we make it easier for prospective applicants to browse opportunities within the simpler.grants.gov platform&#x20;
* Making the data that populates this page available via API also enables open source contributors to begin experimenting with different ways of presenting the synopsis data
* The opportunity listing page allows us to begin conducting usability testing that will inform future user experience improvements to the opportunity listing

#### Goals

* Ensure a more consistent user experience on simpler.grants.gov
* Determine the additional data needed to populate an opportunity listing page
* Establish initial infrastructure and API endpoint required to expose the opportunity listing data publicly
* Begin experimenting with more user-friendly ways of presenting the opportunity details to prospective applicants

**Non-goals**

* There will be no authorization or authentication and users will not be able to apply for opportunities on simpler.grants.gov. They will be redirected to grants.gov to login, start their application, or save the opportunity&#x20;
* There will be no assessment of the applicants' status and whether or not they have permissions to apply
* The full text of the opportunity will only be available via PDF, not interactively rendered HTML in the browser
* We will not be publishing metrics for individual grantors in this effort. Metrics published on the simpler.grants.gov site will be for all users
* There will be no usability feedback sessions with API consumers in this effort. We can conduct feedback sessions with API consumers in a future deliverable or discovery effort
* Listing all previous versions of the opportunity listing page. There are multiple versions of the opportunity listing page when a grantmaker updates the opportunity. We will not have a history of all the versions.&#x20;

**Assumptions and dependencies**

* Our ability to change the labels of fields in the UI is impacted by policy or regulations
* Search UI and Search API will be completed before we start work on this effort
* Users will not have access to a logged in experience by the time works starts on this deliverable, so the opportunity listing page cannot contain any features or functionality that requires authentication

### User stories

* As a **project maintainer**, I want:
  * to have a basic opportunity listing page deployed in production, so that we can begin to conduct usability testing that may point to new features or functionality that can improve the search and understanding eligibility experience.
  * to be able to track how often users click into a given opportunity listing page from the search results, so that we can track the conversion rate and accuracy of our search results.
  * to build good technical foundations, so that I can understand the opportunity data to iterate and improve the experience on future work on the listing page as we start to incorporate findings from usability testing.
* As a **prospective applicant**, I want:
  * to be able to clearly view the details about an opportunity on simpler.grants.gov, so that I don't have to keep switching between the grants.gov and simpler.grants.gov user interface when I'm searching for grants.
  * to be able to view or download the full text of the opportunity from the main opportunity listing page, so that I can quickly read more about a grant opportunity that seems like it might be a good fit.
  * to be able to easily navigate between search results and opportunity listing synopsis page, so that I don't lose my page and have a more seamless experience while looking at opportunities.&#x20;
* As a **grantor,** I want:&#x20;
  * to clearly present the goals and information of my opportunity in a clear and concise way and ensure that the synopsis is up-to-date, so that it makes it easier for applicants to apply for opportunities that I have posted.
  * to see applicant interaction metrics on the opportunity synopsis page, so that I have an understanding if I'm accomplishing outreach and audience goals of the grant and see when applicant don't apply.

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

#### **Must have**

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
* [ ] Our proposed metrics for this deliverable are captured and displayed in a public place

#### **Nice to have**

* [ ] Technical discovery on how users can view or download the full text of the opportunity (as a PDF) from the opportunity listing page on simpler.grants.gov
* [ ] API consumers can also access the full text of the opportunity (as a PDF) via API
* [ ] Users can view what information about an opportunity has changed
* [ ] All fields use plain language labels
* [ ] At least one usability testing session is conducted to surface additional needs and requirements around an improved opportunity listing page

#### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* **Rendered opportunity text:** While enabling users to download the full text of the opportunity as a PDF is a stretch goal for this deliverable, rendering the opportunity text in browser is _not_ in scope. Rendering the opportunity text in the browser will be the focus on a subsequent deliverable.
* **Translating opportunity content:** While we may translate some of the common field names and other static elements on the opportunity listing page, translating the synopsis and other details about the opportunity are not in scope. While we recognize that understanding eligibility is a pain point for our users, we may not be able to resolve that problem with this feature.&#x20;
* **Application materials:** Including items that are related to applying for a given opportunity, such as a link to download the application package, are also out of scope for this deliverable.
* **Eligibility to apply:** On grants.gov live, logged-in applicants can view opportunity eligibility. As user authentication is not in place on simpler.grants.gov, we cannot determine eligibility. The "Apply" CTA language on the opportunity listing page will prompt users to log in to grants.gov live for eligibility checks. The following status will not be in scope: [https://grantsgovprod.wordpress.com/2023/06/08/unlock-the-mystery-of-the-gray-apply-button-four-scenarios/](https://grantsgovprod.wordpress.com/2023/06/08/unlock-the-mystery-of-the-gray-apply-button-four-scenarios/)
* **Authentication management:** We are currently using key management for authentication and will not be handling user management of the API within this deliverable.&#x20;

### Proposed metrics

* Total number of unique users who have logged an event on opportunity listing page
* Number of users have who have interacted with the opportunity listing page
* Total number of requests to the API endpoint for opportunity details
* Unique number of users requesting the API endpoint for opportunity details
* Stretch goal: Click-through-rate from search results to opportunity listing page and then to the "apply" CTA that redirects a user to grants.gov live

### Location for publishing metrics

Metrics will live on a page on the public wiki. **Note:** This will likely change once we deliver the [Public Measurement Dashboard milestone](https://github.com/HHS/simpler-grants-gov/issues/65).

## Open questions

<details>

<summary>Can we offer NOFOs in any format? </summary>

Some NOFOs are not in PDF format. For example, they are in zip files and .docx format. In our scope of work, attaching PDF NOFOs is listed as a nice-to-have. Do we have a preference for providing NOFOs exclusively in PDF format? Is there a specific reason for this, or can we offer NOFOs in any format?

Yes, whatever format they are available in grants.gov, then we can offer&#x20;

</details>

<details>

<summary>How will we handle user management for the API? </summary>

We are currently using a key management approach which does not scale well. There are a couple different ways for us to manage usage:&#x20;

1. Give user temporary keys and replace the system. Make keys public, which means there is no auth.&#x20;
2. Manually distribute keys and track manually through manual effort.&#x20;

</details>

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="229">Update</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td>4/24/2024</td><td>Updated the deliverable spec</td><td><ul><li>Moved the implementation to the technical spec</li><li>Updated the user stories section</li><li>Added the non-goals section</li><li>Added/moved the assumptions and dependencies section</li><li>Added the Not in scope section</li><li>Updated the defintion of done section</li><li>Updated the proposed metrics section</li></ul></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
