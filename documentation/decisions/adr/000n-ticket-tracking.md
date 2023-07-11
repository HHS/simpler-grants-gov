# Ticket Tracking

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-11 <!-- REQUIRED -->
- **Related Issue:** [#98](https://github.com/HHS/grants-api/issues/98) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Esther Oke, Sumi Thaiveettil, Sarah Knopp, Aaron Couch, Billy Daly 
- **Tags:** communications, sprint planning, agile <!-- OPTIONAL -->

## Context and Problem Statement

The project needs a system for tracking ongoing development work within the project, preferably as a series of tickets that can be organized into sprints. This system would both enable internal stakeholders to prioritize key tasks and assignments throughout the project and help communicate those priorities to external stakeholders.

The goal of this ADR is to evaluate a series of ticket tracking systems and select the one we will be using for the project.

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Ticket Tracking:** Tickets can be organized into sprints and tracked as part of larger milestones or epics
- **Public Access:** Without logging in, members of the public can see tickets that are being worked on
- **Public Requests:** Members of the public can submit bug reports and feature requests and track how that work is being prioritized
- **Templates:** The system supports default templates for different types of tickets which prompts the person creating the ticket for a specific set of information
- **Authority to Operate (ATO):** The platform already must be authorized under the Grants.gov ATO (Authority to Operate) or ATO coverage must be requested

#### Nice to Have

- **Level of Effort Estimates:** Tickets can be assigned an estimated level of effort (e.g. story points, t-shirt size, etc.)
- **Reporting:** Users can report on key metrics like burndown, point allocation, etc. from directly within the tool
- **Custom Views:** Users can create custom views for managing tickets with multiple layouts (e.g. kanban board, tabular, roadmap)
- **Custom Fields:** Users can create custom fields and views to manage their projects
- **Automation:** Users can automate basic workflows like adding and moving tickets, linking PRs to their originating PRs, etc.
- **Open Source:** The tool used to manage and host the wiki content should be open source, if possible

## Options Considered

- [GitHub Issues + Zenhub](#github-issues--zenhub)
- [GitHub Issues + GitHub Projects](#github-issues--github-projects)
- [Jira](#jira)
- [OpenProject](#openproject)

## Decision Outcome <!-- REQUIRED -->

We are planning to use **GitHub issues with GitHub projects** because it is the only solution that allows members of the public to submit feature requests and bug reports and then track how those issues are being prioritized within upcoming sprints. Additionally, the use of these tools is free with public repositories and offers other helpful features such as custom fields and views.

**NOTE:** Given some of the constraints around reporting, we may want to continue to explore options that extend the reporting GitHub project. Similarly, team productivity meaningfully affected by the absence of the more robust features that Jira or Zenhub offers, we may want to re-evaluate this decision after an initial trial period.

### Positive Consequences <!-- OPTIONAL -->

- We do not need to purchase licenses or seek ATO approval to start begin tracking tickets and planning sprints
- Members of the public can submit feature requests or bug tickets and track how those requests are being prioritized and worked on
- We can manage all of our sprint planning and development within the same platform
- We can extend GitHub project functionality with custom-built automations

### Negative Consequences <!-- OPTIONAL -->

- We will need to develop custom reports to track some of the same metrics that Jira or Confluence offers out of the box
- We will need to spend a bit more time setting up the GitHub project to replicate some of the features that Jira or Confluence offers (e.g. story points, sprints, epics, etc.)
- Team members who are familiar with Jira and Zenhub will need to spend a bit more time becoming familiar with GitHub Projects

## Comparison Matrix

- ✅ Feature available, meets requirement
- ❌ Feature not available, does not meet requirement
- 🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
- 1-3 Strength level
- ❓Unknown

| Factor                    |    Zenhub     | GitHub Projects |     Jira      |  OpenProject  |
| ------------------------- | :-----------: | :-------------: | :-----------: | :-----------: |
| Cost                      | $8.33/user/mo |      Free       | $7.75/user/mo | $7.25/user/mo |
| Ticket Tracking           |      ✅       |       ✅        |      ✅       |      ✅       |
| Public Access             |      🔄      |       ✅        |      ❌       |      ❌       |
| Public Requests           |      ✅       |       ✅        |      ❌       |      ❌       |
| Issue Templates           |      🔄      |       ✅        |      ✅       |      ❌       |
| Authority to Operate      |      🔄      |       ✅        |      ✅       |      ✅       |
| Level of Effort Estimates |      ✅       |       ✅        |      ✅       |      ✅       |
| Reporting                 |      ✅       |       🔄       |      ✅       |      ✅       |
| Custom Views              |      🔄      |       ✅        |      ✅       |      🔄      |
| Custom Fields             |      ❌       |       ✅        |      ✅       |      🔄      |
| Automation                |      🔄      |       ✅        |      ✅       |      ❌       |
| Open Source               |      ❌       |       ❌        |      ❌       |      ✅       |

## Pros and Cons of the Options <!-- OPTIONAL -->

### GitHub Issues + Zenhub

Use [GitHub Issues](github-issues) to create and manage development tickets and use Zenhub to organize those tickets into sprints.

- **Pros**
  - Built off of existing GitHub tickets and functionality
  - Robust [reporting](zenhub-reporting) (e.g. burndown charts, velocity, etc.) out of the box
  - Supports key planning features like [story points](zenhub-story-points) and [epics](zenhub-epics)
  - Supports issue templates (through GitHub)
  - Chrome extension to view Zenhub attributes in GitHub
  - Team has experience working with Zenhub
- **Cons**
  - Licenses have a monthly fee, even for Government-backed open source projects
  - Sprint boards can't be viewed without Zenhub login
  - Moving tickets requires both Zenhub and GitHub logins and write access to the repository
  - Can be difficult to onboard existing Zenhub users to a new workspace
  - GitHub form-based templates don't work when creating issues from Zenhub
  - Limited support for custom views (e.g. no tabular layout)
  - No support for custom fields

### GitHub Issues + GitHub Projects

Use [GitHub Issues](github-issues) to create and manage development tickets and use GitHub projects to organize those tickets into sprints.

- **Pros**
  - Keeps ticket creation and sprint planning in the same platform alongside code
  - Free for open source repositories
  - GitHub project boards can be viewed without a GitHub login
  - Supports issue templates (through GitHub)
  - Supports multiple [views of tickets](github-project-views) (e.g. tabular, kanban board, roadmap)
  - Supports custom fields with multiple data types (e.g. numbers, drop downs, iterations, text fields, etc.)
  - Supports [custom reporting](github-insights) based on those fields
  - Supports [built-in workflow automation](github-project-automation) and custom automation with [GitHub actions](github-actions)
  - Supports filters on all standard and custom fields
  - Covered under the existing Grants.gov ATO
- **Cons**
  - Reporting is less robust than Zenhub and Jira
  - Requires more initial setup to replicate some of Jira or Zenhub's out-of-the-box features
  - Team has less experience working with GitHub projects

### Jira

Use Confluence's [Jira](jira) platform for both ticket management and sprint planning.

- **Pros**
  - Industry standard tool for ticket tracking and sprint planning
  - Robust [reporting](jira-reporting) (e.g. burndown charts, velocity, etc.) out of the box
  - Supports [custom fields](jira-custom-fields) with multiple data types (e.g. numbers, drop downs, text fields, etc.)
  - Supports multiple views of tickets (e.g. tabular, kanban board, roadmap)
  - Supports filters on all standard and custom fields
  - Supports built-in [workflow automation](jira-automation)
  - Supports custom ticket templates
  - Team has experience working with Jira
- **Cons**
  - Licenses have a monthly fee (above 10 users)
  - Sprint boards can't be viewed without Zenhub login
  - Members of the public can't submit requests to a Jira board
  - Requires tracking tickets and planning sprints on a different platform

### OpenProject

Use the open source project management tool [OpenProject](open-project) for both ticket management and sprint planning.

- **Pros**
  - Open source project with self-hosting option
  - Robust reporting (e.g. burndown charts, velocity, etc.) with enterprise plan
  - Supports multiple views of tickets (e.g. tabular, kanban board, roadmap)
  - Supports key planning features like story points and epics out-of-the-box
- **Cons**
  - Many basic features require enterprise license which has a per-user cost
  - Higher investment of time to set up and maintain the project
  - Sprint boards can't be viewed without logging in
  - Members of the public can't submit requests to a Jira board
  - Doesn't seem to support issue or ticket templates
  - Doesn't seem to support workflow automation
  - Team has less experience working with OpenProject

## Links <!-- OPTIONAL -->

- [GitHub Issues](github-issues)
- [GitHub Projects](github-projects)
  - [GitHub Projects Automation](github-project-automation)
  - [GitHub Projects Actions](github-actions)
  - [GitHub Projects Reporting](github-insights)
  - [GitHub Projects Custom Views](github-project-views)
  - [GitHub Projects Custom Fields](github-project-fields)
- [Zenhub](zenhub)
  - [Zenhub Epics](zenhub-epics)
  - [Zenhub Story Points](zenhub-story-points)
  - [Zenhub Reporting](zenhub-reporting)
- [Jira](jira)
  - [Jira Reporting](jira-reporting)
  - [Jira Automation](jira-automation)
  - [Jira Custom Fields](jira-custom-fields)
- [Open Project](open-project)

[github-issues]: https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues
[github-projects]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
[github-project-automation]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations
[github-actions]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions
[github-insights]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects
[github-project-views]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view
[github-project-fields]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-text-and-number-fields
<!-- Zenhub -->
[zenhub]: https://www.zenhub.com/
[zenhub-epics]: https://help.zenhub.com/support/solutions/articles/43000500733-getting-started-with-epics
[zenhub-story-points]: https://help.zenhub.com/support/solutions/articles/43000010347-estimate-work-using-story-points
[zenhub-reporting]: https://www.zenhub.com/reporting
<!-- Jira -->
[jira]: https://www.atlassian.com/software/jira
[jira-reporting]: https://www.atlassian.com/software/jira/features/reports
[jira-automation]: https://www.atlassian.com/software/jira/features/automation
[jira-custom-fields]: https://support.atlassian.com/jira-cloud-administration/docs/create-a-custom-field/
<!-- OpenProject -->
[open-project]: https://www.openproject.org/
