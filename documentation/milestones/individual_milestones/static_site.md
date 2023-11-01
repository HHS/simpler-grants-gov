# Static Site for Simpler Grants.gov Project

| Field           | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| Document Status | Completed                                                       |
| Epic Link       | [Issue 62](https://github.com/HHS/simpler-grants-gov/issues/62) |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12)    |
| Product Owner   | Lucas Brown                                                     |
| Document Owner  | Billy Daly                                                      |
| Lead Developer  | Aaron Couch                                                     |
| Lead Designer   | Andy Cochran                                                    |

## Short description

Launch a simple site at simpler.grants.gov that provides static, informational content about the Simpler Grants.gov initiative.

## Goals

### Business description & value

The launch of a static site for the Simpler Grants.gov project represents the culmination of multiple internally focused deliverables and serves as a landing page where key stakeholders can access information about the project.

By sharing this information in a publicly accessible format and investing early in the infrastructure used to host it, this milestone aims to demonstrate the following value propositions:

- Raises awareness about the Simpler Grants.gov project, its priorities, and ongoing workstreams
- Establishes simpler.grants.gov as the primary location that stakeholders can visit for project updates and previews of deliverables for the Simpler Grants.gov project
- Proves the successful completion of technical milestones that enable faster development without sacrificing code quality or security
- Delivers an early win that both internal and external stakeholders can rally around, which helps build momentum and enthusiam for the project
- Facilitates a parallel approach to development, in which new features can be built and tested on `simpler.grants.gov` without risking or disrupting the existing functionality of legacy grants.gov

### User stories

- As a **full-time HHS staff member**, I want:
  - the site to be accessible to members of the public and the Federal government, so we can use it to share information about the project with both internal and external stakeholders.
  - the site to adopt modern branding and user interface (UI), so that stakeholders are excited to visit the page and can find the information they need more easily.
- As a **grantor**, I want:
  - to be able to access information about the Simpler Grants.gov project in a central location, so that I don't have to rely exclusively on email for updates about the project.
  - the site to be user friendly and easy to navigate, so that I don't have to spend a lot of time looking for information that is relevant to me.
- As a **prospective grant applicant**, I want:
  - the site to be user friendly and easy to navigate, so that I don't have to spend a lot of time looking for information that is relevant to me.
  - an opportunity to provide feedback or ask questions about the project, so that I can voice my concerns and help shape the direction of the project.
- As **maintainer of the project** I want:
  - most of the critical development infrastructure to be in place when we officially launch the site, so that we can deploy bug fixes or new features quickly once the site is live.
- As an **open source contributor**, I want:
  - the site to link to resources like the repository, chat, etc., so that I can easily learn where and how to participate in the project.

## Technical description

### Infrastructure Requirements

The infrastructure developed to deploy and host the site should balance:

- Code quality
- Security
- Delivery velocity
- Cost & maintenance

### User Experience Requirements

The design and structure of the site should balance:

- Usability
- Accessibility
- Site performance
- Brand identity

### Content Requirements

Process for drafting and updating the content of the site should balance:

- Speed & ease of content management
- Need for review and approval

### Definition of done

- [ ] The following infrastructure requirements are satisfied:
  - [ ] The code needed to build and deploy the site is merged to `main`
  - [ ] The site is built and hosted with the tools selected in the [Front-end Planning milestone](https://github.com/HHS/simpler-grants-gov/issues/49)
  - [ ] All code quality checks set up in the [Developer Tools milestone](https://github.com/HHS/simpler-grants-gov/issues/50) are passing
  - [ ] The resources required to deploy and host the site are provisioned programmatically using the framework established in the [Infrastructure-as-Code milestone](https://github.com/HHS/simpler-grants-gov/issues/123)
  - [ ] Code changes are deployed using the CI/CD pipeline set up in [the Front-end CI/CD milestone](https://github.com/HHS/simpler-grants-gov/issues/58)
- [ ] The following user experience (UX) requirements are satisfied:
  - [ ] Anyone can access a live version of the site at simpler.grants.gov
  - [ ] # The site adopts the UI principles and framework established in the [Foundational UI milestone](https://github.com/HHS/simpler-grants-gov/issues/60)
  - [ ] Anyone can access a live version of the site at beta.grants.gov
  - [ ] The site adopts the UI principles and framework established in the [Foundational UI milestone](https://github.com/HHS/simpler-grants-gov/issues/60)
  - [ ] The site is 508 compliant and satisfies the other guidelines outlined in the Accessibility Planning milestone
  - [ ] Web traffic data for the site is actively being collected by the framework implemented in the [Web Analytics milestone](https://github.com/HHS/simpler-grants-gov/issues/63)
  - [ ] Additional development tickets have been created for collecting other data needed to calculate the metrics below
- [ ] The following content requirements are satisfied:
  - [ ] All content is deployed to simpler.grants.gov
  - [ ] The content on the site has been been reviewed and approved by the relevant stakeholders within each workstream
  - [ ] The site also links to external resources related to the project (if they are available), including:
    - [ ] The legacy grants.gov site
    - [ ] The open source repository
    - [ ] The open source wiki
    - [ ] The open source chat
  - [ ] Stretch goal: The site provides a mechanism to collect stakeholder feedback or questions

### Proposed metrics for measuring goals/value/definition of done

1. Number of unique site visitors
2. Total number of site visits
3. Uptime service
4. [Lighthouse score](lighthouse) for the site
5. Deployment build time
6. Deployment/hosting costs
7. Number of visits to outbound links to the following external resources (once added to the site)
   - Open source repository
   - Open source wiki
   - Open source chat
8. Stretch: Number of form responses

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver [the Public Measurement Dashboard milestone](https://github.com/HHS/simpler-grants-gov/issues/65)

## Planning

### Assumptions & dependencies

<!-- Required -->

_What capabilities / milestones do we expect to be in place by the completion of work on this milestone?_

- [ ] **[Front-end Planning](https://github.com/HHS/simpler-grants-gov/issues/49):** Determines the language, framework, and deployment service used to build and host the site.
- [ ] **[Developer Tools](https://github.com/HHS/simpler-grants-gov/issues/50):** Establishes a suite of tools used to ensure the quality and security of the site codebase.
- [ ] **[beta.grants.gov Domain](https://github.com/HHS/simpler-grants-gov/issues/51):** Secures access to the `simpler.grants.gov` domain which is where the site will be hosted.
- [ ] **[Security Approval](https://github.com/HHS/simpler-grants-gov/issues/53):** Ensures that the site and the infrastructure that hosts it are comply with HHS security standards and practices.
- [ ] **[Infrastructure-as-Code](https://github.com/HHS/simpler-grants-gov/issues/123):** Programmatically provisions the resources needed to deploy and host this site.
- [ ] **[Front-end CI/CD](https://github.com/orgs/HHS/projects/12/views/3?pane=issue&itemId=31950276):** Sets up a CI/CD pipeline that will be used to test and publish code changes to the site.
- [ ] **[Foundational UI](https://github.com/HHS/simpler-grants-gov/issues/60):** Determines the UI framework that the site will adopt before launch.
- [ ] **[Web Analytics](https://github.com/HHS/simpler-grants-gov/issues/63):** Enables tracking key success metrics for this milestone, e.g. site traffic and number of unique visitors.

_Are there any notable capabilities / milestones do NOT we expect to be in place by the completion of work on this milestone?_

- [x] **Internationalization:** While there will be content delivered within this milestone that needs to be translated in the future, we do not expect to have a framework for managing translations set up by the time this milestone is delivered.
- [x] **CMS:** While in the long-term we may want to support a Content Management Service (CMS) that allows non-technical users to update and manage copy for the website, we do not expect a CMS to be selected and implemented when we launch this site.

### Open questions

<!-- Optional -->

- [x] None

### Not doing

<!-- Optional -->

_The following work will_ not _be completed as part of this milestone:_

1. **Translating site contents:** Translation of key documents will be covered in an upcoming milestone slotted for FY24 Q1 (Oct - Dec 2023)
2. **Legacy web analytics:** Updating the existing analytics recorded on legacy grants.gov in order to establish a baseline for comparing the site traffic for `simpler.grants.gov` will happen in a later milestone

## Integrations

### Translations

<!-- Required -->

_Does this milestone involve delivering any content that needs translation?_

Yes, the site contents will need to be translated.

_If so, when will English-language content be locked? Then when will translation be started and completed?_

The initial process for translation is slotted for release sometime in FY24 Q1 (Oct - Dec 2023).

### Services going into PROD for the first time

<!-- Required -->

_This can include services going into PROD behind a feature flag that is not turned on._

- **Static Site:** This milestone represents the official launch of the static site
- **simpler.grants.gov Domain:** The static site is the first service to officially use the `simpler.grants.gov` domain
- **Stakeholder Feedback Form:** This is the first time we're collecting feedback directly from stakeholders on `simpler.grants.gov`
- **Web Analytics:** This will most likely be the first service for which we are configuring web analytics

### Services being integrated in PROD for the first time

<!-- Required -->

_Are there multiple services that are being connected for the first time in PROD?_

- **Static Site + Feedback Form:** The feedback form should be accessible directly from the site, preferably embedded directly on the page
- **Static Site + Web Analytics:** All of the public pages on the static site should be configured to track web analytics
- **Static Site + Communications Platforms:** The static site should link to the relevant communication platforms that are available at the time of launch

### Data being shared publicly for the first time

<!-- Required -->

_Are there any fields being shared publicly that have never been shared in PROD before?_

- No, the content of the static site in this milestone will be limited to general information about the Simpler Grants.gov project. It does not include exposing any production data from the new simpler.grants.gov data model.

### Security considerations

<!-- Required -->

_Does this milestone expose any new attack vectors or expand the attack surface of the product?_

- **Deployment Services:** Automating our deployment process using a CI/CD platform exposes the deployment process as a potential attack vector if the deployment secrets/tokens are compromised or if malicious code through a supply chain attack.
- **Form Submissions:** While the majority of the site content will be static, accepting user input through a feedback form does expose a potential attack vector.

_If so, how are we addressing these risks?_

- **Security Approval:** Before the official launch of the static site to the public, we will be reviewing our infrastructure and code security practices with the HHS team to ensure that they adhere to HHS standards.
- **Developer Tools:** As part of the Developer Tools milestone, the team is setting up a series of tools that will enforce certain code quality standards and security checks. These include things like secrets management, code linting, dependency monitoring, etc.
- **Form Submissions:** The implementation plan for form submissions will evaluate and consider common security practices for validating and sanitizing user input. Form submissions will also likely be stored in a system that is separate from the production database with grant data.

<!-- Links -->

[lighthouse]: https://developer.chrome.com/en/docs/lighthouse/performance/performance-scoring/
