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
- Users should be able to group by 30k deliverables in the sprint board
- The relationship between issues and 30k deliverables should be consistently represented across all reports

### Limiting the 30k deliverables included in reporting

Our recommended approach to limiting the deliverables that are included in reporting :

- The logic for including a 30k deliverable in reporting should be clear and easy to understand
- Users should be able to add or remove a given 30k deliverable from reports without having to change the underlying logic
- If necessary, users should be able to change the reporting logic without rewriting significant sections of the source code

## Options Considered

### Assigning issues to deliverables

- Add the issue to a milestone that represents a 30k deliverable
- Tag the issue with a label that represents a 30k deliverable
- Use a reserved phrase to tag a 30k deliverable in the body of the issue

### Limiting the 30k deliverables included in reporting

- Use a label to indicate when a deliverable should be included in reporting
- Use the status of the deliverable in the provisional roadmap project

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### {option 1}

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### {option 2}

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
