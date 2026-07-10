# Workflow Management



* **Status:** Active
* **Last Modified:** 2026-02-03
* **Related Issue:** \[#7172]\(https://github.com/HHS/simpler-grants-gov/issues/7172)
* **Deciders:** James Black (HHS)
* **Tags:** Workflow Management Research & MVP

## Context and Problem Statement

Without workflow management (approvals and backend configuration), federal grant programs face compliance risk, operational bottlenecks, and zero visibility into approval status. Federal grant programs rely on shadow systems and institutional knowledge. This prevents HHS from tracking approvals, maintaining audit history, or adapting to policy changes, ultimately delaying grants for applicants and creating frustration for federal staff.

We want to procure or implement a system that will allow for workflows to be scheduled and managed. In [Quad 5](https://github.com/HHS/simpler-grants-gov/issues/7799), we will deliver a pilot (foundational tool) to gather user feedback and help define what the MVP should be in the next quad. The pilot includes preconfigured core workflow components that feature teams can use to build grantor user-facing workflows in a non-prod environment. This provides real-time status visibility, accelerates future feature delivery, validate assumptions about workflow needs, meets compliance. The pilot will scale to support prioritized grantor workflows based on user research.

## Decision Drivers

* Open Source
* Fully user-defined workflow (steps and transitions)
* Configurable Step Behavior by agencies / Policy as code
* UI for viewing workflow
* Event based workflow triggers
* Workflows can exist for weeks or months between steps
* Event History
* Reusable Steps/Actions
* Effort to integrate with our RBAC Authentication and Authorization
* Cost ($ / month per env) as well as Engineer time
* Authority to Operate (ATO) effort
  * The platform already must be authorized under the Grants.gov ATO (Authority to Operate) or ATO coverage must be requested
* **Technical Assumptions:**
  * Solution integrates with existing SGM Python/Node/React stack and PostgreSQL database. Operates under current Home | Grants.gov ATO without requiring separate security approval.
  * Platform priority is Workflow Management Pilot.
  * Enhances added incrementally, after Quad 5, based on grantor research
  * Modern software development: open source, iterative, user-driven development
  * Focus on reviewing the solutions that align with the core workflow requirements. All are Python-based
* **Workflow Management Pilot scope:**
  * Basic 3-step workflow in Training environment with simplified approval chain
  * Training Feature Teams to use reusable workflow components to build a Funding Memo workflow
  * Validate workflow execution, state tracking, and basic audit logging work reliably.



**Out of scope** – Fund & Award team will take the workflow components and build a single Funding Memo type workflow in Training environment



**Out of scope (possibly long-term)**: Pilot ready in production with monitoring and escalation, Agency-specific configuration, optional steps, or complex routing; bulk upload, API creation of funding memo, enhanced audit history tracking, support for 3+ funding memo types (new/competing and non-competing), dynamic workflow definition, multi-user collaboration for NOFO drafting, workflow framework extension, self-service configuration by agency administrators in the UI (this is not advisable, as there are no solutions that meets the requirements for easy agency configuration; instead, we can support reasonable agency-specific configurations in the long-term, or provide training)

## Options Considered

* Apache Airflow
* Temporal
* Spiff
* Python StateMachine - **recommended**
* Dagster
* Camunda
* Salesforce
* Flowable
* Service Now
* Google Workspace Studio
* Strata SDK

## Decision Outcome

**Summary:** We recommend implementing Python StateMachine for Workflow Management prototype, MVP, and beyond. This approach delivers immediate user value through a basic 3-step approval workflow while supporting the long-term vision of configurable, agency-specific workflows across multiple grant management processes. The technology scales from simple proof-of-concept to enterprise configuration management without architectural rewrites, maintaining lowest total cost of ownership at each phase.

We are recommending Python StateMachine ([Docs](https://python-statemachine.readthedocs.io/en/latest/)) wrapped in a limited event driven workflow processing and auditing layer that we build.

Python State Machine is a library that helps organize and move through a code-defined state machine. The library allows you to define behavior that should happen during transitions and upon entering a state without restricting you to what that behavior can be. It’s possible to check configurational values, and make external calls as part

While the state is something that we would run in-memory, initializing a state machine from a DB row is doable ([an example on using a file](https://python-statemachine.readthedocs.io/en/latest/auto_examples/persistent_model_machine.html#abstract-model-with-persistency-protocol), could easily be adapted).

The tool can produce images representing a workflow ([examples](https://python-statemachine.readthedocs.io/en/latest/auto_examples/index.html)) which could be incorporated somehow into a UI feature for understanding the workflows)

We built a simple[ prototype](https://github.com/HHS/simpler-grants-gov/compare/chouinar/prototype-state-machine) that was demoed at HHS Onsite.

### Positive Consequences

The Python StateMachine technology provides the right foundation for both immediate pilot, MVP, and future enterprise capabilities.

**Why Python StateMachine supports pilot, MVP and long-term:**

* **Pilot and MVP advantage:** Simplest to implement and test. No complex infrastructure setup means faster delivery and easier iteration based on user feedback
* **Long-term advantage:** Python StateMachine adapts and scales to federal grant management complexity. Other frameworks impose rigid patterns (Temporal) or require specialized expertise (Spiff)&#x20;
* **Economic advantage:** Lowest cost at every phase while preserving flexibility to evolve

**How the Recommendation Supports Long Term Workflow Outcomes**

Python StateMachine delivers the flexibility agencies need to customize approval processes, integrate with financial systems in real-time, enable team collaboration on complex documents, and track performance metrics—supporting more than 80% of potential long-term platform needs.&#x20;

**User Value:** Agencies get approval automation, cross-process integration, team collaboration, and flexible corrections out-of-the-box. The framework adapts to federal grant complexity (rejections, returns, long delays, conditional routing) without fighting against it. Custom build isn’t needed for the core workflow execution. &#x20;

This approach has limitations with complex workflows with multiple approval paths that run simultaneously. We plan to mitigate this by implementing secondary standard workflows that address the majority of use cases. Additionally, we can provide training for agencies and prioritize reasonable agency-specific configurations. We will also conduct user research every quad to inform and prioritize features. This ensures agencies get flexibility and ease of use.

**Additional positive consequences:**

* Straightforward method of defining steps and connections
* Would be very easy to test as we build, especially compared to other services where the workflow is run and managed across many different components.
* Can [produce images](https://python-statemachine.readthedocs.io/en/latest/diagram.html#how-to-generate-a-diagram-at-runtime) representing workflow steps, including highlighting the current step.
* Very flexible, should be capable of being adapted to support many different use cases and scenarios.
* When multiple events need to happen in sequence without any manual work (eg. updating data, sending emails), they can all be processed immediately in sequence without delay.
* No vendor lock-in, security evaluation, or complex infrastructure required (we’ll need some infra work).

#### **Cost Analysis**&#x20;

No additional ODC is needed as the initial costs are estimated in the $300/month range. This is part of the existing approved AWS costs. If scaling increases substantially in the future the costs will rise along with that, which is true of all of our AWS resources. Our current AWS budget is $15,000/month.

| **Solution**            | **Infrastructure (Monthly/Env)** | **Annual Infrastructure** | **Annual Maintenance\* (Approx)** |
| ----------------------- | -------------------------------- | ------------------------- | --------------------------------- |
| **Python StateMachine** | **$210**                         | **$7,560**                | **4-6 weeks**                     |
| Apache Airflow          | $610+                            | $21,960+                  | 4-6 weeks                         |
| Temporal                | $1,300+                          | $46,800+                  | 8-10 weeks                        |
| Spiff                   | $600+                            | $21,600+                  | 6-8 weeks                         |

* Includes ongoing maintenance and upgrades but does not include adding requested features as this cost would exist across all solutions

### Negative Consequences

* Can only define a workflow, getting events to the workflow, and processing them would be something we have to build. We would need to build a service that can handle processing events and storing the state of the workflow back into the database.
* Workflows are managed within the state machine which is purely defined within code.
  * It looks like there has been some investigation into allowing dynamic state machines to be defined (ie. as JSON), although it’s [not fully featured yet](https://github.com/fgmacedo/python-statemachine/discussions/414#discussioncomment-8629681).
* A given workflow can only be in one state at a time, splitting a workflow and re-converging later isn’t something it would support.

#### **Risk, Impact and Mitigation**

The Python StateMachine approach presents manageable risks through Quad 6 with medium-term risks mitigated through disciplined scope control, standard Python patterns, and leveraging existing SGM infrastructure. Long-term risks around configuration complexity (agency self-service through admin UI) can be mitigated by a configuration ADR with early prototyping to validate dynamic workflow construction or pivot to visual BPMN-based config UI generating Python state machines.&#x20;

This approach also prevents vendor lock in, which incurs significant costs for the Office of Grants (development, maintenance and infrastructure costs).

| **Risk Category**                      | **Risk Level** | **Risk Description**                                                        | **Impact if Unmitigated**                      | **Mitigation Strategy**                                                                                                                                                                                             |
| -------------------------------------- | -------------- | --------------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ongoing: Team Knowledge                | LOW            | Python StateMachine requires sustained expertise                            | Knowledge loss on team changes                 | Document architectural decisions during MVP/Quad 6. Conduct knowledge transfer sessions. Standard Python patterns reduce ramp-up vs alternatives                                                                    |
| Quad 5: Technical Foundation           | LOW            | Pilot infrastructure must support Quad 6 without rework                     | Quad 6 rebuild                                 | <p>Design event handling, persistence, audit for production scalability from start</p><p>Iterative development based on user feedback</p>                                                                           |
| Quad 6: Scope Creep                    | MEDIUM         | To-Be process reveals complexity beyond inheritance hierarchy, rules engine | Development overruns; Quad 6 delays            | <p>Prioritize MUST HAVEs rigorously. Hold firm on "Won't Have" list. Implement simplified agency-level config only. Use hardcoded business rules initially.</p><p>Defer rules engine and inheritance to Quad 7.</p> |
| Quad 6: MVP Operational Readiness      | MEDIUM         | Time-based escalation, monitoring, error handling need robust patterns      | Production incidents; user frustration         | Leverage existing SGM monitoring. Implement escalation incrementally (email reminders before auto-reassignment). Load test realistic volumes. Have rollback plan.                                                   |
| Quad 6+: Agency-specific configuration | MEDIUM-HIGH    | Custom development needed to build agency-specific configurations           | Developer bottleneck                           | Prioritize reasonable agency-specific configurations. Otherwise, provide training for agencies (who can contribute to the project since it is open-sourced)                                                         |
| Quad 7+: Workflow Complexity           | MEDIUM-HIGH    | Proposed approval hierarchy may exceed library's optimal use case           | Architecture doesn't scale to long-term vision | Implement some secondary standard workflows that address the majority of use cases                                                                                                                                  |
| Quad 7+: Feature Prioritization        | MEDIUM         | 20+ advanced features; agency needs may differ                              | Build wrong features; low adoption             | <p>User research in each quad to validate priorities.</p><p>Track Quad 6 usage metrics (which workflows used most, bottlenecks, config requests).</p><p>Data-informed feature development </p>                      |

## Pros and Cons of the Options

<table data-header-hidden data-full-width="true"><thead><tr><th></th><th></th><th></th><th></th><th></th></tr></thead><tbody><tr><td><strong>Factor</strong></td><td><p><strong>Python StateMachine</strong></p><p>(Recommended Approach)</p></td><td><strong>Apache Airflow</strong></td><td><strong>Temporal</strong></td><td><strong>Spiff</strong></td></tr><tr><td>Open Source</td><td>Yes</td><td>Yes</td><td>Yes</td><td>Yes</td></tr><tr><td>Fully user-defined workflow (steps and transitions)</td><td>No</td><td>No</td><td>No</td><td>Yes, but workflows are defined in BPMN which won’t be user friendly and will limit the number of people capable of working on it.</td></tr><tr><td>Configurable Step Behavior by agencies / Policy as code</td><td>Partially - Steps are simple constructs and could easily be made configurable.</td><td>Yes</td><td>Partially - Likely doable, but goes against what Temporal is trying.</td><td>Yes</td></tr><tr><td>UI for viewing workflow</td><td>No UI, but can produce dot files that can be made into images or frontend UI components.</td><td>Yes, but it's aimed at engineers running the system, not end users.</td><td>Yes, but it’s aimed at the engineers running the system, not end users.</td><td>Yes, but it would require a significant rewrite of the provided code to work with our system. It’s also very technical.</td></tr><tr><td>Event based workflow triggers</td><td>Partially, we’d need to build the event handling logic and pass it to the state machine.</td><td>Yes, but the docs detail that events are complicated, if an event becomes true and stays true (like a file appearing) then it could keep firing that event.</td><td>Yes</td><td>Yes</td></tr><tr><td>Workflows can exist for weeks or months between steps</td><td>Yes</td><td>No - It’s not recommended.</td><td>Yes</td><td>Yes</td></tr><tr><td>Event History</td><td>Partially - We’d need to build this, but could merge this with the event handling logic.</td><td>Yes</td><td>Yes</td><td>Yes</td></tr><tr><td>Reusable Steps</td><td>Yes</td><td>Partially</td><td>Yes, but a lot of overhead to reuse.</td><td>Yes</td></tr><tr><td>Effort to integrate with our auth</td><td>Low</td><td>Unknown</td><td>Unknown</td><td>Medium/High - would need to rebuild the Spiff Arena auth</td></tr><tr><td><p>Cost ($ / month per env)</p><p></p><p>Note: Assume these will scale up a bit if we have to support a large number of workflows.</p></td><td><p>ECS Service: ~$200 (based on how much our existing ECS services cost per month)</p><p></p><p>SQS Queue: &#x3C;$10</p></td><td><p><a href="https://aws.amazon.com/managed-workflows-for-apache-airflow/pricing/">AWS Pricing</a><br><br>One constantly running task is ~$60/month, likely need a few of those.</p><p></p><p>Managed instance pricing, assuming we’d need at least a medium would be ~$550/month.</p></td><td><p>Based on what our NJ UI project needs:</p><p></p><p>6 ECS Services: $1000+</p><p></p><p>Postgres DB: ~$300</p><pre><code>ECS 
* Frontend 1x ARM 1 CPU/4GB RAM
* GUI 1x ARM 1 / 0.5
* History 2x ARM 2 / 4
* Matching 1x ARM 1 / 2
* Worker 1x ARM 0.5 / 2
Python SDK Workflows 2x ARM 1 / 2
DB - 2x serverless instances ~$310
</code></pre></td><td>Would require a frontend service, backend service, and new DB, guessing $500-$700.</td></tr><tr><td>Authority to Operate (ATO) effort: The platform already must be authorized under the grants.gov ATO (Authority to Operate) or ATO coverage must be requested</td><td><strong>Low</strong>: Only new python packages, and new services running in a manner similar to what we already have.</td><td><strong>High</strong>: Completely new service would need to be vetted and approved.</td><td><strong>Very High</strong>: New tech stack and a very wide footprint as it’s running several different services.</td><td><strong>Low or High</strong>: depending on whether we just rely on the library OR deploy their frontend/backend combo which would be high.</td></tr></tbody></table>

### Apache Airflow

[Docs](https://airflow.apache.org/docs/)

Apache Airflow is an “open-source platform for developing, scheduling, and monitoring batch-oriented workflows”. It supports configuring pipelines to run based on events, or time-based.



* **Pros**
  * [Sleek UI](https://airflow.apache.org/docs/apache-airflow/stable/ui.html) for viewing the status, and metrics regarding your workflows.
  * It’s possible to have a workflow [dynamically change](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/dynamic-task-mapping.html) what tasks it will run based on inputs (eg. a config for an agency could say, run step X in addition to the usual).
  * An impressively large number of well-documented features for various kinds of workflows, supporting all of the different types of workflows we discussed above.
* **Cons**
  * From Apache Airflow’s [own documentation](https://airflow.apache.org/docs/apache-airflow/stable/index.html#why-not-airflow) - “Airflow® is designed for finite, batch-oriented workflows. While you can trigger Dags using the CLI or REST API, Airflow is not intended for continuously running, event-driven, or streaming workloads.” - If we were just looking to build a backend job manager, it would work very well.
  * While it looks like the workflows themselves can be [triggered by events](https://airflow.apache.org/docs/apache-airflow/stable/authoring-and-scheduling/event-scheduling.html), there are a lot of caveats including cases where something becomes always True (a file exists, if that file continues to exist, it would keep retriggering).

### Temporal

[Docs](https://docs.temporal.io/)

Temporal is an “open source platform that ensures the successful execution of services and applications”. Temporal is built with resiliency and ensuring your code won’t break by thoroughly tracking state, and letting jobs pick up where they left off in the event of failure.

* **Pros**
  * Temporal can scale to support large diverse workflows with its cluster approach.
  * [Temporal handles](https://docs.temporal.io/evaluate/why-temporal#code-structure) the scheduling, event management, and many other complexities with orchestrating your workflows, requiring you to mostly just focus on defining the workflows / activities.
  * Temporal is specifically setup to provide durable execution, and allows for replaying a workflow in a safe manner in the event that you need to fix or adjust something about it, and can support workflows running over weeks or years without issue.
  * Has [a UI](https://docs.temporal.io/evaluate/understanding-temporal#temporal-ui) with a thoroughly detailed event history.
* **Cons**
  * Temporal has a lot of restrictions in order to run properly, [their docs](https://docs.temporal.io/workflow-definition#deterministic-constraints) even mention that this determinism has certain restrictions. All parameters must be known when starting a workflow, the same inputs must always produce the same outputs (even [changing code](https://docs.temporal.io/workflow-definition#non-deterministic-change) requires a lot of special considerations). While there are certain patterns that can be followed to allow for flexibility, it would end up with us needing to work around the library more often than we work with it.
    * Looking at how Nava’s NJ UI project uses Temporal, fetching data from the database requires a lot of roundabout back-and-forth code operations in order to fetch simple data in a small workflow.
  * Temporal requires a lot of infrastructure setup, and if we want to test locally, a lot of local setup would be needed as well. Looking at NJ UI, they had to setup a Temporal-only DB, Temporal frontend gateway, Temporal history server, Temporal matching server, Temporal system worker, Temporal UI, Temporal admin tools, and Temporal EDA. While not all of these are strictly necessary for development, it should showcase that Temporal requires a lot of setup.



### Spiff

[SpiffWorkflow](https://www.spiffworkflow.org/) is a workflow execution engine capable of executing [BPMN](https://www.bpmn.org/) (Business Process and Model Notation) files.

[Spiff Arena](https://spiff-arena.readthedocs.io/en/latest/getting_started/quickstart_guide.html#getting-started-with-spiffarena) is frontend UI + backend API (in Next JS + Python respectively) that together can let users define their own custom workflows with a flow diagram directly in the UI.

[Spiff Workflow](https://spiffworkflow.readthedocs.io/en/latest/index.html) is the Python library that arena uses and handles executing the workflow steps

* **Pros**
  * Spiff Workflow being backed by BPMN files means it could allow for completely custom user-defined workflows.
  * BPMN is a general file type for defining a workflow, and has several libraries that support it, including [frontend libraries](https://bpmn.io/) for rendering and editing it.
  * Spiff Arena’s frontend/backend are written in similar technology to what we use, and are open source. Even if we don’t use it, we could use some of their implementation as a baseline in building out a frontend.
* **Cons**
  * Configuring BPMN diagrams in Spiff Arena looks to be a very technical process that looks aimed more at technical folks setting up user workflows regarding filling out forms, and making HTTP queries.
  * Requires a thorough understanding of [BPMN notation](https://spiff-arena.readthedocs.io/en/latest/explanation/understanding_the_terminology.html) to interpret and build workflow diagrams.
  * The underlying engine [can run arbitrary code](https://spiffworkflow.readthedocs.io/en/latest/bpmn/script_engine.html) defined in the BPMN files by a user which would be a massive security problem, and would require we disallow certain functionality.

### Python State Machine

[Docs](https://python-statemachine.readthedocs.io/en/latest/)

[A very simple prototype](https://github.com/HHS/simpler-grants-gov/compare/chouinar/prototype-state-machine)

Python State Machine is a library that helps organize and move through a code-defined state machine. The library allows you to define behavior that should happen during transitions and upon entering a state without restricting you to what that behavior can be. It’s possible to check configurational values, and make external calls as part

While the state is something that we would run in-memory, initializing a state machine from a DB row is doable ([an example on using a file](https://python-statemachine.readthedocs.io/en/latest/auto_examples/persistent_model_machine.html#abstract-model-with-persistency-protocol), could easily be adapted).

The tool can produce images representing a workflow ([examples](https://python-statemachine.readthedocs.io/en/latest/auto_examples/index.html)).

* **Pros**
  * Straightforward method of defining steps and connections
  * Would be very easy to test as we build, especially compared to other services where the workflow is run and managed across many different components.
  * Can [produce images](https://python-statemachine.readthedocs.io/en/latest/diagram.html#how-to-generate-a-diagram-at-runtime) representing workflow steps, including highlighting the current step.
  * Very flexible, should be capable of being adapted to support many different use cases and scenarios.
  * When multiple events need to happen in sequence without any manual work (eg. updating data, sending emails), they can all be processed immediately in sequence without delay.
  * No vendor lock-in, security evaluation, or complex infrastructure required (we’ll need some infra work).
* **Cons**
  * Can only define a workflow, getting events to the workflow, and processing them would be something we have to build. We would need to build a service that can handle processing events and storing the state of the workflow back into the database.
  * Workflows are managed within the state machine which is purely defined within code.
    * It looks like there has been some investigation into allowing dynamic state machines to be defined (ie. as JSON), although it’s [not fully featured yet](https://github.com/fgmacedo/python-statemachine/discussions/414#discussioncomment-8629681).
  * A given workflow can only be in one state at a time, splitting a workflow and re-converging later isn’t something it would support.

### Other Technologies

These weren’t evaluated in depth, and generally weren’t something we would consider due to missing too many features to be viable for our use case.

**Dagster**

“Dagster is a data orchestrator built for data engineers” - the focus is too much on data engineering and backend, and many of their examples are for complex ETL/ELT flows. Does not appear to be something we could easily repurpose for our use case.

**Camunda**

[Docs](https://developers.camunda.com/)

Camunda is a Java application that can handle running workflows which can be backed by BPMN files. It has a [web UI](https://docs.camunda.io/docs/components/modeler/web-modeler/) for building BPMN flows, although they seem oriented towards internal teams rather than something we could freely share with agencies.

While Camunda seems to have a lot of flexibility in configuring workflows using BPMN (being a more fully featured product than Spiff), many of its features are locked behind using Camunda as a SaaS product, and can’t be used in a self-deployed environment. The libraries for interacting with it would also need to be written in Java, which would require a separate tech stack than what we currently use.

**Salesforce**

Salesforce is a CRM product with many different features including the ability to build and [manage workflows](https://help.salesforce.com/s/articleView?id=platform.flow_builder.htm\&type=5). While Salesforce is widely used, and it’s possible to make its workflows call out to APIs under the hood, the vendor lock-in, licensing cost, and completely separate stack would make it a challenge to go forward with quickly.

**Flowable**

Nominally uses an open standard for process definition, BPMN. In practice Flowable (and Camunda and others) actually make a number of proprietary changes to this standard so the XML process definitions are tightly coupled to the Flowable product itself

The BPMN used is technical enough that it cannot be edited by non-technical users and must be carefully checked by folks with Flowable-BPMN specific expertise. Businesses that use tools like Flowable often use the visual representation of the BPMN as a way to communicate the process requirements between non-technical stakeholders, and then a business analyst with Flowable-specific expertise will convert these visual diagrams into the actual BPMN "code" itself

The Flowable BPMN is highly extensible e.g., provides lots of opportunities for custom steps, etc.

There is also an out of the box process tracker which is useful for high level analysis e.g., where are the bottlenecks in a particular process, etc.

More generally, Flowable and Camunda are best suited for modeling and tracking an _internal_ business process which does not change often; although it's possible to imagine e.g., programmatically editing XML based on a custom UI, the intent is closer to the process described above where an internal technical team is making manual changes

These companies, although providing ostensibly open source platforms, are in practice continually trying to lock in their customers to their platform and their paid products

**Service Now**

[Docs](https://www.servicenow.com/solutions/workflow-solutions.html)

ServiceNow provides many different business software solutions. It’s hard to accurately detail its workflow solution as so much of their docs are written as a sales pitch in marketing jargon without saying anything of substance. Their technical documentation is organized behind several slow to respond search/AI agents, and does not load for many pages. An accurate evaluation wasn’t possible with what they have on their own website.

**Google Workspace Studio**

[Docs](https://studio.workspace.google.com/)

Looks to be more around automating tasks in Google features like notifying you if a keyword is found in any of your emails automatically. Their examples all are backed by google features (summarize my email, help me prepare for a meeting) and seem aimed at general productivity rather than a workflow system.

**Strata SDK**

[Docs](https://github.com/navapbc/strata)

Strata’s workflow management capabilities is still evolving. It’s built in Rails, which is not part of our current stack. It’s not a stand-alone product that can be integrated with Python API.



## What is a workflow?

Workflows can be a lot of different things, but ultimately are a series of steps of processing to do an operation. In a technical sense, each step of a workflow might represent a state in a state machine (although actual state management may or may not be included). Steps of a workflow are connected by transitions which can be conditional (eg. a number of approvers needed), gated by events OR that happen automatically upon entering the prior state.



Each step of this process has an order to it, and each step would verify it’s valid to be in that step (eg. the step to create an application submission would require the application to be submitted as a guard rail).

Importantly, this is **NOT** a directed-acyclic-graph (a DAG) and we fully expect cycles to happen. It’s not unexpected that a workflow will get set back to an earlier state. A few plausible scenarios where that could happen:

* An application has issues that need to be fixed, the grantor kicks the application back to the user to fix putting them back at the beginning (this might also be looked at as ending one workflow and making a completely new one for that application)
* A step of the process may require multiple approvers to move on



### What kinds of workflow flows do we want to support?

**Event based**

Something happens that causes a step to run. This could be someone manually doing something like submitting an application OR marking an application as approved. It could also be triggered off of another event happening like sending an email after the application submission was created.

**Time-based / Batch processing**

Regardless of how flexible we aim to make an event based approach, some scenarios will still call for us to process data on an hourly/daily cadence. For example, let’s assume there is a step that requires multiple approvers. If after 3 days, no one has approved something in the queue, we want to send an email out reminding them.

Note that we could make this send out events triggering a separate “notification” workflow. We just rely on time to be the trigger for the event.

**Branching**

Steps of a workflow require the ability to branch based on conditions. These could be something like a user chooses yes/no which causes an event and when that event is processed, it uses that value (or a side-effect of that value) to determine whether the item moves

### Step Configuration

A given step needs to be configurable, steps should be able to be configured per agency. For example, a step that requires approvers should generically support things like:

* How many approvers are required
* What kinds of approvers are required

#### Workflow Auditing

The workflow framework should allow someone to look at the history of a workflow for a given entity. If a workflow has 20 steps in it, at any point in that process, we should be able to inspect the workflow and see:

* What steps have already run
* What step is the workflow currently in
* What did those steps do (eg. an approval step should say who did the approval)

#### Long-lived workflows

Because we know a key part of our workflows is going to be approval steps, we should expect that in some cases, a workflow might take weeks or months to complete. If you just imagine what a workflow might look like that handles application submissions from submit all the way through to payment and post-award requirements (which may or may not be a single workflow, or many), it’s reasonable to expect that sometimes a workflow will just sit for a while.

#### Different entities tracked separately in a single workflow

Take for example a workflow about publishing an opportunity. That workflow might have several different opportunities each separately going through the workflow. Those workflows should not affect one another, and should be completely independent, acting on separate entities (opportunities in this case). We can’t simply say “the opportunity publish workflow is currently waiting for approvals”, it instead needs to be “the opportunity publish workflow for opportunity ABC-123 is currently waiting for approvals”.



