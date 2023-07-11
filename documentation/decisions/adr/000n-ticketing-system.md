# Ticket Tracking

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-11 <!-- REQUIRED -->
- **Related Issue:** [#98](https://github.com/HHS/grants-api/issues/98) <!-- RECOMMENDED -->
- **Deciders:** {list everyone involved in the decision} <!-- REQUIRED -->
- **Tags:** communications, sprint planning, agile <!-- OPTIONAL -->

## Context and Problem Statement

The project needs a system for tracking ongoing development work within the project, preferably as a series of tickets that can be organized into sprints. This system would both enable internal stakeholders to prioritize key tasks and assignments throughout the project and help communicate those priorities to external stakeholders.

The goal of this ADR is to evaluate a series of ticket tracking systems and select the one we will be using for the project.

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Onboarding:** New users can be onboarded to the tool for no cost to the user in a process that takes less than 2 days
- **Ticket Tracking:** Tickets can be organized into sprints and tracked as part of larger milestones or epics
- **Public Access:** Without logging in, members of the public can see tickets that are being worked on
- **Public Requests:** Members of the public can submit bug reports and feature requests and track how that work is being prioritized
- **Templates:** The system supports default templates for different types of tickets which prompts the person creating the ticket for a specific set of information
- **Authority to Operate (ATO):** The platform already must be authorized under the Grants.gov ATO (Authority to Operate) or ATO coverage must be requested

#### Nice to Have

- **Level of Effort Estimates:** Tickets can be assigned an estimated level of effort (e.g. story points, t-shirt size, etc.)
- **Reporting:** Users can report on key metrics like burndown, point allocation, etc. from directly within the tool
- **Roadmap:** The system provides views that lets users understand how individual tickets rollup into a broader project roadmap as well as the status of milestones within that roadmap
- **Custom Fields and Views:** Users can create custom fields and views to manage their projects
- **Open Source:** The tool used to manage and host the wiki content should be open source, if possible

## Options Considered

- GitHub Issues + Zenhub
- GitHub Issues + GitHub Projects
- Jira
- OpenProject

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### GitHub Issues + Zenhub

Use [GitHub Issues](github-issues) to create and manage development tickets and use Zenhub to organize those tickets into sprints.

- **Pros**
  - Built off of existing GitHub tickets and functionality
  - Robust reporting (e.g. burndown charts, velocity, etc.) out of the box
  - Supports key planning features like story points and epics
  - Supports issue templates (through GitHub)
  - Chrome extension to view Zenhub attributes in GitHub
  - Nava team has experience working with Zenhub
- **Cons**
  - Licenses have a monthly fee, even for Government-backed open source projects
  - Sprint boards can't be viewed without Zenhub login
  - Moving tickets requires both Zenhub and GitHub logins and write access to the repository
  - It can be difficult to onboard existing Zenhub users to a new workspace
  - GitHub form-based templates don't work when creating issues from Zenhub
  - Most limited set of views for tickets across all ticketing systems
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
  - Nava team and HHS has less experience working with GitHub projects

### Jira

Use Confluence's Jira platform for both ticket management and sprint planning.

- **Pros**
  - Industry standard tool for ticket tracking and sprint planning
  - Robust [reporting](jira-reporting) (e.g. burndown charts, velocity, etc.) out of the box
  - Supports [custom fields](jira-custom-fields) with multiple data types (e.g. numbers, drop downs, text fields, etc.)
  - Supports multiple views of tickets (e.g. tabular, kanban board, roadmap)
  - Supports filters on all standard and custom fields
  - Supports built-in [workflow automation](jira-automation)
  - Supports custom ticket templates
- **Cons**
  - Licenses have a monthly fee
  - Sprint boards can't be viewed without Zenhub login
  - Requires tracking tickets and planning sprints on a different platform

## Links <!-- OPTIONAL -->




[github-issues]: https://docs.github.com/en/issues/tracking-your-work-with-issues/about-issues
[github-projects]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects
[github-project-automation]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations
[github-actions]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/automating-projects-using-actions
[github-insights]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects
[github-project-views]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/changing-the-layout-of-a-view
[github-project-fields]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/understanding-fields/about-text-and-number-fields
<!-- Zenhub -->
[zenhub]: 
<!-- Jira -->
[jira-reporting]: https://www.atlassian.com/software/jira/features/reports
[jira-automation]: https://www.atlassian.com/software/jira/features/automation
[jira-custom-fields]: https://support.atlassian.com/jira-cloud-administration/docs/create-a-custom-field/
