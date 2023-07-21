# Static Site for Grants Equity Project

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Document Status | Accepted                                                             |
| Epic Link       | [Issue 62](https://github.com/HHS/grants-api/issues/62)              |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-09-20                                                           |
| Product Owner   | Lucas Brown                                                          |
| Document Owner  | Billy Daly                                                           |
| Lead Developer  | Aaron Couch                                                          |
| Lead Designer   | Andy Cochran                                                         |

## Short description

Launch a simple site at beta.grants.gov that provides static, informational content about the Grants Equity initiative, which includes both the Grants.gov Modernization and NOFO Transformation workstreams.

## Goals

### Business description & value

The launch of a static site for the Grants Equity project represents the culmination of multiple internally focused deliverables and serves as a landing page where key stakeholders can access information about the project. 

By sharing this information in a publicly accessible format and investing early in the infrastructure used to host it, this milestone aims to demonstrate the following value propositions:

- Raises awareness about the Grants Equity project, its priorities, and ongoing workstreams
- Establishes beta.grants.gov as the primary location that stakeholders can visit for project updates and previews of deliverables from each of the workstreams
- Proves the succesful completion of technical milestones that enable faster development without sacrificing code quality or security
- Delivers an early win that both internal and external stakeholders can rally around, which helps build momentum and enthusiam for the project

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
  - [ ] The site is built and hosted with the tools selected in the [Front-end Planning milestone](https://github.com/HHS/grants-equity/issues/49)
  - [ ] All code quality checks set up in the [Developer Tools milestone](https://github.com/HHS/grants-equity/issues/50) are passing
  - [ ] The resources required to deploy and host the site are provisioned programmatically using the framework established in the [Infrastructure-as-Code milestone](https://github.com/HHS/grants-equity/issues/123)
  - [ ] Code changes are deployed using the CI/CD pipeline set up in [the Front-end CI/CD milestone](https://github.com/HHS/grants-equity/issues/58)
- [ ] The following user experience (UX) requirements are satisfied:
  - [ ] Anyone can access a live version of the site at beta.grants.gov
  - [ ] The site adopts the UI principles and framework established in the [Foundational UI milestone](https://github.com/HHS/grants-equity/issues/60)
  - [ ] The site is 508 compliant and satisfies the other guidelines outlined in the Accessibility Planning milestone
- [ ] The following content requirements are satisfied:
  - [ ] The site contains information about both the NOFO Transformation and Grants.gov Modernization workstreams
  - [ ] The content on the site has been been reviewed and approved by the relevant stakeholders within each workstream
  - [ ] The site also links to external resources related to the project, including:
    - [ ] The legacy grants.gov site
    - [ ] The open source repository
    - [ ] The open source wiki
    - [ ] The open source chat
  - [ ] Stretch goal:The site provides a mechanism to collect stakeholder feedback or questions

### Proposed metrics for measuring goals/value/definition of done

1. Number of unique site visitors
2. Total number of site visits
3. Number of form responses
4. Uptime service
5. [Lighthouse score](lighthouse) for the site
6. Deployment build time

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver [the Public Measurement Dashboard milestone](../milestone_short_descriptions.md#public-measurement-dashboards)

## Planning

### Assumptions & dependencies
<!-- Required -->

*What capabilities / milestones do we expect to be in place at the beginning of work on this milestone?*

- [ ] **Front-end Planning:** Determines the language, framework, and deployment service used to build and host the site.
- [ ] **Developer Tools:** Establishes a suite of tools used to ensure the quality and security of the API codebase.
- [ ] **beta.grants.gov Domain:** Secures access to the `beta.grants.gov` domain which is where the site will be hosted.
- [ ] **Authority to Operate (ATO):** Ensures that the site and the infrastructure that hosts it are comply with the Software Security Plan for the legacy grants.gov site.
- [ ] **Infrastructure-as-Code:** Programmatically provisions the resources needed to deploy and host this site.
- [ ] **Front-end CI/CD:** Sets up a CI/CD pipeline that will be used to test and publish code changes to the site.
- [ ] **Foundational UI:** Determines the UI framework that the site will adopt before launch.
- [ ] **Web Analytics:** Enables tracking key success metrics for this milestone, e.g. site traffic and number of unique visitors.

*Are there any notable capabilities / milestones do NOT we expect to be in place at the beginning of work on this milestone?*

- [x] **Internationalization:** While there will be content delivered within this milestone that needs to be translated in the future, we do not expect to have a framework for managing translations set up by the time this milestone is delivered.
- [x] **CMS:** While in the long-term we may want to support a Content Management Service (CMS) that allows non-technical users to update and manage copy for the website, we do not expect a CMS to be selected and implemented when we launch this site.

### Open questions
<!-- Optional -->

- [x] None

### Not doing
<!-- Optional -->

*The following work will* not *be completed as part of this milestone:*

1. **Translating onboarding documents:** Translation of key documents will be covered in an upcoming milestone
2. **Legacy web analytics:** Updating the existing analytics recorded on legacy grants.gov in order to establish a baseline for comparing the site traffic for `beta.grants.gov` will happen in a later milestone

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

Yes, the site contents will need to be translated.

*If so, when will English-language content be locked? Then when will translation be started and completed?*

Timeline and strategy for translation is still TBD.

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

- **Static Site:** This milestone represents the official launch of the static site
- **beta.grants.gov Domain:** The static site is the first service to officially use the `beta.grants.gov` domain
- **Stakeholder Feedback Form:** This is the first time we're collecting feedback directly from stakeholders on `beta.grants.gov`
- **Web Analytics:** This will most likely be the first service for which we are configuring web analytics

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

- **Static Site + Feedback Form:** The feedback form should be accessible directly from the site, preferably embedded directly on the page
- **Static Site + Web Analytics:** All of the public pages on the static site should be configured to track web analytics
- **Static Site + Communications Platforms:** The static site should link to the relevant communication platforms that are available at the time of launch

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

- No, the content of the static site in this milestone will be limited to informational about the project or about the NOFO prototypes that have already been published on legacy grants.gov. It does not include exposing any production data from the new NOFO data model.

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

- **Deployment Services:** Automating our deployment process using a CI/CD platform exposes the deployment process as a potential attack vector if the deployment secrets/tokens are compromised or if malicious code through a supply chain attack.
- **Form Submissions:** While the majority of the site content will be static, accepting user input through a feedback form does expose a potential attack vector.

*If so, how are we addressing these risks?*

- **Authority to Operate (ATO):** Before the official launch of the static site to the public, we will be reviewing our infrastructure and code security practices with the HHS team to ensure that they adhere to the Software Security Plan (SSP) for legacy grants.gov and are covered by the existing ATO.
- **Developer Tools:** As part of the Developer Tools milestone, the team is setting up a series of tools that will enforce certain code quality standards and security checks. These include things like secrets management, code linting, dependency monitoring, etc.
- **Form Submissions:** The implementation plan for form submissions will evaluate and consider common security practices for validating and sanitizing user input. Form submissions will also likely be stored in a system that is separate from the production database with grant data.

<!-- Links -->
[lighthouse]: https://developer.chrome.com/en/docs/lighthouse/performance/performance-scoring/
