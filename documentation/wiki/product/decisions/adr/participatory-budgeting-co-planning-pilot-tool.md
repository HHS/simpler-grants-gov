# Participatory Budgeting/Co-Planning Pilot Tool

**Status: Active**\
**Last Modified:** 2025-08-12\
**Deciders:** Lucas, Brandon, Michael, Wendy\
**Tags:** participatory budgeting, civic engagement, tool selection, pb pilot, co-planning

### Context and Problem Statement

SimplerGrants will run a Participatory Budgeting (PB) pilot as a mechanism to increase community involvement in feature prioritization. The pilot aims to empower community members to submit ideas, create proposals, and vote on which features the team should build. This requires a lightweight, accessible, and user-friendly tool that allows participants to vote for features that they want to see the team build next.

Due to the pilot’s short timeline and exploratory nature, the team needs to select a tool for the pilot that allows for immediate implementation with minimal technical overhead.

In the process of running the pilot, we have changed the term used to describe this process. We are no longer using “Participatory Budgeting” in favor of “Co-Planning”.

### Assumptions

* The PB pilot will be limited to 6 participants voting on 7 proposals
* Proposals will be selected by members of the SimplerGrants team, rather than submitted by members of the public
* Members of the Simpler.Grants.gov team will be assigned to work on the top X proposals over the course of Y sprints

### Decision Drivers

* Ease of Use: Tool must be simple for both community participants and the internal project team to use.
* Low Cost: Free or existing tools are preferred.
* Rapid Implementation: Must be implementable in a sprint.
* Customizability: Must support flexible question design and lightweight workflows.
* No Training Overhead: Minimal user onboarding or workflow configuration.

### Options Considered

* Google Forms
* GitHub
* COTS Participatory Budgeting Software such as Decidim

### Decision Outcome

The team selected Google Forms as the tool for implementing the PB pilot due to its availability, ease of use, and immediate deployment capability.

### Positive Consequences

* Free and widely accessible tool already in use.
* Very low technical barrier for community participation.
* Allows for quick configuration and iteration.
* Supports lightweight form logic and structured data export.

### Negative Consequences

* Not purpose-built for participatory budgeting.
* Lacks proposal deliberation or collaboration tools.
* Voting limited to basic question types.
* Google form’s limited feature set for proposal submission, deliberation, and voting will likely require us to move to a new tool for future PB rounds

### Pros and Cons of the Options

#### Google Forms

Details\
Free Google Workspace form tool. Supports surveys, multiple choice, short answer, and logic branching. Easy export to Sheets.

Pros:

* Readily available and familiar
* No cost to implement
* Easy to deploy and configure
* No account required for responders

Cons:

* Lacks collaborative proposal refinement
* Not ideal for structured budgeting workflows
* Basic voting capabilities only

#### GitHub

Details\
Open source hosting platform the project already uses for technical collaboration. Can be used for proposals and lightweight voting via issues or PRs.

Pros:

* Transparent and versioned
* Supports commenting and discussion threads
* Already in use by team

Cons:

* High barrier for non-technical participants
* Requires accounts and technical fluency
* Workflows not designed for budgeting or voting

#### Decidim

Details\
Free, open-source participatory democracy platform tailored for civic engagement, including participatory budgeting.

Pros:

* Built for civic engagement workflows
* Robust support for proposal development, voting, and prioritization
* Transparent and customizable

Cons:

* Requires time to evaluate and implement
* Potential hosting/infrastructure needs
* Too complex for rapid pilot deployment<br>

### Links

* [Google Forms](https://www.google.com/forms/about/)
* [GitHub](https://github.com/)
* [Decidim](https://decidim.org/)
