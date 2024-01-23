# Open source onboarding process

| Field              | Value                                                             |
| ------------------ | ----------------------------------------------------------------- |
| Document status    | Draft                                                             |
| Deliverable ticket | [Issue 72](https://github.com/HHS/grants-equity/issues/72)        |
| Roadmap dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12)      |
| Product owner      | Lucas Brown, Billy Daly                                           |
| Document owner     | Sumi Thaiveettil                                                  |
| Lead developer     | Aaron Couch                                                       |
| Lead designer      | Andy Cochran                                                      |

## Short description

- **What:** Set up the tools and processes needed to build an open source community around the Simpler Grants.gov initiative
- **Why:** Ensures that open source contributors and the general public can easily participate in the project and provide input and code
- **Who:** Any public members who want to contribute to the open source project. Focus is on: 
  - Open source contributors
  - Other external stakeholders

## Goals

### Business description & value

**Problem statement:** Currently, the Simpler.Grants.gov project lacks a ready-to-use onboarding experience for individuals interested in joining the open source community. The absence of essential tools, processes, onboarding steps, and guidelines poses a challenge to meeting business goals and mission alignment. 

**Value:** We seek to build stakeholder trust, enhance project transparency, and establish a dynamic open source community. Our focus is on foundational components that facilitate future expansion and productive collaboration, ensuring efficient community management and promoting transparency in project development.

This effort allows us to... 

- Set up the foundational set of communication channels for continuous user input, feedback, and engagement for an open source project
- Ensure that public code contributions meet code quality and security standards
- Build stakeholder trust in our product roadmap and our approach to development
- Streamline and standardize the onboarding process for new open source contributors

### User stories

- As a **full-time HHS staff member**, I want to:
  -  have assurance that the open source channels and methods are configured in a way that eliminates security risks.
- As a **member of an HHS contractor team**, I want to:
  -  have streamlined tools and processes for managing contributions, reviewing code, and ensuring code quality, so I can efficiently maintain and enhance the project while upholding its standards.
  - to have a standardized process for onboarding new open source contributors, so that members of the public can be added to our communication channels smoothly and efficiently.
  - to have the ability to monitor the health and inclusivity of the project by tracking metrics like community engagement, issue resolution times, and the diversity of contributors, so I can make informed decisions for community growth and sustainability.
- As a **member of the public**, I want to:
  -  have easy access to clear documentation and guidelines for joining, contributing, and engaging with the open source community so I can quickly become a productive contributor and understand the community's values and expectations.
  - have effective communication channels, regular updates, and opportunities for networking and collaboration, so I can stay informed, participate in discussions, and contribute to the community's goals, fostering an active and thriving open source ecosystem. 

## Technical description

### Communication tools onboarding   

There are some basic communication tools that are required for a good onboarding experience for an open source contributor. Configuration and setting up an obboarding experinece for communications and contributing tools such as a Github and Slack are required. Specify the platforms, integration methods, user access levels, onboarding experience, and any technical considerations for making these tools fully operational for the community. 

### Team meetings and open source events

Detail the aspects of scheduling and conducting team scrum meetings. This can include information about the chosen video conferencing tools, meeting frequency, methods for the general public to join open meetings, and any requirements for ensuring effective remote communication during these meetings. 

### Getting Started Guide Development  

There is clear documentation and guidelines for the general public to get started and contribute. Documentation typically should include project overviews, installation instructions, usage guidelines, contribution procedures, and community engagement details, fostering a collaborative and informed open source community. 

### Developer Tools Setup  

Provide technical instructions for setting up developer tools and environments. This can encompass version control systems, code review tools, and any collaborative platforms for coding and testing.

### Definition of done

- [ ] Onboarding experience ready for the public this includes:
    - [ ] onboarding to the selected chat tool, Slack
    - [ ] onboarding to Github
    - [ ] onboarding to Google Groups
    - [ ] materials such as a deck or another format for getting started with the project
    - [ ] onboarding guidance for developer tools and environments
- [ ] The selected video conference tool, Zoom, is procured and ready for use for webinars, office hours, or other open source events.
- [ ] The following conditions have been satisfied for all tools:
  - [ ] At least 3 members of the general public have been onboarded.
  - [ ] New members of the public can be onboarded to the tool for no cost to the user in a process that takes less than 2 days.
  - [ ] Services are accessible to all people on the HHS network, public internet, and _preferably_ the White House network and most or all agency networks
  - [ ] Onboarding instructions for new users are clearly and accessibly documented in a public place.
  - [ ] Instructions for the internal team that assists with onboarding new users are clearly and accessibly documented in our internal wiki.
  - [ ] Code for managing and deploying these services is deployed to `main` & PROD (if necessary)
  - [ ] An ADR has been recorded which documents the tool chosen and the reasons for selecting it
- [ ] We have 3 onboarded members of the general public to the following communication tools:
  - [ ] Slack
  - [ ] Google Group
  - [ ] Public wiki


### Proposed metrics for measuring goals/value/definition of done

- [ ] Number of users onboarded to the open source community
- [ ] Time to onboard to the open source community


## Planning

### Assumptions & dependencies
<!-- Required -->

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- Procurement of the tools should be in place as the procurement process can delay delivery. Zoom, Slack, and Github are already licensed on the project. 

Are there any notable capabilities / milestones we do NOT expect to be in place at the
beginning of work on this milestone?

- **Participant advisory council (PAC):** We will not have a participant advisory council in place when work begins on this deliverable. Instead, this deliverable will be required to onboard members of the PAC once we begin work on setting it up.
- **Site content translations:** We will not yet have a process in place to translate the content of our static site or repository documents. That will be addressed in a future 30k ft deliverable.

### Open questions
<!-- Optional -->

- [ ] Is it important to have a public wiki available and ready in this deliverable?
Yes, there should be a minimal version of the public wiki available to share with the general public.

- [ ] Is it important to have a public API documentation ready for consumption in this deliverable?
No, we will handle public API documentation in another 30k deliverable. 

### Not doing
<!-- Optional -->

- We will not be hosting an open source kickoff within this effort. 

## Integrations

### Translations
<!-- Required -->


### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

Yes the following tools will be deployed:

- Zoom for video conferencing. Only internal teams will have a Zoom license, but the public will join Zoom
- **Google group:** We'll use this for email-based communication with our open source community.
- **Public wiki:** We'll be using this to share public information about the project, such as onboarding guides, presentations, and meeting notes for public meetings.


### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

Yes, we expect there to be some integrations between the following tools in production:

1. **Chat + Ticket tracking:** Option to receive updates on key tickets in chat
2. **Wiki + Chat:** Option to receive updates on key document changes in chat
3. **Video Conference + Shared Calendar:** Option to add video conference details to events
4. **Shared Calendar + Wiki:** Option to embed public calendar events in the wiki

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*
- No, this 30k deliverable does not involve sharing any new production data.

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*
- Adding members of the public to Slack, Google Groups, Zoom, and Gitbook can pose a risk. Each tool contains their own risks. Slack contains a mix of public and private channels. Google Groups, Zoom, and Gitbook requires the public to sign up by giving their name and email address and we will need to verify that we can collect that data with the security team. 
- Mitigation strategies:
  - We have policy guidelines around where to post sensitive content for all forums where the general public can post.
  - We've trained internal staff on those policies
  - We'll review public channels for sensitive content and remove that content prior to inviting open source contributors.
  - We will review with the security team to ensure that we can collect data using these tools before we do so. 

