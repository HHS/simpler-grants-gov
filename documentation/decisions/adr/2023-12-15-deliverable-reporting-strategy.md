# 30k ft deliverable reporting strategy

- **Status:** Active <!-- REQUIRED -->
- **Last Modified:** 2023-12-18 <!-- REQUIRED -->
- **Related Issue:** [#854](https://github.com/HHS/simpler-grants-gov/issues/854) <!-- RECOMMENDED -->
- **Deciders:** <!-- REQUIRED -->
  - Lucas Brown
  - Billy Daly
  - Sarah Knopp
  - Sumi Thaiveettil
  - Aaron Couch
- **Tags:** analytics, github

## Context and Problem Statement

In order to report on the progress we're making toward our 30,000 foot deliverables (30k deliverables), we need to be able to connect those deliverables to the ground-level tasks that need to be completed for delivery. Being able to reliably identify which tasks are required for a given deliverable not only enables us to report key metrics like burnup or percent completion for each deliverable, it also allows us to understand which deliverables are being worked on within a given sprint.

Currently, however, we do not have a consistent strategy for indicating which 30k deliverable a given issue is associated with. For custom reporting, we have been using the milestone that an issue is assigned to as a proxy for its 30k deliverable, and for our sprint board, we've been using issue labels to drive filtering and reporting. The fact that we represent this hierarchy differently across reporting channels creates an additional maintenance overhead and increases the likelihood of presenting conflicting information between reports.

Additionally, as the number of 30k deliverables defined for the project grows, we'll need to adjust our strategy for including them in project reporting. By default, we include all 30k deliverables in our reports, but this results in a large chart where in which many deliverables have no points or issues assigned to them. In order to more accurately reflect the status of our deliverables, we need to determine when and how to include them in reporting.

In light of these needs, the goal of this ADR is to:

1. Recommend a consistent strategy for assigning issues to a parent 30k deliverable across reporting channels
2. Recommend an approach to limiting the number of 30k deliverables that appear in our reports

## Decision Drivers <!-- RECOMMENDED -->

### Assigning issues to deliverables

Our recommended strategy for assigning issues to a given 30k deliverable should consider the following criteria:

- Users assigning an issue to a 30k deliverable should only need to update that value in one place
- Users should be able to search or filter for the issues assigned to a given 30k deliverable
- Users should be able to group by 30k deliverables in the sprint board and in GitHub insights reporting
- The relationship between issues and 30k deliverables should be consistently represented across all reports

### Limiting the 30k deliverables included in reporting

Our recommended approach to limiting the deliverables that are included in reporting :

- The logic for including a 30k deliverable in reporting should be clear and easy to understand
- Users should be able to add or remove a given 30k deliverable from reports without having to change the underlying logic
- If necessary, users should be able to change the reporting logic without rewriting significant sections of the source code

## Options considered

### Assigning issues to deliverables

- **Milestones:** Add the issue to a milestone that represents a 30k deliverable
- **Labels:** Tag the issue with a label that represents a 30k deliverable
- **Deliverable column:** Add a custom "deliverable" column to the GitHub projects with values representing each 30k deliverable
- **Reserved phrase:** Use a reserved phrase to tag a 30k deliverable in the body of the issue

### Limiting the 30k deliverables included in reporting

- **Label:** Use a label to indicate when a deliverable should be included in reporting
- **Status:** Use the status of the deliverable in the provisional roadmap project
- **GitHub action:** Explicitly list the deliverables to include in the GitHub action for reporting

## Decision outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Evaluation - Assigning issues to deliverables <!-- OPTIONAL -->

### Milestone

This option involves creating a milestone for each 30k deliverable and assigning issues to that milestone if they are required for delivery of that 30k.

> [!NOTE]
> This is a slightly different use of milestones than the project currently supports. Right now, the engineering team can create multiple milestones for a given 30k deliverable and reporting is driven by tagging the parent 30k deliverable in the description of the milestone. This new approach would require a *single* milestone per 30k deliverable and all tickets associated with that deliverable would need to be added to the milestone to be included in reporting.

- **Pros**
  - Ensures that there is just one source of truth for the list of issues associated with a given 30k deliverable.
  - Supports filtering both within the repository and within GitHub projects (e.g. roadmap and sprint board).
  - Supports grouping both within the GitHub projects and within GitHub insight reporting.
- **Cons**
  - Prevents the engineering team from using GitHub milestones to organize and group related issues outside of the 30k deliverable framework.
  - Milestones that represent 30k deliverables will have a *lot* of tickets unless we work on downscoping 30k deliverables.
  - Does not support customizing the order of the groups on the sprint board when grouping by milestone -- milestones can only be sorted alphabetically.

### Label

This option involves creating a label for each 30k deliverable with a consistent prefix (e.g. `30k: Public launch`) and then applying this label to each of the issues required for delivery of that 30k.

- **Pros**
  - Allows the engineering team to continue to use GitHub milestones to organize issues into units of work that make sense to them.
  - Supports filtering both within the repository and within GitHub projects (e.g. roadmap and sprint board).
- **Cons**
  - Does not easily support grouping in GitHub projects or GitHub insights reporting.
  - Will result in a large number of labels if 30k labels aren't deleted once a 30k deliverable is complete.

### Deliverable column

This option involves creating a single select "deliverable" column in the GitHub projects, with values for each 30k deliverable, and then selecting the corresponding "deliverable" value for each issue added to the project.

- **Pros**
  - Allows the engineering team to continue to use GitHub milestones to organize issues into units of work that make sense to them.
  - Supports filtering within GitHub projects (e.g. roadmap and sprint board).
  - Supports grouping within GitHub projects and within GitHub insight reporting.
  - Supports customizing the order of groups on the sprint board when grouping by deliverable -- for example we can make "Static site public launch" appear above "GET Opportunities" even though GET opportunities would be first alphabetically.
- **Cons**
  - Does not support filtering or searching within the GitHub repository.
  - Will result in a large number of values for the deliverable column if not regularly maintained.
  - List of deliverable column values will have to be maintained separately across projects -- inconsistencies between these lists may introduce bugs in custom reporting.

### Reserved phrase

This option involves tagging a 30k deliverable from the body of each issue using a reserved phrase (e.g. "30k deliverable: #123"). It would function much like [linking a pull request to an issue][linking pull requests] does in GitHub.

- **Pros**
  - Allows the engineering team to continue to use GitHub milestones to organize issues into units of work that make sense to them.
  - Easy to parse in custom reporting.
- **Cons**
  - Does not support filtering or searching within the GitHub repository.
  - Does not support filtering or searching within GitHub projects (e.g. roadmap or sprint board).
  - Does not support grouping within GitHub projects or GitHub insight reporting.
  - Very difficult to audit or maintain programmatically.

## Evaluation - Limiting 30k deliverables in reporting <!-- OPTIONAL -->

### Label

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Status

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### GitHub action

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

## Links <!-- OPTIONAL -->

- [{Link name}](link to external resource)
- ...

[linking pull requests]: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/using-keywords-in-issues-and-pull-requests#linking-a-pull-request-to-an-issue
