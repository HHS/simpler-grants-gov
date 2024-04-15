---
description: >-
  Host a public participatory process in which open source contributors are
  invited to submit designs and code for improvements to the simpler.grants.gov
  site.
---

# Collaborative code challenge

## Summary details

<table><thead><tr><th width="253">Field</th><th>Value</th></tr></thead><tbody><tr><td><strong>Deliverable status</strong></td><td>Planning</td></tr><tr><td><strong>Link to GitHub issue</strong></td><td><a href="https://github.com/HHS/simpler-grants-gov/issues/130">Issue 130</a></td></tr><tr><td><strong>Responsible parties</strong></td><td><ul><li><a data-mention href="https://app.gitbook.com/u/birUyinL3yXkEkQ7tr3GgNrCZCC3">Brandon Tabaska</a>?</li></ul></td></tr><tr><td><strong>Key sections</strong></td><td><ul><li><p><a href="collaborative-code-challenge.md#overview">Overview</a></p><ul><li><a href="collaborative-code-challenge.md#business-value">Business value</a></li><li><a href="collaborative-code-challenge.md#user-stories">User stories</a></li></ul></li><li><p><a href="collaborative-code-challenge.md#technical-description">Technical description</a></p><ul><li><a href="collaborative-code-challenge.md#definition-of-done">Definition of done</a></li><li><a href="collaborative-code-challenge.md#proposed-metrics">Proposed metrics</a></li></ul></li><li><a href="collaborative-code-challenge.md#assumptions-and-dependencies">Dependencies and assumptions</a></li></ul></td></tr></tbody></table>

## Overview

### Summary

* **What:** Host a public event in which open source contributors are invited to submit designs and/or code for a focused area of the site, such as an updated opportunity listing page or improved search experience.
* **Why:** Builds excitement within the open source community and allows us to incorporate ideas from our participatory processes and code from members of the public to improve the grants experience on simpler.grants.gov. It also helps us plan for repeated longer-term engagements that incentivize open source contributions in the future and ensures that we build products that includes a participatory process through which we build it.
* **Who**
  * Members of the PAC who will help us design the goals of the code/design challenges&#x20;
  * Open source contributors who will be submitting code
  * Members of the PAC and federal staff who will be providing feedback on submissions
  * Internal developers who will iterate on open source contributions
* **Out of scope**
  * Incorporating submissions into our codebase. If we decide to adopt code or designs contributed by the public, incorporating those submissions will happen outside this deliverable.
  * Months-long engagement. While it is an explicit goal to use this first challenge as a test run for future multi-phase challenges, this event is only scoped to run for a few days.

### Business value

#### Problem

While more participatory models for stakeholder engagement, such as Community Feedback Groups, can surface user needs and feature requests that might not emerge through traditional user research, the ability to implement this feedback is often limited by internal capacity. Open source projects provide a valuable way for members of the public to contribute features or fix bugs that might otherwise linger in a product backlog, but the current model for open source projects often fails to appropriately reward contributors for the value they provide to projects. One of the main goals of the Simpler.Grants.gov initiative is to foster a participatory development process while simultaneously ensuring that participants are compensated fairly for their time and effort.

#### Value

One potential strategy to achieve this goal is to incentivize contributions through a public code and design challenge, similar to an aspirational model pioneered by the [NASA Space Apps Challenge](https://www.spaceappschallenge.org/2023/awards/). By inviting members of the public to submit their own designs, features, and prototypes that build on public data, Space Apps and similar events provide a testing ground for meaningful improvements to the functionality of federal systems.&#x20;

Pairing the hackathon model with a financial incentive for a subset of submissions also has the ability to compensate participants for their time and effort in ways that traditional open source projects lack. In addition to incentivizing participation from open source contribution, a challenge also provides an opportunity to engage both applicant and federal stakeholders by inviting them to review and provide feedback on the resulting submissions. With the right approach and resources, a well-run code and design challenge could strengthen not only the value that the simpler.grants.gov platform provides to users, but also the community it fosters within the grants ecosystem.

#### Goals

* Build traction for the open source community, and get the public and stakeholders excited about getting involved in the project
* Capture feedback and ideas for new features that may not surface through user research
* Enable members of federal staff and the PAC to provide feedback on contributions from the open source community
* Incentivize both code and design contributions from the open source community
* Lay the foundation for future, multi-phase code and design challenges in the future that may span multiple months
* Build experience with tools and processes for participatory contributions such as upvoting ideas and receiving submissions.

### User stories

* As an **open source contributor**, I want:
  * to be rewarded for my contributions to the simpler.grants.gov project, so that I am fairly compensated for my time and the value that I provide to the project.
  * to have access to real data during the challenge (e.g. through an API), so that my submission can demonstrate value to applicants who are actively searching for grants.
  * to have access to simpler.grants.gov design assets and guidelines, so that my submission supports a consistent user interface and experience for applicants.
  * to be able to communicate with other participants and event organizers during the challenge, so that I can ask questions, get updates, and collaborate with my team more easily.
* As an **event coordinator**, I want:
  * to advertise the event(s) across our main communication channels, so that we can try to increase the number of participants in the challenge.
  * participants to be able to formally register for the event(s), so that we can estimate attendance and communicate with participants prior to the event(s).
* As a **project maintainer**, I want:
  * submissions to adopt shared tools and frameworks where possible, so that it will be easier to incorporate valuable features into our codebase.
* As a **member of HHS staff**, I want:
  * to review and provide feedback on the submissions, so that I can see the kinds of features and improvements the open source community would like us to include in our roadmap.
  * a playbook for organizing similar events in the future, so that can incorporate lessons learned and simplify the planning process for subsequent code and design challenges.

## Technical description

### Process and event planning

{% hint style="info" %}
**Note**

While the scope of this current deliverable is limited to a single multi-day challenge. One of the primary goals for this deliverable is to lay the groundwork for future challenges that are multi-phase and potentially months-long engagements. As a result it may be helpful to think about our long-term objectives when designing the structure of the first challenge event.
{% endhint %}

The primary effort required for this deliverable is planning and hosting a multi-day event that includes both internal and external stakeholders.

In the course of planning for this process, we should answer the following questions:

* What strategies should we use to promote this process and its events?
* How will participants register and receive updates prior to this process and its events?
* How will participants communicate with each other and event coordinators during the course of the process and its events?
* What additional accommodations are we providing to ensure that the event is accessible to all attendees? (e.g. translators, live closed captioning, etc.)

### Challenge preparation

In addition to general event planning, this deliverable requires the team to design and scope the challenge for which participants will be submitting code and/or designs.

In preparing for this code/design challenge, we should answer the following questions:

* What data and/or resources are we providing participants to incorporate in their submissions?
* Is there any preliminary engineering or design work that we need to complete prior to the event in order to provide those resources?
* How will participants submit their contributions? (e.g. as a separate repo, as a pull request from a forked version of our repo, etc.)
* Will there be multiple categories within the challenge? (e.g. code, design, documentation, etc.)
* What guidelines are we providing participants about the kind of submissions we are looking for and how those submissions will be reviewed?

### Submission review

In keeping with the participatory nature of this event, we also want to engage public and federal stakeholders in the review of submissions to this code and design challenge. In designing the review process, we should answer the following questions:

* How are proposals submitted "in the open" and viewable to the public?
* How will the members of the public provide feedback (such as comments or upvotes) on the submissions?&#x20;
* Who will be included on the review panel and how should those members be chosen?
* How will the members of the review panel provide feedback on the submissions? Are we providing a rubric or list of evaluation criteria?
* Do we need to adopt or configure any tools to support the feedback and review process?
* How will the feedback provided by the review panel be shared with participants?

### Submission awards

Given that a major goal of this deliverable is to reward a least a subset of participants for their contributions during the challenge, another important effort involves managing the approval and logistics around facilitating this award payment.

In planning our submission award process, the team should answer the following questions:

* How many awards do we plan to distribute? And what is the total budget for awards?
* What criteria does a submission need to satisfy in order to be eligible for an award? And how are we communicating this criteria to participants?
* How are we plan to disburse the awards to recipients?

### Planning for future engagements

One example (not binding!) format and timeline for future code/design challenge process would be the following. **However, we may choose for this 30k to only work on a very small slice of functionality that enables a process like this in the future.** This proposal should definitely change as we co-design the process and iterate on the plan:&#x20;

1. Approximately 1-2 months: work with PAC and other stakeholders on designing the goals, structure, compensation plan, outreach strategy, and evaluation criteria for the process
2. Approximately 1 month: share details of the challenge publicly and conduct outreach to sign up interested participants&#x20;
3. Event: Virtual kickoff event (describe challenge, answer questions)
4. Approximately 1 month: participants develop proposals "in the open" in an open source tool
5. Event: Use participatory budgeting techniques to decide on proposals that are selected to advance to the next round.
   1. For instance, all winners at this stage could receive $X to develop their work further.&#x20;
6. Approximately 1 month: participants develop final designs/code "in the open" and submit them for review&#x20;
7. Approximately 1-2 weeks: use participatory budgeting techniques to vote on the public's favorite final submissions. Then HHS staff decides on final awards/prizes.
8. Event: Virtual wrap-up event, announcing results and featuring demos for winners

### Definition of done

Following sections describe the conditions that must be met to consider this deliverable "done".

#### **Must have**

* [ ] Decisions to the questions outlined in the the technical description sections are documented in our wiki or through our ADR process
* [ ] A multi-day code and/or design challenge event is hosted with:
  * [ ] At least 50 registered participants from the public
  * [ ] At least 5 submissions from the public
  * [ ] At least 1 submission from the internal simpler.grants.gov team
* [ ] Prior to the event:
  * [ ] Tools needed to facilitate the event are chosen, procured, and implemented
  * [ ] The event is promoted across our main communication channels (e.g. mailing list, static site, Slack, public wiki, etc.)
  * [ ] Participants can register and receive updates from event coordinators
  * [ ] A budget and a payment mechanism to reward challenge submissions are approved by the necessary stakeholders
* [ ] During the event, participants have access to:
  * [ ] The data they need to build or prototype new functionality for simpler.grants.gov
  * [ ] Design assets and guidelines (logos, colors, etc.) for simpler.grants.gov
  * [ ] A clear rubric or set of criteria being used to evaluate their submissions
  * [ ] Communication channels for questions and collaboration
  * [ ] A mechanism to submit their code/design contributions for review
* [ ] Following the event, submissions are reviewed by a feedback panel consisting of:
  * [ ] Rights-holders from the PAC
  * [ ] Stakeholders from the federal government
  * [ ] Simpler.Grants.gov project maintainers
* [ ] Following the review and feedback period, a subset (or all) of the public participant teams have received a financial reward for their submissions
* [ ] A playbook is created that documents how to plan and host similar events in the future. This playbook includes guidance on how to:
  * [ ] Effectively promote the event and increase participation
  * [ ] Select and configure tools to facilitate things like registration, collaboration, and voting
  * [ ] Budget and distribute rewards for challenge submissions
* [ ] We have a method to track and share our metrics to measure:&#x20;
  * [ ] Engagement metrics
    * [ ] Total number of views for event-related pages on the static site and wiki
    * [ ] Open rate of emails sent to our mailing list about the event
    * [ ] Total number of views, shares, etc. for posts about the event on social media
  * [ ] Total number of registrations for the event
  * [ ] Total number of active participants during the event
  * [ ] Total number of code/design submissions

#### **Nice to have**

* [ ] Participants can access to all of the data they need to build their submissions via API endpoint
* [ ] Participants can prepare their submission using a template repository and/or Figma board that the simpler.grants.gov team has created for the event

### Proposed metrics

* Engagement metrics for announcements about the event, for example:
  * Total number of views for event-related pages on the static site and wiki
  * Open rate of emails sent to our mailing list about the event
  * Total number of views, shares, etc. for posts about the event on social media
* Total number of registrations for the event
* Total number of active participants during the event
* Total number of code/design submissions

## Planning

### Assumptions and dependencies

What functionality do we expect to be in place _**before**_ work starts on this deliverable?

* \[Functionality that should already exist]
* \[Functionality that should already exist]

Is there any notable functionality we do _**not**_ expect to be in place before works starts on this deliverable?

* \[Feature that will not be ready]
* \[Feature that will not be ready]

### Not in scope

List of functionality or features that are explicitly out of scope for this deliverable.

* \[Functionality not in scope]
* \[Functionality not in scope]

### Open questions

<details>

<summary>Will the challenge be hosted virtually or do we anticipate an in-person component?</summary>



</details>

<details>

<summary>Will the full text of opportunities be available via API prior to this deliverable?</summary>



</details>

## Integrations

### Translations

Does this deliverable involve delivering any content that needs translation?

* \[to be added]

If so, when will English-language content be locked? Then when will translation be started and completed?

* \[to be added]

### Services going into PROD for the first time

This can include services going into PROD behind a feature flag that is not turned on.

* \[to be added]

### Services being integrated in PROD for the first time

Are there multiple services that are being connected for the first time in PROD?

* \[to be added]

### Data being shared publicly for the first time

Are there any fields being shared publicly that have never been shared in PROD before?

* \[to be added]

### Security considerations

Does this deliverable expose any new attack vectors or expand the attack surface of the product?

* \[to be added]

If so, how are we addressing these risks?

* \[to be added]

## Change log

Major updates to the content of this page will be added here.

<table><thead><tr><th>Date</th><th width="246">Update</th><th>Notes</th></tr></thead><tbody><tr><td>2/12/2024</td><td>Initial Content</td><td>Updated with Initial content</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
