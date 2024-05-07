---
description: Deploy basic search functionality behind a feature flag.
---

# Search UI

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Ready for approval</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/89">Issue 89</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="search-user-interface.md#overview">Overview</a></p><ul><li><a href="search-user-interface.md#business-value">Business value</a></li><li><a href="search-user-interface.md#user-stories">User stories</a></li></ul></li><li><p><a href="search-user-interface.md#technical-description">Technical description</a></p><ul><li><a href="search-user-interface.md#definition-of-done">Definition of done</a></li><li><a href="search-user-interface.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="search-user-interface.md#assumptions-and-dependencies">Dependencies and assumptions</a></li><li><p><a href="search-user-interface.md#logs">Logs</a></p><ul><li><a href="search-user-interface.md#change-log">Change log</a></li><li><a href="search-user-interface.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What**
  * Release a basic search page that allows users to filter and sort funding opportunities, then **save** and **share** the link to the results page
  * **A search page** on simpler.grants.gov&#x20;
  * **A feature flag** to hide the search initially&#x20;
* **Why:** Proves the successful integration of front-end and backend systems and delivers basic search functionality for user testing
* **Who:** HHS leadership and targeted group of internal and external stakeholders with whom we'd like to conduct user research and testing.
* **Out of scope**
  * Full text search from the API
  * API work, which is handled in  [search-api.md](search-api.md "mention")
  * Scaling the search page beyond current implementation

### Business value

#### Problem

As we develop the API and the frontend of simpler.grants.gov, we want to continue to make progress and deliver value to end users. To do so, we need to integrate the API and the frontend in production. Additionally, the features on our existing roadmap for "search" are based on previous user research. In order to identify a more concrete list of features to improve the user experience for applicants, we need to have an extremely simple but functional version of search that we can use to begin conducting usability testing.

#### Value

The launch of a basic search feature primarily proves our ability to integrate front-end and backend systems in a production environment, while also releasing a basic search page that allows users to filter and sort funding opportunities, then **save** and **share** the link to the results page. This allows us to start doing usability testing to validate assumptions about search.&#x20;

#### Goals

* Successfully integrate the front-end with the API for the first time in production
* Create the internal infrastructure needed to support future search functionality
* Deliver value on a fundamental improvement from the existing search experience
* Deliver a basic search feature we can use to collect feedback from a subset of users

#### Non-goals

By contrast, this version of search _**does not**_ attempt to:

* Replicate _all_ of the search functionality currently supported by grants.gov
* Dramatically improve the accuracy of search results relative to those returned by grants.gov
* Replace grants.gov as the primary platform applicants use to find funding opportunities

### User stories

* As a **prospective applicant**, I want:
  * to be able to be able to search with filters applied, so that the only search results returned are ones that match both the keyword and field-based criteria I specified
  * the search results to have a link to the opportunity on grants.gov, so that I don't have to repeat my search on grants.gov after finding an opportunity I want to apply for on simpler.grants.gov
  * to receive an incentive if I participate in user research for simpler.grants.gov, so that I am fairly compensated for the time that I invest in testing out new features and answering questions
  * filters and search terms to be added to the url, so that I can save or share the link to a particular set of search results
* As a **project maintainer**, I want:
  * to be notified when simpler.grants.gov experiences downtime, so that I can quickly troubleshoot the issue with minimal impact on end users
  * the system architecture we create for this deliverable to support future search features as well, so that we don't need to discard and re-build critical infrastructure

## Technical description

### Search UI design and usability testing

**Description**

This focuses on designing and testing the user interface for the search functionality on simpler.grants.gov. It aims to ensure the interface is intuitive and efficient for users to navigate, filter, and sort funding opportunities.

**Scope**

* Get Figma design reviewed by internal stakeholders
* Conduct usability testing to gather feedback on design and functionality
* Create testing brief and obtain approval
* Create a comprehensive test plan and obtain approval
* Recruit participants for usability testing
* Synthesize feedback to develop actionable findings
* Document findings and recommendations
* Share findings and recommendations with stakeholders
* Develop presentation materials for sharing findings

### Create initial search page

**Description**

This effort involves building the UI of the initial search page designs for simpler.grants.gov, providing users with basic search functionality to filter and sort funding opportunities.&#x20;

**Scope**

The primary page we'll need to deliver for the UI a search page, which should allow users to:

* Enter key words to search the list of funding opportunities
* Filter search results by _at least_ one structured field (e.g. award date, opportunity type, etc.)
* View a common set of fields for each opportunity returned by the search (e.g. title, award date, summary, etc.)
* Sort the set of results returned by _at least_ one structured field (e.g. award date, title, etc.)

### Feature flags, API, and infrastructure

**Description**

This effort focuses on implementing feature flags, strengthening infrastructure, and ensuring system stability and scalability. It aims to support future search functionality and provide a reliable foundation for ongoing development.

* Create feature flag functionality
* ADR for feature flags that describes client side feature flags decision, how to use, how to implement, and how to remove
* Add feature flag to hide page
* Add feature flag for mock data
* Add log metrics for search coming from front-end app and ensure metrics we can capture are setup
* Mock data for local dev
* Determine architecture for initial deployment previews, meeting to discuss, update arch diagram, and write ADR
* Ensure internal error logging (log level, messages) is implemented and consistent with log monitoring needs.&#x20;
* Ensure notifications for error log are added
* Add notifications for search coming from front-end app

### Definition of done

**Must-have:**

Basic requirements:

* [x] Code is merged into `main` and deployed to PROD using our CI/D pipeline
* [x] Services are live in PROD (maybe behind feature flag)
* [ ] All new services have passed a security review (if necessary)
* [ ] All new services have completed a 508 compliance review (if necessary)
* [ ] Data needed for metrics is actively being captured in PROD
* [ ] Key architectural decisions made about this deliverable are documented publicly

Functional requirements:

* [x] Users can search for opportunities by key word
* [x] Users can filter search results by _at least one_ structured field (e.g. award date, opportunity type, etc.)
* [x] Users can sort search results by _at least_ one structured field (e.g. award date, title, etc.)
* [x] All of the search features available in the UI are also available via the API, and vice versa
* [x] Search criteria are reflected in the URL so that users can bookmark or share the link to the page with the results from that combination of criteria
* [x] Users can access the corresponding grants.gov page for an opportunity they find on simpler.grants.gov via link on the search results
* [x] Any site downtime will generate automated notifications to project maintainers
* [x] Functionality can be hidden from users behind a URL-based feature flag, if desired
* [ ] Documented findings for current search in grants.gov live and strategy for future search relevance
* [ ] Our desired project metrics are captured and displayed in a public place

**Nice-to-have:**

* [ ] Method to sort by relevance

### Proposed metrics

_Metrics alone shouldn't be the sole focus. Analyzing them alongside click-through rate (CTR) to the opportunity listing on grants.gov or tracking them over time would provide more actionable insights._

* Total number of searches made via the UI
* Track search terms searched so that we can understand top search terms
* Click-through-rate to the opportunity listing on grants.gov to measure the search accuracy for those top searched terms
* Number of searches made per search term and the click conversion rate to the opportunity listing
* Number of searches made per filter combination and the click-through-rate to the opportunity listing

**Note:** While not in scope for this deliverable, we may want to track the accuracy of search results based on user feedback in the future.

### Destination for live updating metrics

This may live as a page on the public wiki or a dashboard in Google Analytics.&#x20;

**Note:** This will likely change once we deliver the [Public Measurement Dashboard milestone](https://github.com/HHS/simpler-grants-gov/issues/65).

## Planning

### Assumptions & dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* **Front-end:** The search UI will build on the front-end work completed in both the [initial static site launch](https://github.com/HHS/simpler-grants-gov/issues/62) and the [subsequent improvements](https://github.com/HHS/simpler-grants-gov/issues/568) that created the following functionality:
  * [**Front-end CI/CD**](https://github.com/HHS/simpler-grants-gov/issues/58)**:** Automatically tests and deploys front-end code
  * [**Foundational UI**](https://github.com/HHS/simpler-grants-gov/issues/60)**:** Enforces a consistent user interface and web design system across the frontend

What functionality do we expect to be in place by _**the end**_ of work on this deliverable?

* [**Search API**](https://github.com/HHS/simpler-grants-gov/issues/90)**:** Enables system-to-system users to access the search features through the API
* [**Search Page**](https://github.com/HHS/simpler-grants-gov/issues/576)**:** Enables all other users to access the search features through the user interface
* [**User Research Incentives**](https://github.com/HHS/simpler-grants-gov/issues/84)**:** Enables us to engage stakeholders for user testing of the new search functionality

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* **AuthN/AuthZ:** Authentication (AuthN) and Authorization (AuthZ) will be the focus of a subsequent deliverable, so the MVP is not expected to support any features that require users to be logged in.
* **Translating text of the NOFOs:** We will not be translating the full text of the NOFO as part of this or future deliverables.

### Not in scope

The following work will _not_ be completed as part of this deliverable:

* **Translation:** The UI will only be available in English for this first release
* **Personalization:** Because the MVP will not support a login experience, any personalized features that require authentication (e.g. saving searches) are explicitly descoped from this deliverable
* **Opportunity Listing Page:** The MVP will not include an opportunity listing page, instead the search results will directly link to the corresponding opportunity listing page on grants.gov. An updated opportunity listing page will be completed in its own 30k ft deliverable
* **Full Text Search:** The MVP is only expected to include (a subset of) filtering based on opportunity metadata that is already available in the existing grants.gov database, so searching the full text of the opportunity is explicitly de-scoped from this deliverable. This effort will not include a more complex search index such as Elasticsearch

### Open questions

<details>

<summary><strong>Does the metadata and the text of the opportunity need to be translated?</strong></summary>

We will determine if individual fields from the search results can be easily translated in this effort, but opportunity listings and all search results will _**not**_ be translated in this 30k ft deliverable.

</details>

<details>

<summary><strong>What metadata is currently available about each opportunity?</strong></summary>

Metadata is being determined in the [GET Opportunity 30k deliverable](https://github.com/HHS/simpler-grants-gov/issues/70). We plan to use publicly available data only. For example, `is_draft` state will not be used in this Search feature.

</details>

<details>

<summary>We should look into how it's currently done on grants.gov live</summary>

Notes:

* Talk to BPS to get more technical information on how the current search works
* Consider how filtering is done because it may be more difficult to consider
* Consider how we want to sort for relevance

</details>

## Integrations

### Translations

Does this milestone involve delivering any content that needs translation?

* No

If so, when will English-language content be locked? Then when will translation be started and completed?

* The translation process will be determined within the Translation Process 30k

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Search API:** Search functionality will be exposed via the API for the first time in this deliverable
* **Search UI:** Search functionality will be exposed via the user interface for the first time in this deliverable

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **API + Front-end:** This deliverable represents the first time the simpler.grants.gov front-end and API will be integrated in production

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* The search data and text will be shared for the first time on the site.

### Security considerations

Does this 30k ft deliverable expose any new attack vectors or expand the attack surface of the product?

* We are completing a security review in the Search API deliverable that should cover security considerations for this deliverable specification

If so, how are we addressing these risks?

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="423">Update</th><th>Notes</th></tr></thead><tbody><tr><td>4/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td>4/17/2024</td><td><ul><li>Removed “At least 1 user research participant has been compensated for their time” from DoD.</li><li>Reworded: “Code is deployed to main &#x26; PROD through our CI/CD pipeline” to “Code is merged into main and deployed to PROD using our CI/D pipeline”.</li><li>Added: “Our desired project metrics are captured and displayed in a public place” to DoD.</li><li>Removed: “Click-through-rate from search results to the opportunity listing” from proposed metrics.</li></ul></td><td>Updates discussed and decided on by the development team and P&#x26;D at the 30k review meeting on 4/17.</td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td>May 3, 2024</td><td>Any site downtime will generate automated notifications to project maintainers</td><td>There is a synthetic canary, documented internally in <a href="https://app.gitbook.com/s/v1V0jIH7mb7Yb3jlNrgk/engineering/security/logging-and-monitoring-sop#front-end">Logging and Monitoring SOP</a>, that emails the team if the site is not available.</td></tr><tr><td>April 30, 2024</td><td>Code is merged into <code>main</code> and deployed to PROD using our CI/D pipeline<br><br>Services are live in PROD (maybe behind feature flag)</td><td>The Search User Interface is available on production behind a feature flag: <a href="https://simpler.grants.gov/search?_ff=showSearchV0:true">https://simpler.grants.gov/search?_ff=showSearchV0:true</a></td></tr><tr><td>March 22, 2024</td><td>Users can search for opportunities by key word</td><td><ul><li>Set up single search input component in basic layout, allowing for searching across <code>opportunity_title</code>, <code>opportunity_number</code>, <code>agency</code>, <code>summary_description</code>, <code>assistance_listing_number</code>, and <code>program_title</code> — <a href="https://github.com/HHS/simpler-grants-gov/commit/8b0111ff0be2359262912b5ad4046174e9822597">https://github.com/HHS/simpler-grants-gov/commit/8b0111ff0be2359262912b5ad4046174e9822597</a> </li><li>Hook up <code>query</code> query parameter to pass key words to the API — <a href="https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833">https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833</a></li></ul></td></tr><tr><td>March 19, 2024</td><td>Users can filter search results by <em>at least one</em> structured field</td><td><ul><li>Add filter component UI — <a href="https://github.com/HHS/simpler-grants-gov/commit/7e3429825cba0c95a9e4aae776bfe49b955552f9">https://github.com/HHS/simpler-grants-gov/commit/7e3429825cba0c95a9e4aae776bfe49b955552f9</a></li><li>Hook up UI inputs to API — <a href="https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833">https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833</a> </li></ul><p>(…among other improvements to UI/API)</p></td></tr><tr><td>March 27, 2024</td><td>Users can sort search results by <em>at least</em> one structured field</td><td><ul><li>Hook up <code>sortBy</code> filter — <a href="https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833">https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833</a></li><li>Improve UI/layout of sort <code>select</code> — <a href="https://github.com/HHS/simpler-grants-gov/commit/cace7771e33b8dc33e0667da3fcea973e6aeddeb">https://github.com/HHS/simpler-grants-gov/commit/cace7771e33b8dc33e0667da3fcea973e6aeddeb</a></li></ul></td></tr><tr><td>March 19, 2024</td><td>All of the search features available in the UI are also available via the API, and vice versa</td><td><ul><li>Hook up rest of inputs to live API — <a href="https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833">https://github.com/HHS/simpler-grants-gov/commit/74c948042bb68b6fc03cde06f1ed012ab562d833</a></li></ul></td></tr><tr><td>March 15, 2024</td><td>Search criteria are reflected in the URL so that users can bookmark or share the link to the page with the results from that combination of criteria</td><td><ul><li>Setup query param management / writing to the URL — <a href="https://github.com/HHS/simpler-grants-gov/commit/5d50bc407e6a55cdf941dae7184a1113d7b9c297">https://github.com/HHS/simpler-grants-gov/commit/5d50bc407e6a55cdf941dae7184a1113d7b9c297</a></li></ul></td></tr><tr><td>March 22, 2024</td><td>Users can access the corresponding grants.gov page for an opportunity they find on simpler.grants.gov via link on the search results</td><td><ul><li>Format in search results — <a href="https://github.com/HHS/simpler-grants-gov/commit/ffb9b8fd1fa62aa8e3644915d164717170ef79fa">https://github.com/HHS/simpler-grants-gov/commit/ffb9b8fd1fa62aa8e3644915d164717170ef79fa</a></li></ul></td></tr><tr><td>March 8, 2024</td><td>Functionality can be hidden from users behind a URL-based feature flag</td><td><ul><li>Implement Feature Flags — <a href="https://github.com/HHS/simpler-grants-gov/pull/1236">https://github.com/HHS/simpler-grants-gov/pull/1236</a></li><li>Search Page feature flag — <a href="https://github.com/HHS/simpler-grants-gov/pull/1251">https://github.com/HHS/simpler-grants-gov/pull/1251</a></li><li>Put search page behind feature flag — <a href="https://github.com/HHS/simpler-grants-gov/pull/1452">https://github.com/HHS/simpler-grants-gov/pull/1452</a></li></ul></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
