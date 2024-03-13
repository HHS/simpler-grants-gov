---
description: Template page for deliverable specifications.
---

# Open source onboarding

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Planning</td></tr><tr><td><strong>Responsible parties</strong></td><td><ul><li><a data-mention href="https://app.gitbook.com/u/birUyinL3yXkEkQ7tr3GgNrCZCC3">Brandon Tabaska</a> - Open source evangelist</li><li><a data-mention href="https://app.gitbook.com/u/7lzKMr1fMVYGtzZWQCJenjXo9c33">Sumi Thaiveettil</a></li></ul></td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/grants-equity/issues/72">Issue 72</a></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="open-source-onboarding.md#overview">Overview</a></p><ul><li><a href="open-source-onboarding.md#business-value">Business value</a></li><li><a href="open-source-onboarding.md#user-stories">User stories</a></li></ul></li><li><p><a href="open-source-onboarding.md#technical-description">Technical description</a></p><ul><li><a href="open-source-onboarding.md#definition-of-done">Definition of done</a></li><li><a href="open-source-onboarding.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="open-source-onboarding.md#assumptions-and-dependencies">Dependencies and assumptions</a></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Set up the tools and processes needed to build an open source community around the Simpler Grants.gov initiative
* **Why:** Ensures that open source contributors and the general public can easily participate in the project and provide input and code
* **Who:** Any public members who want to contribute to the open source project. Focus is on:
  * Open source contributors
  * Other external stakeholders

### Business value

#### Problem

Currently, the Simpler.Grants.gov project lacks a ready-to-use onboarding experience for individuals interested in joining the open source community. The absence of essential tools, processes, onboarding steps, and guidelines poses a challenge to meeting business goals and mission alignment.

#### Value

We seek to build stakeholder trust, enhance project transparency, and establish a dynamic open source community. Our focus is on foundational components that facilitate future expansion and productive collaboration, ensuring efficient community management and promoting transparency in project development.

**Goals**

This effort allows us to...

* Set up the foundational set of communication channels for continuous user input, feedback, and engagement for an open source project
* Ensure that public code contributions meet code quality and security standards
* Build stakeholder trust in our product roadmap and our approach to development
* Streamline and standardize the onboarding process for new open source contributors

### User stories

* As a **full-time HHS staff member**, I want to:
  * have assurance that the open source channels and methods are configured in a way that eliminates security risks.
* As a **member of an HHS contractor team**, I want to:
  * have streamlined tools and processes for managing contributions, reviewing code, and ensuring code quality, so I can efficiently maintain and enhance the project while upholding its standards.
  * to have a standardized process for onboarding new open source contributors, so that members of the public can be added to our communication channels smoothly and efficiently.
  * to have the ability to monitor the health and inclusivity of the project by tracking metrics like community engagement, issue resolution times, and the diversity of contributors, so I can make informed decisions for community growth and sustainability.
* As a **member of the public**, I want to:
  * have easy access to clear documentation and guidelines for joining, contributing, and engaging with the open source community so I can quickly become a productive contributor and understand the community's values and expectations.
  * have effective communication channels, regular updates, and opportunities for networking and collaboration, so I can stay informed, participate in discussions, and contribute to the community's goals, fostering an active and thriving open source ecosystem.

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

Following sections describe the conditions that must be met to consider this deliverable "done".

* **Must have**
  * [ ] The following tools have been procured and implemented for internal and public use:
    * [x] **Slack** - chat-based community engagement
    * [x] **GitBook** - public-facing wiki and knowledge base
    * [ ] **Zoom** - webinars, office hours, or other open source events
    * [ ] **Google group** - email-based community engagement
  * [ ] The following conditions have been satisfied for _all_ tools:
    * [ ] Services are accessible to all people on the HHS network, public internet, and _preferably_ the White House network and most or all agency networks
    * [ ] Instructions for the internal team that assists with onboarding new users are clearly and accessibly documented in our public or internal wiki
    * [ ] Code for managing these services is deployed to `main` & PROD (if necessary)
    * [ ] An ADR has been recorded that documents why the tool was chosen
  * [ ] There is a public page of information that explains how to onboard to all of the communication tools for the open source community (e.g., this could be hosted in the public wiki)&#x20;
  * [ ] The onboarding page is linked from simpler.grants.gov
  * [ ] The onboarding page is linked from the \`simpler-grants-gov\` GitHub repo
  * [ ] Onboarding to communication channels ready for the public this includes:
    * [ ] &#x20;onboarding to the selected chat tool, Slack
    * [ ] &#x20;onboarding to Github
    * [ ] &#x20;onboarding to Google Groups
    * [ ] &#x20;materials such as a deck or another format for getting started with the project
    * [ ] &#x20;onboarding guidance for developer tools and environments
  * [ ] We have onboarded three members of the general public to the following communication tools:
    * [ ] Slack
    * [ ] Google groups
    * [ ] GitHub
  * [ ] We have a system for tracking the onboarding process for all new members, ensuring that they have agreed to the terms of use (such as community agreements and content sensitivity guidelines) and completed all necessary onboarding steps
  * [ ] Tool-specific requirements:
    * [ ] The public wiki can be accessed from a custom domain that is easy to remember and specific to the Simpler.Grants.gov initiative
    * [ ] The public wiki includes copies of our deliverable specs and information about our roadmap and planning process
    * [ ] The public wiki includes a user guides for all public-facing communication tools
    * [ ] Public Slack channels have been reviewed and sensitive content has been removed or the channel has been made private
    * [ ] At least three GitHub issues have been labeled with "help wanted"
  * [ ] We've documented an information architecture for the public wiki, so that content has clear organizing principles and it is easy to know where to add or look for content
  * [ ] We have a system for "offboarding" members of the community from all tools
  * [ ] We are able to "block" users who violate community guidelines and offboard them from all tools without their participation in the offboarding process
  * [ ] We have a process documented for what to do if anyone notices inappropriate content or behaviors and how to escalate and remove the content
* **Nice to have**
  * [ ] Members of the public can suggest changes to content in the wiki through a pull request
  * [ ] Links to each of these communication tools are available on simpler.grants.gov and in the repository's main README

### Proposed metrics

* Number of users onboarded to the open source community
* Time to onboard to the open source community. For example, lead time between opening and closing a ticket
* Slack metrics
  * Number of monthly active users in slack, total
  * Number of monthly active users in slack, external
  * Weekly volume of chat messages
* Wiki metrics
  * Total number of visitors
  * Number of unique visitors
  * Number of visitors per page
* GitHub metrics
  * Number of stars
  * Number of forks

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* [x] **Static site:** The static site should be publicly deployed so that we can direct open source contributors to learn more about the program at simpler.grants.gov. We may also want to use the site to solicit requests to join the open source group.
* [ ] **Tool procurement:** Procurement of the following tools tools should be in place as the procurement process can delay delivery.
  * [x] Slack
  * [x] GitBook
  * [x] Github
  * [ ] Zoom
  * [ ] Google Groups

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* **Participant advisory council (PAC):** We will not have a participant advisory council in place when work begins on this deliverable. Instead, this deliverable will be required to onboard members of the PAC once we begin work on setting it up.
* **Site content translations:** We will not yet have a process in place to translate the content of our static site or repository documents. That will be addressed in a future 30k ft deliverable.

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* We will not be hosting an open source kickoff within this effort. However, we do plan to onboard members of the public within this effort.&#x20;

### Open questions

<details>

<summary>Is it important to have a public wiki available and ready in this deliverable?</summary>

Yes, there should be a minimal version of the public wiki available to share with the general public.

</details>

<details>

<summary>Is it important to have a public API documentation ready for consumption in this deliverable?</summary>

No, we will handle public API documentation in another 30k deliverable.

</details>

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

* **User guides in wiki** - User guides for our main communication tools would ideally be translated. And we should consider translating other relatively static content in the wiki moving forward.
* **Repository documents** - Relatively static and central documentation in GitHub such as the main repository README, code of conduct, and contributing guidelines should eventually be translated.

If so, when will English-language content be locked? Then when will translation be started and completed?

* Translations will need to happen _after_ the onboarding process is delivered. We'll track those translations in the process defined by the content translation process deliverable.

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* **Zoom** for video conferencing. Only internal teams will have a Zoom license, but the public will join Zoom
* **Google group:** We'll use this for email-based communication with our open source community.
* **GitBook:** for the public wiki. We'll be using this to share public information about the project, such as onboarding guides, presentations, and meeting notes for public meetings.

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

1. **Chat + Ticket tracking:** Option to receive updates on key tickets in chat
2. **Wiki + Chat:** Option to receive updates on key document changes in chat
3. **Video Conference + Shared Calendar:** Option to add video conference details to events
4. **Shared Calendar + Wiki:** Option to embed public calendar events in the wiki

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* No, this 30k deliverable does not involve sharing any new production data.&#x20;

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product? If so, how are we addressing these risks?

* Adding members of the public to Slack, Google Groups, and Zoom can pose a risk. Each tool contains their own risks:&#x20;
  * Slack contains a mix of public and private channels.
  * GitBook contains both an internal wiki and a public wiki.&#x20;
  * Slack, Google Groups, and Zoom requires the public to sign up by giving their name and email address
* Mitigation strategies:
  * Review the user agreements and/or terms of service for the different tools (Google Groups, Zoom, etc) to ensure they state that any data collected (like name and email) will be shared with the owner of the instance being used. This ensures we legally own the data in case of a breach. Julius and Lucas have reviewed this risk and agreed that no SIA is needed in this case&#x20;
  * We have policy guidelines around where to post sensitive content for all forums where the general public can post. If PII data is posted in public channels, we will have a plan to remove the sensitive data. We will need to consider how each of the tools handle versioning as well. For example, in Github, since data is still in the git history, we will not be able to just delete the data from the repo and update commits. We need to have a mechanism and plan to remove sensitive data
  * We've trained internal staff on those policies
  * We'll review public channels for sensitive content and remove that content prior to inviting open source contributors.
  * We will review with the security team to ensure that we can collect data using these tools before we do so.
