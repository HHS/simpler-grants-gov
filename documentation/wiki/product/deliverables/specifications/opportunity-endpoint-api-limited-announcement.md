---
description: >-
  Deploy an alpha phase API endpoint that shares public information about every
  opportunity on grants.gov.
---

# Opportunity endpoint API limited announcement

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>In Progress</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td>[TBD]</td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="opportunity-endpoint-api-limited-announcement.md#overview">Overview</a></p><ul><li><a href="opportunity-endpoint-api-limited-announcement.md#business-value">Business value</a></li><li><a href="opportunity-endpoint-api-limited-announcement.md#user-stories">User stories</a></li></ul></li><li><p><a href="opportunity-endpoint-api-limited-announcement.md#technical-description">Technical description</a></p><ul><li><a href="opportunity-endpoint-api-limited-announcement.md#definition-of-done">Definition of done</a></li><li><a href="opportunity-endpoint-api-limited-announcement.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="opportunity-endpoint-api-limited-announcement.md#assumptions-and-dependencies">Dependencies and assumptions</a></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Deploy an API endpoint in an alpha phase that shares public information about every opportunity on grants.gov.
* **Why:** Enables us to begin collecting feedback from a subset of API consumers and start improving functionality for the future public announcement.
* **Who**
  * Subset of system-to-system users&#x20;
  * GrantSolutions&#x20;
  * OpenGrants.io&#x20;
  * USDR

### Business value

#### Problem

Currently, there is a lack of comprehensive understanding regarding issues with the data model and the existing API. Although insights and assumptions have been gathered through interviews with API consumers, we lack clarity on how consumers are utilizing the API and the available data.

#### Value

Announcing to a small group of API consumers will allow us to better understand where we can add improvements for the release to a larger audience. This approach enables us to get insights into the onboarding processes, infrastructure, communication channels, and user experience so that when we release to a broader audience there is a smooth transition. We will also be able to implement targeted improvements during the beta API release.&#x20;

#### Goals

Within this effort, we aim to...&#x20;

* Collect learnings to optimize onboarding and API documentation for the future release
* Gather metrics and feedback on API usage for a small subset of API consumers
* Establish a structured process for receiving and acting upon user feedback for the API

### User stories

* As a **HHS staff member**, I want to:&#x20;
  * prioritize transparency with the public and the Federal government, so that we can build trust and share information openly and often.&#x20;
  * provide an API that is usable by API consumers so that it effectively addresses real-world problems and provides valuable solutions.&#x20;
* As a **member of the HHS contractor team**, I want to:
  * gather insights into the usage patterns ofthe API and assess the onboarding experience, so that I can identify areas for improvement and ensure a seamless and user-friendly public release and future scalability.&#x20;
  * analyze API usage so that we can improve the quality and the relevance of the API.
* As a **public** **API consumer**, I want to:
  * have a clear and easily usable API so that I can easily understand how to integrate and use the API in my own systems.&#x20;
  * have a clear onboarding process with clear instructions so that I can quickly start using the API without unnecessary delays.&#x20;

## Technical description

**API development**

* Add production URL
* The authentication component currently only includes one key in the request, which is hardcoded in the API. We could improve this by allowing for a list of keys so that users can have their own authorization key and we can trace it back to the user. Future strategy: authentication is where users have to tell us a little more information about themselves.&#x20;

**Infrastructure**

* TO DO

**API documentation and user research**

* API documentation
* User interviews with API consumers
* Establish a process for regular touch-points with API consumers
* Feedback on experience for alpha API consumers that will be incorporated before a larger public announcement:&#x20;
  * communication channels
  * getting feedback on the onboarding process
  * feedback on API documentation

### Definition of done

**Must have**

The following requirements are satisfied:

* [ ] &#x20;The code needed to build and deploy the site is merged to `main`
* [ ] The API is live at the chosen URL
* [ ] Developers can learn how to interact with the API by referencing the API documentation
* [ ] The endpoint is available when legacy grants.gov experiences planned or unplanned downtime, maintenance, and upgrades
* [ ] API authentication component updated to allow for a list of keys
* [ ] Public communication channels for API consumers have been established
* [ ] Analysis of API usage with selected audience
* [ ] Clear instructions for straightforward onboarding experience in Slack, Github, Gitbook, and any other tools selected.&#x20;
* [ ] Public API documentation updated and accessible to the API consumers
* [ ] Approach for gathering regular feedback has been established
* [ ] Recommendations and feedback are incorporated into the future [\[30k\]: API public announcement](broken-reference)&#x20;

**Static site**&#x20;

* [ ] Simpler.grants.gov site has been approved by relevant stakeholders using out internal review process
* [ ] Corresponding approved front-end updates have been made to the site

**Communications**

* [ ] An email has been sent out to the subset of public API consumers with whom we plan to gather feedback from
* [ ] Key internal stakeholders (e.g. help desk staff, HHS leadership) have been notified when the email is sent out so that they can prepare for questions from public stakeholders
* [ ] Help Desk is notified and trained for any potential support issues that may come through

<!---->

* **Nice to have**
  *

### Proposed metrics

1. Number of unique users accessing API
2. Total number of API calls made
3. Error rate of API calls
4. Uptime of service
5. Deployment/hosting costs
6. Average response time

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* GET opportunities 30k is completed so that we have production connection
* Parts of the onboarding experience for open source contributors that is established in the \[30k]: Open source onboarding process could be reused for this effort to reduce the effort and create a similar experience.&#x20;

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* The Participant Advisory Council may not be in place when this is announced and there may be a group of users that could participate in the PAC.&#x20;

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* Rate-limiting
* This effort will have a basic authentication method through key management. A more elegant authentication method where users provide more information about themselves for increase security measures will be handled in the [\[30k\]: API public announcement](broken-reference).&#x20;

### Open questions

<details>

<summary>We are assuming that the onboarding experience for open source contributors and consumers of the API will be similar in certain ways but a different experience. For example, the Slack channels will be different, API documentation will be different. However, both sets of users will use the same tools and similar processes. Does that align with HHS' understanding? </summary>



</details>

<details>

<summary>What platform(s) do we want to use to view our service metrics?</summary>



</details>

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

1. No

If so, when will English-language content be locked? Then when will translation be started and completed?

1. n/a

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

1. \[to be added]

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

1. No, security review and production connection was established in the [\[30k\]: GET opportunities.](get-opportunities.md)&#x20;

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

1. No, production connection was established in the [\[30k\]: GET opportunities.](get-opportunities.md)

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

1. There is the risk that API consumers will use the API in their production systems. This could cause problems for their own systems and erode trust with the Simpler Grants team.&#x20;

If so, how are we addressing these risks?

1. We will communicate that this is an alpha release and we do not recommend connection to production systems.&#x20;
