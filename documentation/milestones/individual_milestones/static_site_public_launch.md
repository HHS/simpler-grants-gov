# Static site public launch

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

- **What:** Update the static site to prepare for a public launch and adopt tools needed to manage content changes and collect user feedback.
- **Why:** Continues to improve front-end infrastructure and begins to build public excitement for the Simpler Grants.gov initiative.
- **Who:**
  - Internal content managers
  - Subset of grants.gov mailing list

## Goals

### Business description & value
<!-- Required -->

- Begin sharing simpler.grants.gov with a targeted set of public stakeholders
- Develop a communication strategy for future stakeholder engagement
- Create the systems and processes needed to ensure the site remains available under heavier traffic

### User stories
<!-- Required -->

- As an **HHS staff member**, I want:
  - to approve the content on the site before we share it with the public, so that I know what information will be visible to external stakeholders.
  - to know when I can share the site publicly, so that I can direct key stakeholders to a centralized location where they can learn more about the Simpler.Grants.gov initiative.
  - to have a communications strategy for stakeholder engagement, so that we have clear expectations about which groups will receive updates on the Simpler.Grants.gov initiative and can review proposed messaging to those groups.
- As an **internal developer**, I want:
  - to be notified when the site goes down, so that I can work to troubleshoot the issue and minimize downtime.
  - the front-end infrastructure to auto-scale based on site traffic, so that I don't have to manually monitor traffic and provision additional resources when there is heavy usage.
- As a **site visitor**, I want:
  - the site to load quickly when I visit it, so that I don't have to wait a long time to access the information I'm looking for.
  - there to be minimal planned or unplanned downtime, so that I can trust the new Simpler.Grants.gov site will be reliable when I use it to apply for grants.

## Technical description

### Content updates

Prior to the public launch of the site, update the contents to include:

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
  - Internally-defined service level agreements for availability and incident response
  - Documented incident response plan with steps and roles identified
  - Documented plan for rotating on-call schedule to receive and respond to alerts
  - Staff trainings and dry-runs for common types of incidents

### Communication strategy

The two main communication outputs needed for this deliverable are:

- An email campaign that is sent to the subset of the grants.gov mailing list with whom we plan to share the site.
- A communications plan that outlines future plans for stakeholder engagement about the Simpler.Grants.gov initiative. This plan should answer the following questions:
  - Which stakeholder groups are we planning to engage?
  - Who is responsible for managing the relationship with each group?
  - What is the primary channel and cadence for those communications?

Both the initial email communication and the communication plan should be reviewed and approved by key stakeholders in the recurring communications meetings.

### Definition of done
<!-- Required -->

#### Must have

- [ ] Basic requirements
  - [ ] Code is deployed to main & PROD through our CI/CD pipeline
  - [ ] Services are live in PROD (may be behind feature flag)
  - [ ] All new services have passed a security review (as needed)
  - [ ] All new services have completed a 508 compliance review (as needed)
  - [ ] Data needed for metrics is actively being captured in PROD
  - [ ] Key architectural decisions made about this deliverable are documented publicly (as needed)
- [ ] Functional requirements
  - [ ] The static site has been updated with content approved by internal stakeholders
  - [ ] The front-end infrastructure can handle site traffic of up to 1,000 concurrent users
  - [ ] Tickets and/or documentation have been created that describe the infrastructure changes needed to support future site traffic at the following levels:
    - [ ] 10,000 users
    - [ ] 100,000 users
    - [ ] 1 million users
  - [ ] Engineering staff are notified when the site goes down
  - [ ] Engineering staff have been trained on a documented incident response plan that describes a set of actions to take when the site goes down
- [ ] Communications requirements
  - [ ] An email has been sent out to the subset of public stakeholders with whom we plan to share the static site
  - [ ] Key internal stakeholders (e.g. help desk staff, HHS leadership) have been notified when the email is sent out so that they can prepare for questions from public stakeholders
  - [ ] A longer-term stakeholder engagement plan has been drafted that describes future phases of engagement

#### Nice to have

- [ ] Site visitors can subscribe to mailing list to receive updates about the Simpler.Grants.gov initiative
- [ ] Internal stakeholders can preview a live version of content changes before they are visible to everyone on simpler.grants.gov

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
9. (Stretch) Number of visitors who subscribe to the mailing list

### Destination for live updating metrics
<!-- Required -->

Page on the public wiki. **Note:** This will likely change once we deliver [the public measurement dashboard](https://github.com/HHS/simpler-grants-gov/issues/65)

## Planning

### Assumptions & dependencies
<!-- Required -->

What functionality do we expect to be in place ***before*** work starts on this deliverable?

- [to be added]

What functionality do we expect to be in place by ***the end*** of work on this deliverable?

- [to be added]

Is there any notable functionality we do ***not*** expect to be in place before works starts on this deliverable?

- [to be added]

### Open questions
<!-- Optional -->

- [to be added]

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this deliverable:

- [to be added]

## Integrations

### Translations
<!-- Required -->

Does this deliverable involve delivering any content that needs translation?

1. [to be added]

If so, when will English-language content be locked? Then when will translation be started and completed?

1. [to be added]

### Services going into PROD for the first time
<!-- Required -->

This can include services going into PROD behind a feature flag that is not turned on.

1. [to be added]

### Services being integrated in PROD for the first time
<!-- Required -->

Are there multiple services that are being connected for the first time in PROD?

1. [to be added]

### Data being shared publicly for the first time
<!-- Required -->

Are there any fields being shared publicly that have never been shared in PROD before?

1. [to be added]

### Security considerations
<!-- Required -->

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

1. [to be added]

If so, how are we addressing these risks?

1. [to be added]
