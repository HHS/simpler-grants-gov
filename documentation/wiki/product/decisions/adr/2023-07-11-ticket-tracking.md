# Ticket Tracking

* **Status:** Accepted
* **Last Modified:** 2023-07-11
* **Related Issue:** [#98](https://github.com/HHS/simpler-grants-gov/issues/98)
* **Deciders:** Lucas, Esther, Sumi, Sarah, Aaron, Billy
* **Tags:** communications, sprint planning, agile

## Context and Problem Statement

The project needs a system for tracking ongoing development work within the project, preferably as a series of tickets that can be organized into sprints. This system would both enable internal stakeholders to prioritize key tasks and assignments throughout the project and help communicate those priorities to external stakeholders.

The goal of this ADR is to evaluate a series of ticket tracking systems and select the one we will be using for the project.

## Decision Drivers

#### Must Have

* **Ticket Tracking:** Tickets can be organized into sprints and tracked as part of larger deliverables
* **Public Access:** Without logging in, members of the public can see tickets that are being worked on
* **Public Requests:** Members of the public can submit bug reports and feature requests and track how that work is being prioritized
* **Templates:** The system supports default templates for different types of tickets which prompts the person creating the ticket for a specific set of information
* **Authority to Operate (ATO):** The platform already must be authorized under the Grants.gov ATO (Authority to Operate) or ATO coverage must be requested
* **Reporting:** Users can report on the following key metrics:
  * Sprint burndown -- % of tickets and/or points remaining over the course of the sprint
  * Deliverable burdown -- % of tickets and/or points remaining per deliverable over time
  * Sprint allocation -- # of tickets and/or points allocated to each team member per sprint
  * Sprint completion -- # of tickets and/or points created vs planned per sprint
  * Sprint velocity -- Average # of tickets and/or points completed per sprint
  * Lead/cycle time -- # of days between creation of a ticket and when that ticket is closed

#### Nice to Have

* **Level of Effort Estimates:** Tickets can be assigned an estimated level of effort (e.g. story points, t-shirt size, etc.)
* **Custom Views:** Users can create custom views for managing tickets with multiple layouts (e.g. kanban board, tabular, roadmap)
* **Custom Fields:** Users can create custom fields and views to manage their projects
* **Automation:** Users can automate basic workflows like adding and moving tickets, linking PRs to their originating PRs, etc.
* **Open Source:** The tool used to manage and host the wiki content should be open source, if possible

## Options Considered

* [GitHub Issues + Zenhub](2023-07-11-ticket-tracking.md#github-issues--zenhub)
* [GitHub Issues + GitHub Projects](2023-07-11-ticket-tracking.md#github-issues--github-projects)
* [Jira](2023-07-11-ticket-tracking.md#jira)
* [OpenProject](2023-07-11-ticket-tracking.md#openproject)

## Decision Outcome

We are planning to use **GitHub issues with GitHub projects** because it is the only solution that allows members of the public to submit feature requests and bug reports and then track how those issues are being prioritized within upcoming sprints. Additionally, the use of these tools is free with public repositories and offers other helpful features such as custom fields and views.

**NOTE:** Given some of the constraints around reporting, we may want to continue to explore options that extend the reporting capabilities of GitHub projects. Similarly, if team productivity is meaningfully affected by the absence of the more robust features that Jira or Zenhub offers, we may want to re-evaluate this decision after an initial trial period.

### Positive Consequences

* We do not need to purchase licenses or seek ATO approval to start begin tracking tickets and planning sprints
* Members of the public can submit feature requests or bug tickets and track how those requests are being prioritized and worked on
* We can manage all of our sprint planning and development within the same platform
* We can extend GitHub project functionality with custom-built automations

### Negative Consequences

* We will need to develop custom reports to track some of the same metrics that Jira or Confluence offers out of the box. Our current proposed strategy for doing so is to create a Python script that exports the tickets and produces the following charts at the end of each sprint:
  * Sprint burndown -- % of tickets and/or points remaining over the course of the sprint
  * Deliverable burdown -- % of tickets and/or points remaining per deliverable over time
  * Sprint allocation -- # of tickets and/or points allocated to each team member per sprint
  * Sprint completion -- # of tickets and/or points created vs planned per sprint
  * Sprint velocity -- Average # of tickets and/or points completed per sprint
  * Lead/cycle time -- # of days between creation of a ticket and when that ticket is closed
* We will need to spend a bit more time setting up the GitHub project to replicate some of the features that Jira or Confluence offers (e.g. story points, sprints, epics, etc.)
* Team members who are familiar with Jira and Zenhub will need to spend a bit more time becoming familiar with GitHub Projects

## Comparison Matrix

* ✅ Feature available, meets requirement
* ❌ Feature not available, does not meet requirement
* 🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
* 1-3 Strength level
* ❓Unknown

| Factor                    |     Zenhub    | GitHub Projects |      Jira     |  OpenProject  |
| ------------------------- | :-----------: | :-------------: | :-----------: | :-----------: |
| Cost                      | $8.33/user/mo |       Free      | $7.75/user/mo | $7.25/user/mo |
| Ticket Tracking           |       ✅       |        ✅        |       ✅       |       ✅       |
| Public Access             |       🔄      |        ✅        |       🔄      |       ❌       |
| Public Requests           |       ✅       |        ✅        |       ❌       |       ❌       |
| Issue Templates           |       🔄      |        ✅        |       ✅       |       ❌       |
| Reporting                 |       ✅       |        🔄       |       ✅       |       ✅       |
| Authority to Operate      |       🔄      |        ✅        |       ✅       |       ✅       |
| Level of Effort Estimates |       ✅       |        ✅        |       ✅       |       ✅       |
| Custom Views              |       🔄      |        ✅        |       ✅       |       🔄      |
| Custom Fields             |       ❌       |        ✅        |       ✅       |       🔄      |
| Automation                |       🔄      |        ✅        |       ✅       |       ❌       |
| Open Source               |       ❌       |        ❌        |       ❌       |       ✅       |

## Pros and Cons of the Options

### GitHub Issues + Zenhub

Use [GitHub Issues](../../../decisions/adr/github-issues/) to create and manage development tickets and use Zenhub to organize those tickets into sprints.

* **Pros**
  * Built off of existing GitHub tickets and functionality
  * Robust [reporting](../../../decisions/adr/zenhub-reporting/) (e.g. burndown charts, velocity, etc.) out of the box
  * Supports key planning features like [story points](../../../decisions/adr/zenhub-story-points/) and [epics](../../../decisions/adr/zenhub-epics/)
  * Supports issue templates (through GitHub)
  * Chrome extension to view Zenhub attributes in GitHub
  * Team has experience working with Zenhub
* **Cons**
  * Licenses have a monthly fee, even for Government-backed open source projects
  * Sprint boards can't be viewed without Zenhub login
  * Moving tickets requires both Zenhub and GitHub logins and write access to the repository
  * Can be difficult to onboard existing Zenhub users to a new workspace
  * GitHub form-based templates don't work when creating issues from Zenhub
  * Limited support for custom views (e.g. no tabular layout)
  * No support for custom fields

### GitHub Issues + GitHub Projects

Use [GitHub Issues](../../../decisions/adr/github-issues/) to create and manage development tickets and use GitHub projects to organize those tickets into sprints.

* **Pros**
  * Keeps ticket creation and sprint planning in the same platform alongside code
  * Free for open source repositories
  * GitHub project boards can be viewed without a GitHub login
  * Supports issue templates (through GitHub)
  * Supports multiple [views of tickets](../../../decisions/adr/github-project-views/) (e.g. tabular, kanban board, roadmap)
  * Supports custom fields with multiple data types (e.g. numbers, drop downs, iterations, text fields, etc.)
  * Supports [custom reporting](../../../decisions/adr/github-insights/) based on those fields
  * Supports [built-in workflow automation](../../../decisions/adr/github-project-automation/) and custom automation with [GitHub actions](../../../decisions/adr/github-actions/)
  * Supports filters on all standard and custom fields
  * Covered under the existing Grants.gov ATO
* **Cons**
  * Reporting is less robust than Zenhub and Jira
  * Requires more initial setup to replicate some of Jira or Zenhub's out-of-the-box features
  * Team has less experience working with GitHub projects

### Jira

Use Confluence's [Jira](../../../decisions/adr/jira/) platform for both ticket management and sprint planning.

* **Pros**
  * Industry standard tool for ticket tracking and sprint planning
  * Robust [reporting](../../../decisions/adr/jira-reporting/) (e.g. burndown charts, velocity, etc.) out of the box
  * Supports [custom fields](../../../decisions/adr/jira-custom-fields/) with multiple data types (e.g. numbers, drop downs, text fields, etc.)
  * Supports multiple views of tickets (e.g. tabular, kanban board, roadmap)
  * Supports filters on all standard and custom fields
  * Supports built-in [workflow automation](../../../decisions/adr/jira-automation/)
  * Supports custom ticket templates
  * Third-party extensions are available to support public access to Jira boards
  * Team has experience working with Jira
* **Cons**
  * Licenses have a monthly fee (above 10 users)
  * Sprint boards can't be viewed without Zenhub login
  * Members of the public can't submit requests to a Jira board
  * Requires tracking tickets and planning sprints on a different platform

### OpenProject

Use the open source project management tool [OpenProject](../../../decisions/adr/open-project/) for both ticket management and sprint planning.

* **Pros**
  * Open source project with self-hosting option
  * Robust reporting (e.g. burndown charts, velocity, etc.) with enterprise plan
  * Supports multiple views of tickets (e.g. tabular, kanban board, roadmap)
  * Supports key planning features like story points and epics out-of-the-box
* **Cons**
  * Many basic features require enterprise license which has a per-user cost
  * Higher investment of time to set up and maintain the project
  * Sprint boards can't be viewed without logging in
  * Members of the public can't submit requests to a Jira board
  * Doesn't seem to support issue or ticket templates
  * Doesn't seem to support workflow automation
  * Team has less experience working with OpenProject

## Links

* [GitHub Issues](../../../decisions/adr/github-issues/)
* [GitHub Projects](../../../decisions/adr/github-projects/)
  * [GitHub Projects Automation](../../../decisions/adr/github-project-automation/)
  * [GitHub Projects Actions](../../../decisions/adr/github-actions/)
  * [GitHub Projects Reporting](../../../decisions/adr/github-insights/)
  * [GitHub Projects Custom Views](../../../decisions/adr/github-project-views/)
  * [GitHub Projects Custom Fields](../../../decisions/adr/github-project-fields/)
* [Zenhub](../../../decisions/adr/zenhub/)
  * [Zenhub Epics](../../../decisions/adr/zenhub-epics/)
  * [Zenhub Story Points](../../../decisions/adr/zenhub-story-points/)
  * [Zenhub Reporting](../../../decisions/adr/zenhub-reporting/)
* [Jira](../../../decisions/adr/jira/)
  * [Jira Reporting](../../../decisions/adr/jira-reporting/)
  * [Jira Automation](../../../decisions/adr/jira-automation/)
  * [Jira Custom Fields](../../../decisions/adr/jira-custom-fields/)
* [Open Project](../../../decisions/adr/open-project/)
