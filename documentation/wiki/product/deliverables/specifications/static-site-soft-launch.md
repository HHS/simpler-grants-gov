---
description: Deploy a static site with information about the Simpler.Grants.gov initiative.
---

# Static site soft launch

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Done</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/62">Issue 62</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="static-site-soft-launch.md#overview">Overview</a></p><ul><li><a href="static-site-soft-launch.md#business-value">Business value</a></li><li><a href="static-site-soft-launch.md#user-stories">User stories</a></li></ul></li><li><p><a href="static-site-soft-launch.md#technical-description">Technical description</a></p><ul><li><a href="static-site-soft-launch.md#definition-of-done">Definition of done</a></li><li><a href="static-site-soft-launch.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="static-site-soft-launch.md#assumptions-and-dependencies">Dependencies and assumptions</a></li><li><p><a href="static-site-soft-launch.md#logs">Logs</a></p><ul><li><a href="static-site-soft-launch.md#change-log">Change log</a></li><li><a href="static-site-soft-launch.md#implementation-log">Implementation log</a></li></ul></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Deploy a static site to a public-facing URL that contains information about the Simpler Grants.gov initiative
* **Why:** Proves the successful completion of several front-end technical milestones and builds key infrastructure for future UI improvements
* **Who**
  * Internal development team
  * Internal HHS stakeholders

### Business value

The launch of a static site for the Simpler Grants.gov project represents the culmination of multiple internally focused deliverables and serves as a landing page where key stakeholders can access information about the project.

By sharing this information in a publicly accessible format and investing early in the infrastructure used to host it, this deliverable aims to demonstrate the following value propositions:

* Establishes simpler.grants.gov as the primary location that stakeholders can visit for project updates and previews of deliverables for the Simpler Grants.gov project
* Proves the successful completion of technical deliverables that enable faster development without sacrificing code quality or security
* Delivers an early win that both internal and external stakeholders can rally around, which helps build momentum and enthusiam for the project
* Facilitates a parallel approach to development, in which new features can be built and tested on `simpler.grants.gov` without risking or disrupting the existing functionality of legacy grants.gov

### User stories

* As a **full-time HHS staff member**, I want:
  * the site to be accessible to members of the public and the Federal government, so we can use it to share information about the project with both internal and external stakeholders.
  * the site to adopt modern branding and user interface (UI), so that stakeholders are excited to visit the page and can find the information they need more easily.
* As a **grantor**, I want:
  * to be able to access information about the Simpler Grants.gov project in a central location, so that I don't have to rely exclusively on email for updates about the project.
  * the site to be user friendly and easy to navigate, so that I don't have to spend a lot of time looking for information that is relevant to me.
* As a **prospective grant applicant**, I want:
  * the site to be user friendly and easy to navigate, so that I don't have to spend a lot of time looking for information that is relevant to me.
  * an opportunity to provide feedback or ask questions about the project, so that I can voice my concerns and help shape the direction of the project.
* As **maintainer of the project** I want:
  * most of the critical development infrastructure to be in place when we officially launch the site, so that we can deploy bug fixes or new features quickly once the site is live.
* As an **open source contributor**, I want:
  * the site to link to resources like the repository, support email, etc., so that I can easily learn where and how to participate in the project.

## Technical description

### Infrastructure Requirements

The infrastructure developed to deploy and host the site should balance:

* Code quality
* Security
* Delivery velocity
* Cost & maintenance

### User Experience Requirements

The design and structure of the site should balance:

* Usability
* Accessibility
* Site performance
* Brand identity

### Content Requirements

Process for drafting and updating the content of the site should balance:

* Speed & ease of content management
* Need for review and approval

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

* [x] The following infrastructure requirements are satisfied:
  * [x] &#x20;The code needed to build and deploy the site is merged to `main`
  * [x] &#x20;The site is built and hosted with the tools selected in the [Front-end Planning deliverable](https://github.com/HHS/simpler-grants-gov/issues/49)
  * [x] &#x20;All code quality checks set up in the [Developer Tools deliverable](https://github.com/HHS/simpler-grants-gov/issues/50) are passing
  * [x] &#x20;The resources required to deploy and host the site are provisioned programmatically
  * [x] &#x20;Code changes are deployed using a CI/CD pipeline
* [x] &#x20;The following user experience (UX) requirements are satisfied:
  * [x] &#x20;Anyone can access a live version of the site at simpler.grants.gov
  * [x] &#x20;The site adopts the UI principles and framework established
  * [x] &#x20;Anyone can access a live version of the site at simpler.grants.gov
  * [x] &#x20;The site has completed a 508 compliance reiview
  * [x] &#x20;Web traffic data for the site is actively being collected
  * [x] &#x20;Additional development tickets have been created for collecting other data needed to calculate the metrics below
* [x] &#x20;The following content requirements are satisfied:
  * [x] &#x20;All content is deployed to simpler.grants.gov
  * [x] &#x20;The content on the site has been been reviewed and approved by the relevant stakeholders within each workstream
  * [x] &#x20;The site also links to external resources related to the project (if they are available), including:
    * [x] &#x20;The legacy grants.gov site
    * [x] &#x20;The open source repository

### Proposed metrics

* Number of unique site visitors
* Total number of site visits
* Uptime service
* [Lighthouse score](../../../../deliverables/individual\_deliverables/lighthouse) for the site
* Deployment build time
* Deployment/hosting costs
* Number of visits to outbound links to the following external resources (once added to the site)
  * Open source repository
  * grants.gov

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver [the Public Measurement Dashboard deliverable](https://github.com/HHS/simpler-grants-gov/issues/65).

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**by the end of**_ work on this deliverable?

* [x] &#x20;[**Front-end Planning**](https://github.com/HHS/simpler-grants-gov/issues/49)**:** Determines the language, framework, and deployment service used to build and host the site.
* [x] &#x20;[**Developer Tools**](https://github.com/HHS/simpler-grants-gov/issues/50)**:** Establishes a suite of tools used to ensure the quality and security of the site codebase.
* [x] &#x20;[**simpler.grants.gov Domain**](https://github.com/HHS/simpler-grants-gov/issues/51)**:** Secures access to the `simpler.grants.gov` domain which is where the site will be hosted.
* [x] &#x20;[**Security Approval**](https://github.com/HHS/simpler-grants-gov/issues/53)**:** Ensures that the site and the infrastructure that hosts it are comply with HHS security standards and practices.
* [x] &#x20;[**Infrastructure-as-Code**](https://github.com/HHS/simpler-grants-gov/issues/123)**:** Programmatically provisions the resources needed to deploy and host this site.
* [x] &#x20;[**Front-end CI/CD**](https://github.com/orgs/HHS/projects/12/views/3?pane=issue\&itemId=31950276)**:** Sets up a CI/CD pipeline that will be used to test and publish code changes to the site.
* [x] &#x20;[**Foundational UI**](https://github.com/HHS/simpler-grants-gov/issues/60)**:** Determines the UI framework that the site will adopt before launch.
* [x] &#x20;[**Web Analytics**](https://github.com/HHS/simpler-grants-gov/issues/63)**:** Enables tracking key success metrics for this deliverable, e.g. site traffic and number of unique visitors.

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* **Internationalization:** While there will be content delivered within this deliverable that needs to be translated in the future, we do not expect to have a framework for managing translations set up by the time this deliverable is delivered.
* **CMS:** While in the long-term we may want to support a Content Management Service (CMS) that allows non-technical users to update and manage copy for the website, we do not expect a CMS to be selected and implemented when we launch this site.

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* **Translating site contents:** Site translations will be the focus of a future deliverable.
* **Legacy web analytics:** Updating the existing analytics recorded on legacy grants.gov in order to establish a baseline for comparing the site traffic for `simpler.grants.gov` will happen in a later deliverable.

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

* Yes, the site contents will need to be translated.

If so, when will English-language content be locked? Then when will translation be started and completed?

* The initial process for translation is slotted for release in a future deliverable.

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Static Site:** This deliverable represents the official launch of the static site
* **simpler.grants.gov Domain:** The static site is the first service to officially use the `simpler.grants.gov` domain
* **Stakeholder Feedback Form:** This is the first time we're collecting feedback directly from stakeholders on `simpler.grants.gov`
* **Web Analytics:** This will most likely be the first service for which we are configuring web analytics

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* **Static Site + Feedback Form:** The feedback form should be accessible directly from the site, preferably embedded directly on the page
* **Static Site + Web Analytics:** All of the public pages on the static site should be configured to track web analytics
* **Static Site + Communications Platforms:** The static site should link to the relevant communication platforms that are available at the time of launch

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* No, the content of the static site in this deliverable will be limited to general information about the Simpler Grants.gov project. It does not include exposing any production data from the new simpler.grants.gov data model.

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

* **Deployment Services:** Automating our deployment process using a CI/CD platform exposes the deployment process as a potential attack vector if the deployment secrets/tokens are compromised or if malicious code through a supply chain attack.
* **Form Submissions:** While the majority of the site content will be static, accepting user input through a feedback form does expose a potential attack vector.

If so, how are we addressing these risks?

* **Security Approval:** Before the official launch of the static site to the public, we will be reviewing our infrastructure and code security practices with the HHS team to ensure that they adhere to HHS standards.
* **Developer Tools:** As part of the Developer Tools deliverable, the team is setting up a series of tools that will enforce certain code quality standards and security checks. These include things like secrets management, code linting, dependency monitoring, etc.
* **Form Submissions:** The implementation plan for form submissions will evaluate and consider common security practices for validating and sanitizing user input. Form submissions will also likely be stored in a system that is separate from the production database with grant data.

## Logs

### Change log

Major updates to the content of this page will be added here.

<table data-full-width="true"><thead><tr><th width="137">Date</th><th width="281">Update</th><th>Notes</th></tr></thead><tbody><tr><td>3/5/2024</td><td>Added change log and implementation log</td><td>This is part of the April onsite follow-up</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

### Implementation log

Use this section to indicate when acceptance criteria in the "Definition of done" section have been completed, and provide notes on steps taken to satisfy this criteria when appropriate.

<table data-full-width="true"><thead><tr><th width="138">Date</th><th width="284">Criteria completed</th><th>Notes</th></tr></thead><tbody><tr><td>3/5/2024</td><td>All criteria</td><td>All criteria were previously marked as completed in GitHub when 30k was delivered in September of 2023</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
