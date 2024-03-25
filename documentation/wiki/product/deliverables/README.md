---
description: >-
  Describes our process for prioritizing, planning, and completing deliverables
  within the Simpler.Grants.gov initiative.
---

# Deliverables

{% hint style="info" %}
**Note on terminology**

This section references 30k and 10k deliverables. For more information about what these terms mean and how we use them to describe the product roadmap at different levels of granularity, visit the [terminology](../../about/terminology.md) and [product roadmap](../product-roadmap.md) section of the wiki.
{% endhint %}

## Planning process

In addition to tracking our deliverables in a [GitHub-based product roadmap](https://github.com/orgs/HHS/projects/12), we use this section of the wiki to plan upcoming deliverables in greater detail.&#x20;

#### Key Steps

1. **Create an issue:** We beginning planning for a new feature by creating an issue[^1] using the [30k deliverable issue template](https://github.com/HHS/simpler-grants-gov/issues/new/choose), which describes the feature at a 30,000 foot view.
2. **Draft a specification:** Next, we [create a change request](https://docs.gitbook.com/content-editor/editor/change-requests) to draft a new specification for this deliverable using [the deliverable specification template](specification-template.md).
3. **Approve the specification:** Once the team reviews and approves the change request, the new deliverable specification will appear in [the specifications section](specifications/) of the public wiki.
4. **Break work into 10k ft deliverables:** Next, we begin breaking out this 30k deliverable into a series of issues that describe the work that needs to be completed at a 10,000 foot view using the 10k deliverable issue template.
5. **Create a delivery schedule:** The engineering team then estimates a delivery date and creates issues that describe individual tasks that are required to complete this deliverable.
6. **Track and monitor delivery:** The team will typically track these tasks in a series of GitHub milestones that map to the 10k deliverables described under the 30k deliverables.

#### Deliverable status

In the product roadmap and in this section of the wiki, we categorize 30k deliverables into a series of statuses. The following table describes what these statuses mean and indicates whether deliverables with this status will be included in reporting.

<table><thead><tr><th width="140">Status</th><th width="408">Description</th><th>Included in reporting?</th></tr></thead><tbody><tr><td>Backlog</td><td>Deliverable has been identified as a potential feature or need, but we will not be planning or working on it in the near future.</td><td>No</td></tr><tr><td>Prioritized</td><td>The team has agreed to prioritize this deliverable for the next round of planning and we have begun thinking about the scope and goals.</td><td>No</td></tr><tr><td>Planning</td><td>Deliverable is still being planned, meaning we are actively revising scope and haven't yet estimated a target delivery date. <strong>Note:</strong> During this phase, some  work may start on the deliverable.</td><td>Yes</td></tr><tr><td>In Progress</td><td>Deliverable is actively being worked on <strong>and</strong> we have estimated a target delivery date. We <em>may</em> cut existing scope to hit our delivery target, but <em>should not</em> add new scope at this point.</td><td>Yes</td></tr><tr><td>Done</td><td>All of the items in outlined in the "definition of done" for the deliverable specification have been completed and the corresponding GitHub issue is closed.</td><td>No</td></tr></tbody></table>

## Deliverables specifications

A deliverable specification is an in depth planning document that identifies key assumptions, dependencies, and acceptance criteria for a 30k deliverable.

#### Resources

* [**Template:**](specification-template.md) Template used when drafting new deliverable specifications.
* [**Specifications:**](specifications/) Section of the wiki that stores an archive of deliverable specifications.

#### Steps to draft a new deliverable spec

Project maintainers should following these steps when drafting a new deliverable spec:

1. Create a [new change request](https://docs.gitbook.com/content-editor/editor/change-requests) in this GitBook space.
2. Within the change request, duplicate the [\[Specification Template\]](specification-template.md) page by clicking on the three dots to the right of page in the table of contents and selecting "duplicate".
3. Move the duplicated page (it should be named **"Copy of \[Specification Template]"**) under the Specifications sub-section and replace the title with the name of the 30k deliverable.
4. Update the sections of the deliverable specification according to the guidance in the template.
5. When the specification is ready for review, [submit the change request](https://docs.gitbook.com/content-editor/editor/change-requests#request-a-review-on-a-change-request) and schedule an in-person meeting to review the spec with the team.
6. Once the specification has been reviewed with the team and approved, [merge the change request](https://docs.gitbook.com/content-editor/editor/change-requests#merging-a-change-request) and begin planning work in GitHub.

## Change log

Major updates to the content of this page will be added here.

<table><thead><tr><th>Date</th><th width="246">Update</th><th>Notes</th></tr></thead><tbody><tr><td>2/12/2024</td><td>Initial Content</td><td>Updated with Initial content</td></tr><tr><td></td><td></td><td></td></tr><tr><td></td><td></td><td></td></tr></tbody></table>

[^1]: "Issues" are GitHub's way of tracking tasks or units of work that need to be completed within a project. Visit [terminology.md](../../about/terminology.md "mention") for other definitions.
