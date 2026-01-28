---
description: >-
  ADR documenting our decision to use Fider to engage the public in co-planning
  our product roadmap by voting on features they'd like to see delivered.
---

# Co-planning tool

* **Status:** Accepted
* **Last Modified:** 2025-08-25
* **Deciders:** Lucas, Brandon, Michael, Wendy, Sarah, Billy
* **Tags:** participatory budgeting, civic engagement, tool selection, pb pilot

### Context and problem statement

SimplerGrants has decided that co-planning is an approach we’d like to use to democratize future development work on the application as well as keep track of backlog ideas and participant feedback related to them. Co-planning refers to the ability for users to view information about prospective features prioritized for near-term development and indicate which ones interest them the most. It allows them to participate in prioritizing our work stack. Ideally, we will build features that users want and need the most, and we can receive that feedback clearly through a system where users can vote on and possibly propose what they’d like to see most.

To achieve this goal, we need to select a tool that enables members of the public to vote and provide feedback on the features we are prioritizing in our roadmap.

### Decision outcome

We have selected **Fider** as our co-planning tool on [SimplerGrants.gov](http://simplergrants.gov) and [CommonGrants.org](http://commongrants.org). Fider is an open-source feature voting tool that we chose because it can two-way sync with Github, it is low-cost, uses authentication for voting, and has a simple user interface.

To choose a tool, we conducted usability tests with prototypes of the top three tool contenders: Fider, Featurebase, and a custom coded solution. Before testing, we had anticipated using Fider to allow members of the public to vote on features in our roadmap because it met the acceptance criteria best out of the tools assessed. We still wanted to learn from users about their preferences in the way potential work items are presented to them, though, in addition to how each application’s features resonate with them.

While we discovered some UX challenges with Fider, we still believe that it is the best choice and that we can overcome some of the pain points discovered by making adjustments, creating training, and opening discussion with the Fider team to share our research findings and discuss collaboration.

**Positive consequences**

* Allows us to quickly set up a feedback board with proposals loaded from GitHub
* Gives us the option to self-host if we need more security or Fider discontinues its own cloud-hosted option
* Allows us to fork and modify the codebase if needed, with the option of contributing back to the main Fider repository
* Inexpensive at $51.94/mo

**Negative consequences**

* Several UX pain points surfaced by users that we’ll need to work through or provide training for
* We’ll have to set up and pay for multiple Fider boards if we want to segment feedback or support different sets of proposals if we are not using labels on the Github tickets
* We can’t easily embed feature voting in [Simpler.Grants.gov](http://simpler.grants.gov)
* Adding or customizing Fider’s baseline functionality might be harder to do than a completely custom-built solution

### Decision criteria

* Clean UI/UX: The tool has a simple and intuitive UI/UX with minimal distractions.
* GitHub integration: GitHub issues can be loaded into the tool automatically or via API.
* Low costs: The direct and indirect costs to maintain the tool are minimal.
* Open source: The tool is open source and can be self-hosted, if needed.
* Authentication: Users are required to log in to vote.
* Customizability: The tool’s functionality can be easily extended or integrated with existing [Simpler.Grants.gov](http://simpler.grants.gov) services.
* Advanced features: The tool supports advanced features, like:
* User segmentation: Grouping votes by user type (e.g. grantors, applicants, etc.)
* Proposal sizing: Assigning proposals story points based on level of effort
* Custom fields: Storing custom attributes or structured data about a proposal
* Multi-board management: Managing multiple feedback boards under a single organization.
* Voting strategies: The tool supports multiple voting strategies, like:
* Single upvote or downvote per proposal
* Multiple upvotes or downvotes
* Budget-based voting
* Rank choice voting

### Options considered

**Primary options**

After a significant amount of research, we narrowed our focus to the following tools in three main categories:

* [Open source tool: Fider](https://docs.google.com/document/d/1XzYbtpj7Gk1aRXJEkDf1MuAh7_qzpzXl5DcdYQS6t7o/edit?tab=t.er6uw3c0ud2s#heading=h.n7295ga79ra0)
* [Commercial tool: FeatureBase](https://docs.google.com/document/d/1XzYbtpj7Gk1aRXJEkDf1MuAh7_qzpzXl5DcdYQS6t7o/edit?tab=t.er6uw3c0ud2s#heading=h.chtbtkz5casq)
* [Custom-built tool](https://docs.google.com/document/d/1XzYbtpj7Gk1aRXJEkDf1MuAh7_qzpzXl5DcdYQS6t7o/edit?tab=t.er6uw3c0ud2s#heading=h.4ftfunec3nkg)

**Others researched**

These were the other tools researched and the reason we didn’t explore them further:

<table><thead><tr><th width="174.67578125">Tool</th><th width="150.015625">Category</th><th>Reason not chosen</th></tr></thead><tbody><tr><td>GitHub issues</td><td>Commercial</td><td>Complex UI, requires GitHub login</td></tr><tr><td>GitHub discussions</td><td>Commercial</td><td>Complex UI, requires GitHub login</td></tr><tr><td>Trello</td><td>Commercial</td><td>Voting requires plugins and per-user licenses</td></tr><tr><td>ProductBoard</td><td>Commercial</td><td>More complex UI and API than FeatureBase</td></tr><tr><td>Cobudget</td><td>Open source</td><td>No basic upvoting, poorly documented API</td></tr><tr><td>Stanford PB</td><td>Open source</td><td>No basic upvoting, no public API</td></tr><tr><td>Decidim</td><td>Open source</td><td>More complex UI than Fider, read-only API</td></tr></tbody></table>

### Evaluation

#### Side-by-Side

<table><thead><tr><th width="281.97265625">Criteria</th><th>Fider</th><th>FeatureBase</th><th>Custo</th></tr></thead><tbody><tr><td>Clean and simple UI/UX</td><td>🟡</td><td>🟡</td><td>✅</td></tr><tr><td>GitHub integration / public API</td><td>✅</td><td>✅</td><td>✅</td></tr><tr><td>Low cost maintenance</td><td>✅</td><td>✅</td><td>❌</td></tr><tr><td>Open source</td><td>✅</td><td>❌</td><td>✅</td></tr><tr><td>Easy to integrate / customize</td><td>🟡</td><td>❌</td><td>🟡</td></tr><tr><td>Advanced features</td><td>❌</td><td>✅</td><td>🟡</td></tr><tr><td>Multiple voting strategies</td><td>❌</td><td>❌</td><td>🟡</td></tr></tbody></table>

#### Fider

[Fider.io](http://fider.io) is an open source feature voting tool. It can be self-hosted or cloud-hosted by Fider for $50/board/mo.

{% hint style="info" %}
**Bottom line**

Fider is the best tool if:

* We want an open-source tool for feature voting with a simple user interface and public API that we could modify or host ourselves,
* But we can compromise on the more advanced features offered by FeatureBase and the level of customization offered by a custom-built solution.
{% endhint %}

**Pros**

* Clean user interface that supports key features
* Public API that supports both loading and exporting data
* Open source, making it possible to modify or self-host
* Available as a managed solution for $50/board/mo

**Cons**

* Usability test participants found the UI less intuitive than both the custom solution and FeatureBase
* Usability test participants ran into issues with the login process, which required clicking a link sent to their email
* Supports only a single upvote or downvote per proposal, with no total vote limit
* Doesn’t support the following advanced features available in FeatureBase:
* User segmentation: Grouping votes by user type (e.g. grantors, applicants, etc.)
* Proposal sizing: Assigning proposals story points based on level of effort
* Custom fields: Storing custom attributes or structured data about a proposal
* Doesn’t easily support using [Login.gov](http://login.gov) for authentication.
* Customizing the functionality of Fider would require switching to self-hosting or having discussions with the Fider team about options.
* Doesn’t support managing multiple feedback boards under the same “organization” and requires paying separately for each board.

#### FeatureBase

FeatureBase is a Commercial Off-the-Shelf (COTS) feature voting and roadmapping tool. It is a managed solution with various pricing tiers. We would need the Business Pro plan for $250/mo.<br>

{% hint style="info" %}
**Bottom line**

FeatureBase is the best tool if:

* We want an off-the-shelf tool with direct support for advanced roadmap features like user segmentation, support for multiple boards, and proposal sizing,
* But we are willing to accept using a closed source tool with a slightly more cluttered UI and limited customization options.
{% endhint %}

**Pros**

* Usability test participants liked the additional prompts around importance, frequency of use, and urgency
* Robust feature set, including support for:
* User segmentation
* Proposal sizing
* Custom fields
* Multi-board management
* Public API that supports both loading and exporting data
* Available as a managed solution for $250/mo with unlimited boards and end users

**Cons**

* Supports only a single upvote or downvote per proposal, with no total vote limit
* Slightly more complex and cluttered UI/UX than Fider
* Doesn’t easily support using [Login.gov](http://login.gov) for authentication
* Closed source, which doesn’t allow us to modify functionality or self-host

#### Custom solution

Involves building a [custom solution](https://pb-tools.billy-daly.workers.dev/) that could either be embedded in [Simpler.Grants.gov](http://simpler.grants.gov) or hosted as a standalone application.<br>

{% hint style="info" %}
**Bottom line**

A custom-built solution probably doesn’t make sense unless we want to integrate feature voting directly into [Simpler.Grants.gov](http://simpler.grants.gov) or support complex features that can’t easily be added to a fork of the Fider repo.
{% endhint %}

**Pros**

* Usability test participants found this tool the most user friendly
* Maximum control over the look and feel of the tool
* Would allow us to integrate feature voting directly into [Simpler.Grants.gov](http://simpler.grants.gov)
* Would allow us to support complex voting strategies not available in Fider or FeatureBase (ranked choice, budget-based voting, etc.)

**Cons**

* Requires a lot of upfront development to replicate features that are available out-of-the-box with Fider or FeatureBase
* Requires more overhead to maintain and host the tool
* May reduce capacity available to build and maintain core [Simpler.Grants.gov](http://simpler.grants.gov) features
* Usability test participants might find this tool less user friendly if we required authenticating with [Login.gov](http://login.gov) <br>
