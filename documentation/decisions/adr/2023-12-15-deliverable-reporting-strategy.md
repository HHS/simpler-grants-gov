# 30k ft deliverable reporting strategy

- **Status:** Active <!-- REQUIRED -->
- **Last Modified:** 2023-12-18 <!-- REQUIRED -->
- **Related Issue:** [#854](https://github.com/HHS/simpler-grants-gov/issues/854) <!-- RECOMMENDED -->
- **Deciders:** <!-- REQUIRED -->
  - Lucas Brown
  - Sarah Knopp
  - Sumi Thaiveettil
  - Aaron Couch
  - Esther Oke
  - Billy Daly
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
- Users should be able to group by 30k deliverables in the sprint board and in [GitHub insights reporting][github-insights]
- The relationship between issues and 30k deliverables should be consistently represented across all reports

### Limiting the 30k deliverables included in reporting

Our recommended approach to limiting the deliverables that are included in reporting should consider the following criteria:

- The logic for including a 30k deliverable in reporting should be clear and easy to understand
- Users should be able to add or remove a given 30k deliverable from reports without having to change the underlying logic
- If necessary, users should be able to change the reporting logic without rewriting significant sections of the source code

## Options considered

### Assigning issues to deliverables

- **Milestones per 10k:** Add the issue to a milestone that represents a 10k deliverable and tag the 30k deliverable in the body of the milestone
- **Milestones per 30k:** Add the issue to a milestone that represents a 30k deliverable
- **Labels:** Tag the issue with a label that represents a 30k deliverable
- **Deliverable column:** Add a custom "deliverable" column to the GitHub projects with values representing each 30k deliverable
- **Reserved phrase:** Use a reserved phrase to tag a 30k deliverable in the body of the issue

### Limiting the 30k deliverables included in reporting

- **Label:** Use a label to indicate when a deliverable should be included in reporting
- **Status:** Use the status of the deliverable in the provisional roadmap project
- **GitHub action:** Explicitly list the deliverables to include in the GitHub action for reporting

## Decision outcomes <!-- REQUIRED -->

### Assigning issues to deliverables

We've decided to use a "deliverable" column to assign issues to a parent 30k deliverable. This involves:

- creating a single select column in both the product roadmap and the sprint board
- populating that column with options that represent each 30k deliverables in our roadmap
- using that column to indicate the 30k deliverable that an issue is assigned to

- **Positive outcomes**
  - We can filter, group, and sort issues by deliverable in GitHub projects and GitHub's automated insight reporting.
  - The engineering team can continue to use GitHub milestones to organize issues into units of work that are smaller than a 30k deliverable. **Note:** While enabling the engineering team to use milestones to organize issues into smaller units of work, we want to avoid situations in which a given milestone contains issues from multiple 30k deliverables -- we can enforce this with a linter as well as a view in the GitHub project.
  - The logic for grouping issues by deliverable will be consistent between GitHub insight reports and our custom-built reports.
- **Negative outcomes**
  - We won't be able to filter for issues assigned to a given 30k deliverable within the GitHub repository.
  - Updating a field on a project can be done from the issue page itself, but the issue first needs to be added to the project before the field is updated. This requires an extra step compared to assigning a label or milestone.
  - We'll have to make sure the list of options in the deliverable column is consistent across GitHub projects in order to join issues from different projects correctly in our custom reporting.
  - We'll have to update the current logic in our custom reporting so that issues are joined to their parent deliverable using the value of this column.

> [!NOTE]
> If the team finds a consistent need to filter the list of issues by deliverable within the repository, we may revisit this decision and choose to use ***both*** a label and a deliverable column to assign an issue to a 30k deliverable. We've decided **not** to use both options for the time being to avoid having multiple (potentially conflicting) ways of assigning an issue to a given deliverable.

### Limiting the 30k deliverables included in reporting

We've decided to use the status of the deliverable in the product roadmap board to determine when deliverables are included or excluded from reporting.

- **Positive outcomes**
  - Keeps our reporting strategy closed aligned with how we're monitoring our delivery progress.
  - Avoids creating *another* field or label that needs to be maintained separately.
- **Negative outcomes**
  - Tightly couples reporting logic with delivery management, which may introduce challenges if there are instances in which we want to report on some but not all deliverables in a given status.
  - If stakeholders aren't familiar with the relationship between deliverable status and reporting, it may be harder for them to understand why certain deliverables appear in a given report but others do not.

## Evaluation - Assigning issues to deliverables <!-- OPTIONAL -->

### Milestones per 10k deliverable

This option involves creating GitHub milestones that loosely map to the 10k deliverables under a given 30k deliverable. Each milestone then uses a key phrase `maps to 30k ft deliverable: #{issue number}` to indicate which 30k deliverable it rolls up to, and each issue assigned to that milestone is counted toward the 30k deliverable that is tagged.

> [!TIP]
> **Bottom line:** This option works for custom reporting, but is probably not the best option moving forward because it doesn't allow us to easily group, search, and filter issues by 30k deliverable in GitHub projects or reporting.

#### Examples

- Milestone mapped to 10k deliverable
- Issue assigned to this milestone

#### Steps to create a 30k deliverable and assign an issue to it

1. Create a 30k deliverable issue
2. Create a milestone that corresponds to a 10k deliverable.
3. Tag the number of the 30k deliverable it rolls up to in the body of the milestone using the phrase "Maps to 30k ft deliverable: #{issue number}"
4. Create an issue representing a task that is required for a given 30k deliverable
5. Assign that issue to the same milestone

#### Steps to rename a 30k deliverable

1. Rename the 30k deliverable issue
2. Rename the milestone that corresponds to the 30k deliverable

- **Pros**
  - Most closely aligns with our current strategy for assigning issues to 30k deliverables.
  - Only requires users to associate milestones to 30k deliverables, instead of each individual issue.
- **Cons**
  - Does not support filtering or searching by 30k deliverable within the GitHub repository.
  - Does not support filtering or searching by 30k deliverable within GitHub projects (e.g. roadmap or sprint board).
  - Does not support grouping by 30k deliverable within GitHub projects or GitHub insight reporting.

### Milestone per 30k deliverable

This option involves creating a milestone for each 30k deliverable and assigning issues to that milestone if they are required for delivery of that 30k.

> [!TIP]
> **Bottom line:** This is the best option if we:
> - want a consistent way to filter and group issues by deliverable across all GitHub projects and reporting as well as within the repository
> - but are okay with preventing the engineering team from using milestones to organize issues into smaller units of work

#### Examples

- Milestone mapped to 30k deliverable
- Issue assigned to this milestone
- Searching for issues with this milestone in the repo
- Searching for issues with this milestone in the GitHub project
- Grouping issues by milestone in the GitHub project
- Grouping issues by milestone in GitHub insight reporting

#### Steps to create a 30k deliverable and assign an issue to it

1. Create a 30k deliverable issue
2. Create a milestone that corresponds to this 30k deliverable
3. Assign the 30k deliverable issue to that milestone
4. Create an issue representing a task that is required for a given 30k deliverable
5. Assign that issue to the same milestone

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

> [!TIP]
> **Bottom line:** This is the best option if:
> - we want a consistent way to filter issues by deliverable in the repository and across GitHub projects
> - but can compromise on being able to **group** by deliverable in GitHub projects or reporting

#### Examples

- Issue with this label
- Searching for issues with this label in the repo
- Searching for issues with this label in the GitHub project
- Attempting to group by label in GitHub insight reporting

#### Steps to create a 30k deliverable and assign an issue to it

1. Create a 30k deliverable issue
2. Create a label that represents this 30k deliverable
3. Apply that label to the 30k deliverable issue
4. Create an issue representing a task that is required for a given 30k deliverable
5. Apply that label to the task-level issue

- **Pros**
  - Allows the engineering team to continue to use GitHub milestones to organize issues into units of work that make sense to them.
  - Supports filtering both within the repository and within GitHub projects (e.g. roadmap and sprint board).
- **Cons**
  - Does not easily support grouping in GitHub projects or GitHub insights reporting.
  - Will result in a large number of labels if 30k labels aren't deleted once a 30k deliverable is complete. And if we delete old deliverable labels, it will impact our ability to report on past deliverables.

### Deliverable column

This option involves creating a single select "deliverable" column in the GitHub projects, with values for each 30k deliverable, and then selecting the corresponding "deliverable" value for each issue added to the project.

> [!TIP]
> **Bottom line:** This is the best option if:
> - we want a consistent way of filtering, grouping, and sorting issues by deliverable in GitHub projects and reporting
> - but can compromise on being able to filter by deliverable in the **repository**

#### Examples

- Issue with this deliverable value
- Searching for issues with this deliverable in the GitHub project
- Grouping issues by deliverable in GitHub project
- Grouping issues by deliverable in GitHub insight reporting

#### Steps to create a 30k deliverable and assign an issue to it

1. Create a 30k deliverable issue
2. Add a new value for this 30k deliverable to the deliverable columns in:
   - The product roadmap GitHub project
   - The sprint planning GitHub project
3. Choose that deliverable value for the 30k deliverable issue in the product roadmap
4. Create an issue representing a task that is required for a given 30k deliverable
5. Choose that deliverable value for the task-level issue in the product roadmap

- **Pros**
  - Allows the engineering team to continue to use GitHub milestones to organize issues into units of work that make sense to them.
  - Supports filtering within GitHub projects (e.g. roadmap and sprint board).
  - Supports grouping within GitHub projects and within GitHub insight reporting.
  - Supports customizing the order of groups on the sprint board when grouping by deliverable -- for example we can make "Static site public launch" appear above "GET Opportunities" even though GET opportunities would be first alphabetically.
- **Cons**
  - Does not support filtering or searching within the GitHub repository.
  - Will result in a large number of values for the deliverable column if not regularly maintained. And if we delete old deliverable values it will impact our ability to report on past deliverables.
  - List of deliverable column values will have to be maintained separately across projects -- inconsistencies between these lists may introduce bugs in custom reporting. Though we could address this by creating a linter and the discrepancy would be easy to notice the next time the report is run.

### Reserved phrase

This option involves tagging a 30k deliverable from the body of each issue using a reserved phrase (e.g. "30k deliverable: #123"). It would function much like [linking a pull request to an issue][linking pull requests] does in GitHub.

> [!TIP]
> **Bottom line:** Probably not the best option unless we only cared about grouping issues by deliverable in custom reporting.

#### Examples

- Issue with this deliverable value
- Searching for issues with this deliverable in the GitHub project
- Grouping issues by deliverable in GitHub project
- Grouping issues by deliverable in GitHub insight reporting

#### Steps to create a 30k deliverable and assign an issue to it

1. Create a 30k deliverable issue
2. Create an issue representing a task that is required for a given 30k deliverable
3. Tag that 30k deliverable in the body of the task using a reserved phrase

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

This option involves creating a label that indicates when a deliverable should be included in reporting (e.g. "add to report") and then filtering for this label in our custom reporting.

> [!NOTE]
> The code should be configured to accept an arbitrary set of labels as filters, so that if the label changes, we only need to change the top-level configuration and not several lines of the source code.

> [!TIP]
> **Bottom line:** This is the best option if we:
> - want an easy way to explicitly indicate when a deliverable should be included or excluded from reporting
> - and are okay with decoupling the reporting logic from the business logic around deliverable status

- **Pros**
  - Makes the choice to include a deliverable in a report explicit and easy to understand.
  - Enables users to add or remove deliverables from reporting without changing the logic or the source code.
  - Makes it easy to change the logic that determines which issue labels are used to include/exclude issues from reporting.
- **Cons**
  - Decouples reporting logic from the status of ongoing deliverables. **Note:** this could be a pro or a con depending on how tightly coupled we want reporting and delivery management to be.
  - Adds to the already long list of labels in the repository.

### Status

This option involves filtering the deliverables that are included in reporting based on their status in the provisional roadmap project. For example, we may only want to report on deliverables that have the status "In progress" or "Planning".

> [!NOTE]
> The code should be configured to accept an arbitrary set of statuses as filters, so that if we want to change which statuses are included, we only need to change the top-level configuration and not several lines of the source code.

> [!TIP]
> **Bottom line:** This is the best option if we:
> - want deliverables to automatically be included in reporting once they enter a specific status (e.g. "in progress")
> - and we don't anticipate edge cases that require including or excluding deliverables from reporting despite their status

- **Pros**
  - Enables users to add or remove deliverables from reporting without changing the logic or the source code.
  - Makes it easy to change the logic that determines which statuses are used to include/exclude issues from reporting.
  - Keeps the reporting and delivery management aligned by automatically updating our reports to reflect the deliverables we're currently working on.
- **Cons**
  - Logic behind which deliverables are included in reporting is not as explicit as having a dedicated label.
  - Requires the reporting logic to be tightly coupled with the rules for assigning deliverable status.

### GitHub action

This option involves specifying the deliverables we want to include in the reporting within the GitHub action itself, either by name or by issue number.

> [!NOTE]
> The code should be configured to accept an arbitrary list of issue titles or numbers, so that if we want to change which deliverables are included, we only need to change the top-level configuration and not several lines of the source code.

> [!TIP]
> **Bottom line:** This is probably not a good option unless we want to version control when we add or remove deliverables from reporting.

- **Pros**
  - Makes the choice to include a deliverable in a report explicit and easy to understand.
  - Prevents someone from accidentally removing a deliverable from reporting by changing a label or status.
- **Cons**
  - Decouples reporting logic from the status of ongoing deliverables. **Note:** this could be a pro or a con depending on how tightly coupled we want reporting and delivery management to be.
  - Does not allow users to add or remove deliverables from reporting without changing a configuration file.
  - Prone to error if users enter the wrong issue title or number.

## Links <!-- OPTIONAL -->

- [Linking pull requests to issues][linking-pull-requests]
- [GitHub insights reporting][github-insights]

[linking-pull-requests]: https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/using-keywords-in-issues-and-pull-requests#linking-a-pull-request-to-an-issue
[github-insights]: https://docs.github.com/en/issues/planning-and-tracking-with-projects/viewing-insights-from-your-project/about-insights-for-projects
