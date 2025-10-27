---
description: >-
  Outlines key strategies for adopting and maintaining CommonGrants routes in
  the Simpler.Grants.gov API
---

# CommonGrants adoption in SGG

* **Status:** Accepted
* **Last Modified:** 2025-10-27
* **Related Issue:** [#6726](https://github.com/HHS/simpler-grants-gov/issues/6726)
* **Deciders:** Matt, Michael, David, Billy
* **Tags:** API, CommonGrants

### Context and Problem Statement

We’ve implemented the first round of CommonGrants (CG) compliant routes within the Simpler.Grants.gov (SGG) API, and these routes are currently live in staging. However, as we prepare to make these routes available in the production environment, we need to answer the following questions about CG adoption and maintenance in SGG:

* **Tech stack:** What should be the long-term technical approach to supporting CG in the SGG API?
* **Resolving discrepancies:** Where and how should existing discrepancies between SGG API framework and CG protocol be resolved?
* **Maintenance:** How should we divide the responsibilities for troubleshooting and maintaining CG-related functionality within SGG?

### Decision Drivers

#### Tech stack criteria

* Reuse existing infrastructure and services (e.g., authentication, logging, deployment) where possible
* Allow sufficient control over route behavior to align with CG protocol requirements
* Optimize for team familiarity with frameworks and tools

#### Resolving discrepancies criteria

* Avoid overfitting the protocol to the limitations of SGG’s current implementation
* Minimize complex or brittle workarounds in both SGG implementation and CG tooling
* Ensure consistent behavior for future adopters of the CG protocol

#### Maintenance criteria

* Align ownership with team capacity and codebase familiarity
* Assign responsibility based on the origin of errors or breaking changes
* Discourage upstream-breaking changes through clear ownership and feedback loops

### Options Considered

#### Tech stack options

* [Same framework, integrated router](2025-10-27-common-grants-in-sgg.md#same-framework-integrated-routers)
* [Same framework, isolated app](2025-10-27-common-grants-in-sgg.md#same-framework-isolated-app)
* [Different framework](2025-10-27-common-grants-in-sgg.md#different-framework)

#### Resolving discrepancies options

* [Fix SGG implementation](2025-10-27-common-grants-in-sgg.md#fix-sgg-implementation)
* [Update CG protocol](2025-10-27-common-grants-in-sgg.md#update-cg-protocol)
* [Handle in CG tooling](2025-10-27-common-grants-in-sgg.md#handle-in-cg-tooling)

#### Maintenance options

* [A6-maintained](2025-10-27-common-grants-in-sgg.md#a6-maintained)
* [Nava-maintained](2025-10-27-common-grants-in-sgg.md#nava-maintained)
* [Shared maintenance](2025-10-27-common-grants-in-sgg.md#shared-maintenance)

### Decision Outcomes

#### Tech stack decision

Proceed with integrated endpoints within the existing SGG API framework for now. Revisit this decision when introducing route versioning or similar features unsupported by APIFlask, at which point migrating to an isolated router (APIFlask or other flask extension) may be necessary.

**Positive consequences**

* Leverages shared infrastructure (auth, logging, monitoring, deployment)
* Uses familiar frameworks and implementation patterns
* Simplifies deployment and reduces overhead

**Negative consequences**

* Limits ability to version endpoints under the current framework
* Requires workarounds to align CG behavior with SGG implementation, leaving some discrepancies unresolved

#### Resolving discrepancies decision

We’ll use the following table to guide where and how we fix existing and future discrepancies. Most of the current discrepancies remaining are likely to fall into the second scenario and will be addressed by future updates to the CLI’s check spec command that validates API compliance.

| Scenario                                                                 | Resolution             |
| ------------------------------------------------------------------------ | ---------------------- |
| Issue reveals a gap or ambiguity in protocol design                      | Update CG protocol     |
| Issue affects multiple adopters, but shouldn’t result in protocol change | Handle in CG tooling   |
| Issue is specific to SGG’s framework or implementation                   | Fix SGG implementation |

**Positive consequences**

* Creates clear separation of concerns across systems and layers
* Prevents implementation-specific limitations from influencing protocol design
* Enables faster resolution of issues that do not require protocol-wide changes

**Negative consequences**

* Can lead to additional complexity in CG tooling over time
* May introduce inconsistencies across implementations based on how CG tooling is configured

#### Maintenance decision

Adopt a shared maintenance model that reflects the relative knowledge and constraints of each team. The goal is to approximate third-party adoption of CommonGrants by having Nava lead day-to-day operational maintenance of the routes (similar to the rest of the SGG API), while having Agile Six provide direct support for handling breaking changes that originate from the CommonGrants protocol or tooling.&#x20;

<table><thead><tr><th width="360.52734375">Scenario</th><th>Responsibility</th></tr></thead><tbody><tr><td>CG protocol, CLI, or SDKs are updated or contain a bug</td><td>A6 updates endpoints</td></tr><tr><td>SGG services, infrastructure, or operational tooling are updated or contain a bug</td><td>Nava updates endpoints</td></tr><tr><td>Day-to-day operational maintenance of the endpoints, like monitoring, reporting, etc.</td><td>Nava leads, matching responsibility for other endpoints in the SGG API</td></tr><tr><td>API logs an error in CG endpoints</td><td>Nava triages, delegates based on source</td></tr><tr><td>Source of the bug is ambiguous</td><td>Both teams coordinate</td></tr></tbody></table>

**Positive consequences**

* Aligns ownership with team capacity and familiarity with different areas of the codebase
* Clarifies responsibility for updating CG endpoints based on the source of the issue or change
* Encourages both teams to avoid introducing breaking changes to protocol or service layers
* Pilots a maintenance model that approximates third-party adoption of CG for external APIs

**Negative consequences**

* Requires both teams to reserve some capacity for updating and triaging CG endpoints
* Requires consistent coordination and handoff procedures during incidents
* Relies on both teams maintaining awareness of cross-cutting dependencies

### Tech Stack Evaluation

#### Same framework, integrated routers

Implement CG routes directly within SGG’s existing Flask-based API, using the same routing and middleware stack.

{% hint style="success" %}
**Bottom line**

Prioritizes reuse and simplicity but sacrifices flexibility for future evolution, especially around versioning and isolated error handling.
{% endhint %}

**Pros**

* Maximizes reuse of infrastructure and deployment workflows
* Easiest to maintain and deploy in the short term
* Reduces operational and cognitive load

**Cons**

* Limits flexibility to diverge from SGG conventions
* Difficult to isolate CG-related behavior for debugging or versioning
* Requires workarounds to support CG-specific behavior

#### Same framework, isolated app

Implement CG endpoints as a distinct APIFlask, ideally still within the same deployment, but with somewhat independent middleware to grant more control over things like response formatting, error handling, etc.&#x20;

{% hint style="success" %}
**Bottom line**

Provides moderate separation and control while keeping some infrastructure shared, but adds configuration complexity without addressing core framework limitations (e.g. versioning).
{% endhint %}

**Pros**

* Improves isolation for CG-specific logic and error handling
* Retains access to most shared infrastructure (auth, logging, monitoring)
* Enables partial autonomy in request/response design

**Cons**

* Still limited by SGG’s core framework capabilities
* Adds moderate deployment and configuration complexity
* Likely requires duplication of some utilities or wrappers

#### Different framework

Implement CG routes in a separate API service (e.g. FastAPI, Flask-RESTX) to avoid limitations inherent to APIFlask, attempting to reuse shared services wherever possible, but reimplementing them as needed.

{% hint style="success" %}
**Bottom line**

Offers the most control and flexibility but demands significant new operational overhead and potentially duplicated infrastructure.
{% endhint %}

**Pros**

* Complete control over request/response lifecycle and versioning
* Simplifies long-term evolution of CG protocol support
* Reduces coupling to SGG framework changes

**Cons**

* Likely requires reimplementation of foundational services (auth, logging, etc.)
* Increases deployment and monitoring complexity
* Divides maintenance ownership more sharply across areas of the codebase

### Resolving Discrepancies Evaluation

#### Fix SGG implementation

Modify SGG code to align response formatting, validation, or routing behavior with CG expectations where differences are implementation-specific.

{% hint style="success" %}
**Bottom line**

Best for discrepancies caused by SGG’s framework or internal inconsistencies, ensuring protocol conformance without broad changes.
{% endhint %}

**Pros**

* Keeps protocol and tooling simple
* Improves consistency within SGG
* Avoids technical debt in CG layers

**Cons**

* Requires coordination with Nava and potential regression risk
* May be deprioritized relative to other SGG workstreams
* May not be possible within the existing API framework for some discrepancies

#### Update CG protocol

Revise protocol specifications where discrepancies reveal missing concepts, unclear definitions, or cross-cutting needs among multiple adopters.

{% hint style="success" %}
**Bottom line**

Ideal when issues expose structural limitations or gaps in the protocol that could affect all adopters.
{% endhint %}

**Pros**

* Improves interoperability across systems
* Promotes clarity and standardization
* Reduces long-term divergence

**Cons**

* Slower change process with review and adoption overhead
* May require downstream systems to update implementations

#### Handle in CG tooling

Implement compensating logic in CG SDKs or utilities to bridge gaps between protocol and specific adopter implementations.

{% hint style="success" %}
**Bottom line**

Quickest path to mitigate minor inconsistencies shared by multiple adopters, but adds long-term maintenance overhead if overused.
{% endhint %}

**Pros**

* Fastest time to resolution
* Centralized handling benefits all adopters using CG tooling
* Avoids churn in protocol or adopter codebases

**Cons**

* Adds complexity to tooling
* Can obscure underlying misalignments if overused

### Maintenance Evaluation

#### A6-maintained

A6 owns and maintains CG-specific routes and logic, and is responsible for updating these endpoints regardless of whether the source of the change is in the CG protocol or SDKs or the underlying SGG services and infrastructure.

{% hint style="success" %}
**Bottom line**

Keeps CG compliance under A6 control but stretches limited team resources and makes A6 responsible for tracking changes to infrastructure and services over which they have little involvement.
{% endhint %}

**Pros**

* Direct alignment with protocol evolution
* Clear accountability for CG-related behavior

**Cons**

* Limited team bandwidth for ongoing maintenance
* Less familiarity with SGG’s infrastructure and dependencies
* Slower response to service-layer regressions

#### Nava-maintained

Nava maintains both SGG core and CG routes,  and is responsible for updating these endpoints regardless of whether the source of the change is in the CG protocol or SDKs or the underlying SGG services and infrastructure.

{% hint style="success" %}
**Bottom line**

Simplifies operations and reflects the maintenance pattern of other third-party adopters, but makes Nava responsible for tracking changes to CG and could lead to lagging compliance.
{% endhint %}

**Pros**

* Unified ownership of the SGG codebase
* Simplifies coordination during incidents
* Reflects the maintenance pattern of other third party adopters

**Cons**

* Requires Nava to stay current on CG protocol updates
* Slower adaptation to SDK or schema changes
* Risk of drifting from intended CG behavior
* Could distract Nava team from core SGG development

#### Shared maintenance

* A6 updates endpoints when CG protocol or SDKs change.
* Nava updates endpoints when API services or frameworks change, and leads initial triage when CG endpoints produce errors.
* Both teams coordinate on ambiguous issues and reassign ownership based on the root cause.

{% hint style="success" %}
**Bottom line**

Balances technical expertise and team capacity, but depends on clear coordination and shared visibility into cross-system issues.
{% endhint %}

**Pros**

* Assigns ownership based on codebase familiarity and context
* Reduces risk of misalignment between protocol and implementation
* Encourages collaboration without overloading either team

**Cons**

* Requires ongoing coordination and knowledge sharing
* Potential delays if ownership boundaries are unclear
* Slightly higher operational overhead during incidents\
