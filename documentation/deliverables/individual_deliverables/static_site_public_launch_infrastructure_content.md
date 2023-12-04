# Static site public launch: infrastructure and content

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Document status    | Completed                                                         |
| Deliverable ticket | [Issue 692](https://github.com/HHS/simpler-grants-gov/issues/692) |
| Roadmap dashboard  | [Product Roadmap](https://github.com/orgs/HHS/projects/12)        |
| Product owner      | Lucas Brown                                                       |
| Document owner     | Billy Daly                                                        |
| Lead developer     | Aaron Couch                                                       |
| Lead designer      | Andy Cochran                                                      |


## Short description
<!-- Required -->

- **What:** We want to make a series of updates to the content and the infrastructure to the static site so that we are prepared to launch to a wider audience publicly and effectively communicate the project's goals, ways of working, and ongoing efforts.  
- **Why:** Continues to improve front-end infrastructure, demonstrate ongoing value both internally and publicly, and begins to build public excitement for the Simpler Grants.gov initiative. These updates underscore our agile methodology of releasing often, even with minimal updates. We also want to ensure that our site can handle an increase in traffic. 
- **Who:** The site will be announced directly with a small group of applicants, grantors, and internal stakeholders. These include: 
    - Federal Demonstration Partnership (mostly applicants)
    - S2S Federal User Group (grantors) 
    - Grantor S2S CGMO (Grants Management Officers and others within HHS)
    - Internal content managers

## Goals

### Business description & value
<!-- Required -->
**Problem statement:** In our initial static site release, we released quickly to get learnings and release iteratively. We have limited content on our site that does not properly communicate enough about our project to the public. We also have room for improvement on the infrastructure and operations so that we can confidently handle more traffic.

**Value:** We want to build on our initial release and enhance the site to provide a more comprehensive communication about our project's efforts, ongoing initiatives, and avenues for public involvement. We also aim to validate and reinforce our infrastructure and operations, ensuring they are robust enough to effectively handle the anticipated surge in site traffic. 

This allows us to continue to deliver iteratively, improve the site's infrastructure for sustained maintenance, and communicate our project vision, principles, and the way we work more clearly to anyone coming to the site.

This effort allows us to...

- Begin sharing simpler.grants.gov with a targeted set of public stakeholders
- Develop a communication strategy for future stakeholder engagement
- Create the systems and processes needed to ensure the site remains available under heavier traffic

### User stories
<!-- Required -->

- As an **HHS staff member**, I want:
  - to approve the content on the site before we share it with the public, so that I know what information will be visible to external stakeholders.
  - to know when I can share the site publicly, so that I can direct key stakeholders to a centralized location where they can learn more about the Simpler.Grants.gov initiative.
  - to have a communications strategy for stakeholder engagement, so that we have clear expectations about which groups will receive updates on the Simpler.Grants.gov initiative and can review proposed messaging to those groups.
  - clear and concise content that effectively communicates our project's goals, vision, and way of working to the public. This user story is essential to ensure that we uphold our commitment to transparency, fostering open communication and alignment with our overarching project objectives.
- As an **internal developer**, I want:
  - to be notified when the site goes down, so that I can work to troubleshoot the issue and minimize downtime.
  - the front-end infrastructure to handle the expected traffic with limited/no performance degradation, so that the site remains available and responsive after the launch.
- As a **site visitor**, I want:
  - the site to load quickly when I visit it, so that I don't have to wait a long time to access the information I'm looking for.
  - there to be minimal planned or unplanned downtime, so that I can trust the new Simpler.Grants.gov site will be reliable when I use it to apply for grants.

## Technical description

### Content updates

Prior to the public launch of the site, update the content to include:

- Summary of user research findings that have informed our product roadmap
- Description of our process and approach to building simpler.grants.gov
- Summaries of upcoming deliverables in the roadmap
- More targeted calls-to-action for site visitors

These content updates should be approved following the content review process outlined in our wiki.

### Infrastructure improvements

The focus of infrastructure improvements for this deliverable should be on changes that will help maintain the responsiveness and availability of the site as traffic increases. While the initial public announcement of the site will be targeted to an audience of around 1,000 users, we should should have a plan in place that allows us to easily support increases in site traffic.

In particular, it would be helpful to review our approach to the following:

- Employing static site generation (SSG) when possible
- Caching the site via a content delivery network (CDN)
- Load balancing and/or proxying requests
- Auto-scaling infrastructure resources based on volume of traffic
- Other strategies as recommended by the engineering team

### Incident response

This deliverable also involves adopting or updating a set of systems and procedures to support with incident response in the event that the site experiences downtime.

In particular, it would be helpful to review our approach to the following:

- **Systems**
  - Heartbeat monitoring of internal services and public urls to ensure that the website is live and publicly accessible
  - Automated notifications when:
    - services are down
    - 4xx or 5xx requests reach a certain threshold
    - resources reach a certain usage threshold or are auto-scaled
  - Logging capabilities (e.g. search, filtering) and retention policies to assist with troubleshooting
- **Procedures**
  - Documented incident response plan with steps and roles identified
  - Documented plan for receiving and responding to alerts
  - Staff trainings, tabletop and/or dry-runs for common types of incidents

### Communication strategy

The main communication output needed for this deliverable is an email campaign that is sent to the people with whom we plan to share the site.

An additional stretch goal is to develop a communications plan that outlines future plans for stakeholder engagement about the Simpler.Grants.gov initiative. This plan should answer the following questions:
  - Which stakeholder groups are we planning to engage?
  - Who is responsible for managing the relationship with each group?
  - What is the primary channel and cadence for those communications?

Both the initial email communication and the communication plan should be reviewed and approved by key stakeholders in the recurring communications meetings.

### Email subscription mechanism

Another goal for this deliverable is to adopt a service that allows site visitors to subscribe to a mailing list to receive updates about the Simpler.Grants.gov initiative. As part of this deliverable the team should answer the following questions:

- Which email marketing provider will we use for email-based communications?
- How will visitors submit their information to be added to a mailing list for Simpler.Grants.gov communications?

### Definition of done
<!-- Required -->

#### Must have

- [ ] Basic requirements
  - [ ] Code is deployed to main & PROD through our CI/CD pipeline
  - [ ] Services are live in PROD (may be behind feature flag)
  - [x] All new services have passed a security review (as needed)
  - [x] All new services have completed a 508 compliance review (as needed)
  - [ ] Data needed for metrics is actively being captured in PROD
  - [ ] Key architectural decisions made about this deliverable are documented publicly (as needed)
- [ ] Functional requirements
  - [ ] The static site has been updated with content approved by internal stakeholders
  - [ ] The front-end infrastructure can handle site traffic of up to 1,000 concurrent users
  - [ ] Engineering staff are notified when the site goes down
  - [ ] Engineering staff have been trained on a documented incident response plan that describes a set of actions to take when the site goes down
- [ ] Communications requirements
  - [ ] An email has been sent out to the subset of public stakeholders with whom we plan to share the static site
  - [ ] Key internal stakeholders (e.g. help desk staff, HHS leadership) have been notified when the email is sent out so that they can prepare for questions from public stakeholders
  - [ ] Help Desk is notified and trained for any potential support issues that may come through
  - [ ] Site visitors can subscribe to mailing list to receive updates about the Simpler.Grants.gov initiative

#### Nice to have

- [ ] A longer-term stakeholder engagement plan has been drafted that describes future phases of engagement
- [ ] Internal stakeholders can preview a live version of content changes before they are visible to everyone on simpler.grants.gov
- [ ] Site visitors can sign up for user research opportunities
- [ ] Tickets and/or documentation have been created that describe the infrastructure changes needed to support future site traffic at the following levels:
    - [ ] 10,000 users
    - [ ] 100,000 users
    - [ ] 1 million users

### Proposed metrics for measuring goals/value/definition of done
<!-- Required -->

1. Number of unique site visitors
2. Total number of site visits
3. Total number of visits per page
4. Total number of visits to outbound links to external resources
5. Site availability
6. [Lighthouse score](lighthouse) for the site
7. Deployment build time
8. Deployment/hosting costs
9. Number of visitors who subscribe to the mailing list

### Destination for live updating metrics
<!-- Required -->

Page on the public wiki with these metrics or a link to our page on https://analytics.usa.gov/ **Note:** This will likely change once we deliver [the public measurement dashboard](https://github.com/HHS/simpler-grants-gov/issues/65)

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- **[Static site soft launch](https://github.com/HHS/simpler-grants-gov/issues/62):** Delivered the following functionality that is needed by this deliverable:
  - **Front-end CI/CD:** Enables us to run a series of code quality and security checks and deploy front-end code automatically
  - **Foundational UI:** Allows us to continue to make site updates using a consistent design system and set of UI components
  - **Domain access:** Secured the simpler.grants.gov where the public site will be hosted

What functionality do we expect to be in place by ***the end*** of work on this deliverable?

- **Communications strategy:** Allows us to create a schedule for future release announcements and estimate site traffic

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- **Content management:** A more formal content management process will be defined in its own 30k deliverable.
- **Translation process:** Both translations and internationalization are being worked on in a separate 30k deliverable for static site improvements.
- **Feedback mechanism:** A feedback mechanism will be worked on in a future 30k deliverable alongside the translation process.

### Open questions
<!-- Optional -->

#### Who is the audience for the initial public release and what is the estimated size of that audience?

The initial audience will primarily be a set of federal stakeholders and system-to-system (S2S) users who currently use grants.gov often and who will want to stay up to date about new features being tested on simpler.grants.gov.

This initial group is estimated to be around 1,000 stakeholders, but the communications plan will likely involve sharing the site with successively larger groups of public stakeholders shortly afterward. As a result, we'll want to plan for infrastructure updates needed to support site traffic at multiple levels (e.g. 1k users, 10k users, 100k users, etc.)

#### What are the expectations about site availability, responsiveness, and traffic?

We have not defined explicit SLAs for site availability or responsiveness yet, and proposing a set of SLAs is one of the acceptance criteria for this deliverable. In proposing those SLAs, however, the team should consider the importance of maintaining a high rate of availability for this site in building both public and federal trust in the Simpler.Grants.gov initiative.

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this deliverable:

- **Translations:** Because translating the content of the site depends on formalizing the translation process, translating site contents into multiple languages is out of scope for this deliverable.
- **User survey:** Because a feedback mechanism won't be adopted during this deliverable, a user survey will also be descoped from the public launch.
- **Testable features from users:** The site will functionally remain a static site. There will be methods for the public to get involved with the project and follow our progress but there is currently no API or functionality on the site for users to engage with in this release. 

## Integrations

### Translations
<!-- Required -->

Does this deliverable involve delivering any content that needs translation?

1. Yes, the site contents will need to be translated -- but not as part of this deliverable.

If so, when will English-language content be locked? Then when will translation be started and completed?

1. The site contents will be translated when we complete the [static site improvements deliverable](https://github.com/HHS/grants-equity/issues/568)

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. **Subscription to mailing list:** This deliverable *may* include deploying a service that allows site visitors to sign up for a mailing list for updates about the Simpler.Grants.gov initiative.

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. **Static site + mailing list:** If this deliverable includes a mechanism for visitors to subscribe to a mailing list, it will need to be integrated in the static site for the first time.

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. No, the content of the static site in this milestone will be limited to general information about the Simpler.Grants.gov project. It does not include exposing any production data from the new simpler.grants.gov data model.

### Security considerations
<!-- Required -->

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

1. If it is included in this deliverable, the mechanism to allow site visitors to sign up for our mailing list will expose a new attack vector through the form submission for this service.

If so, how are we addressing these risks?

1. The implementation plan for email subscriptions will evaluate and consider common security practices for validating and sanitizing user input. Where possible, we should adopt an existing system that HHS uses to manage email subscriptions.
