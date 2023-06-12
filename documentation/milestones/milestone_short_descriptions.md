# Project goals

## Define and publish core project goals
Diagram short name: `Define-Goals`

Dependencies: `None`

Define and publish core project goals, with proposed key metrics for all goals.

Define both short and long-term goals.

## Measurement strategy
Diagram short name: `Measurement-Strategy`

Dependencies: `Define-Goals`

Define and publish core project measurement strategy.

## Public measurement dashboards
Diagram short name: `Measurement-Dashboard`

Dependencies: `Measurement-Strategy`

Launch initial public measurement dashboard.

# Initial API deployment milestones

## Onboard development team
Diagram short name: `Onboard-Dev-Team`

Dependencies: `None`

Have the software development team for this effort start their work and get systems access.

## Developer tools
Diagram short name: `Dev-Tools`

Dependencies: `None`

Install developer tools for backend, including:

- Automated test framework
- Linters, code quality checkers, and code autoformatters
- Automated test coverage analysis
- API description linter (Spectral or alternative) - this can also be saved until API milestone
- Security scan of packages (Snyk or alternative)
- Unified logging including cross-request IDs
- etc

## Incident response
Diagram short name: `Incident-Response`

Dependencies: `CI-CD`

Setup incident response alerts (through analytics services and logs) as well as escalation tools (such as PagerDuty).

Document incident response plan and coverage schedule. All individuals on the schedule are trained in incident response best practices.


## DB replica
Diagram short name: `DB-Replica`

Dependencies: `None`

Create a replica of AWS PROD database for legacy grants.gov in a beta.grants.gov environment. Replica should (1) journal all changes from legacy DB to new system DB and (2) support uptime even while legacy DB is undergoing planned or unplanned downtime, maintenance, and upgrades.

The creation of this replica should be scripted using infrastructure as code.

## Test data and schema
Diagram short name: `DB-Test-Data`

Dependencies: `DB-Replica`, `DB-API-Plan`

Create a script or other automated tool that:

1. Generates a database matching the schema of the beta.grants.gov core replica DB.
2. Generates consistent fake example data that can be used for testing. (e.g., using the same random seed to generate consistent data, or saving test data values somewhere accessible)

This will dramatically speed up development because it will allow any developer to generate a local copy of the database that acts the same as the PROD beta.grants.gov database in their environment.

By having consistent test data, we can create integration tests that look for expected and unexpected behaviors.

## Review of software-as-a-service (SaaS) alternatives
Diagram short name: `SaaS-Plan`

Dependencies: `Onboard-Dev-Team`

Make an analysis of needs and alternatives and try to identify whether any aspects of the grants.gov experience would be better suited to using software-as-a-service (SaaS) alternatives such as Salesforce, Shopify, or other frameworks rather than developing a custom build.

Write an analysis of alternatives with pros/cons/recommendations.

## DB & API planning
Diagram short name: `DB-API-Plan`

Dependencies: `SaaS-Plan`

Make an analysis of needs and alternatives and choose:

* Database(s) type(s) (e.g., relational, document store, or alternative)
* Database(s) language(s) (e.g., MongoDB, Postgres or alternative)
* Database(s) deployment(s) (e.g., RDS or alternative)
* Database ORM (e.g., SQLAlchemy or alternative)
* API types (e.g., RESTful JSON, webhooks, GraphQL, or alternatives)
* API language (e.g., Python, Node)
* API deployment (e.g., EC2, serverless, or alternative)

## Infrastructure-as-code
Diagram short name: `Infrastructure-as-Code`

Dependencies: `DB-API-Plan`

Setup and deploy initial infrastructure, with 100% of the deployment managed through an infrastructure-as-code solution.

## Serialization and API documentation planning
Diagram short name: `API-Docs-Plan`

Dependencies: `DB-API-Plan`

Make an analysis of needs and alternatives and choose:

* Serialization framework (e.g., Marshmallow or alternative)
* API autogenerator
* API documentation (e.g., OpenAPI) autogenerator

Ideally, fields would be defined only once in the codebase, and these definitions would be used to generate (with as little manual configuration as possible) both RESTful API endpoints and the documentation for those endpoints.

Otherwise, every time there is a change in schema, it requires a lot of developer attention to update field definitions, API definitions, and API documentation.

## GET opportunities
Diagram short name: `GET-Opportunities`

Dependencies: `DB-API-Plan`, `DB-Test-Data`, `DB-Replica`, `Dev-Tools`, `Beta-Domain`

Deploy a public endpoint to PROD that allows users to see at least one (but not necessarily more than one!) field of data per listed opportunity in grants.gov. This will probably be a RESTful JSON /GET API endpoint.

This API should be accessible even when legacy grants.gov is experiencing planned or unplanned outages.

Metrics:
* Number of unique users accessing API
* Number of total API calls made
* Error rate of API calls
* Uptime of service
* etc.

## beta.grants.gov domain
Diagram short name: `Beta-Domain`

Dependencies: `None`

Gain access to the subdomain, `beta.grants.gov`. Prove access by deploying static test content (e.g., ipsum lorem) to that subdomain.

## Feature flag framework
Diagram short name: `Feature-Flags`

Dependencies: `Onboard-Dev-Team`

Choose and implement framework for having feature flags in production.

## API versioning framework
Diagram short name: `API-Versioning`

Dependencies: `DB-API-Plan`

Based on the plan defined in `DB-API-Plan`, choose and implement a framework for versioning the API using semantic versioning and being able to easily issue minor and major changes to the API.

Document versioning in API docs.

Also develop and execute release management plan with plan for release cycles, release notes, etc.

## Performance testing framework
Diagram short name: `Performance-Testing`

Dependencies: `DB-API-Plan`

Setup and start running performance testing framework for testing systems under load.

## ATO
Diagram short name: `ATO`

Dependencies: `DB-API-Plan`

Review planned public deployment of services with Jacob, our security officer, to confirm that they all fall under our existing ATO for grants.gov

## CI-CD
Diagram short name: `CI-CD`

Dependencies: `DB-API-Plan`

Based on the plan defined in `DB-API-Plan`, choose and implement a framework for continuous integration and continuous deployment.

When commits are made to any branch, these should automatically:
* Run lint suite
* Run test suite
* Deploy branch to backend and/or frontend test environments

When commits are made to `staging` branch, these should automatically:
* Deploy branch to STAGING environments
* Run smoke tests and integration tests in STAGING

When merges are made to `main`, these should automatically:
* Deploy branch to PROD environments
* Run smoke tests and integration tests in PROD

Metrics:
* Frequency of deploys to production
* Duration of time it takes per deploy
* Duration of time it takes per rollback

For discussion: is a STAGING environment and `staging` branch necessary at this stage, or should we continuously deploy to PROD as feature branches are merged into `main`?

Ideally, we would like to ensure a certain percentage of our ongoing sprint velocity (at least 20-30% at the beginning?) is devoted to improving our developer tools (i.e., autoformatters, build tools, etc) and communication tools (i.e., our wiki, milestones docs, etc). By investing in speeding up team productivity, we will drastically increase the speed of our delivery.

We should track the percentage of story points devoted to improving team efficiency and joy and ensure that they're hitting at least our target percentage each sprint.

## CI-CD-Metrics
Diagram short name: `CI-CD-Metrics`

Dependencies: `CI-CD`

Design and implement public metrics on CI-CD, such as the average speed of running a full test suite and deployment.

Try to keep these speeds down as much as possible: developer speed determines the speed of our feedback loops, and fast feedback loops are how we stay responsive to user needs and keep site performance high.

## API documentation
Diagram short name: `API-Docs`

Dependencies: `API-Docs-Plan`, `Get-Opportunities`, `Beta-Domain`

Based on the plan defined in `API-Docs-Plan`, launch a publicly accessible page for developer tooling and API documentation, such as https://beta.grants.gov/developers. For reference, see examples such as the one at https://qpp.cms.gov/developers.

This could be a microsite hosted on its own, or deployed within and as part of the beta.grants.gov integrated front-end experience.

This should include full OpenAPI documentation of the `GET Opportunities` API, as well as a tutorial for users who are interacting with the `beta.grants.gov` APIs for the first time.

The documentation should also describe what is likely to be stable in the API as it is developed versus what is unstable and will likely change without warning.

The update and deployment of documentation should be fully open source and managed through infrastructure as code.

Configure web analytics in documentation to track visitors.

Metrics:

* Number of unique monthly average users of API documentation
* Number of repeat users of API documentation
* Feedback survey results on usability of API documentation?

## Webhooks for opportunities
Diagram short name: `Webhooks-Opportunities`

Dependencies: `DB-API-Plan`, `GET-Opportunities`

Deploy a public webhook to PROD that allows users to subscribe to receive system-to-system updates when data is updated in the beta.grants.gov database.

The definition of this milestone could change based on planning done in `DB-API-Plan`.

Metrics:
* Number of unique users receiving webhooks calls
* Number of total webhooks calls received

## Back-end dependency fundraising tracking
Diagram short name: `Dependency-Fundraising-Tracking`

Dependencies: `DB-API-Plan`

For the front-end, there is a great tool (https://backyourstack.com/) that shows fundraising being conducted by the packages that are used as dependencies in your project. This tool currently only supports fundraising done through OpenCollective, which provides a systematic API that can be used to collect this data.

This milestone is to add to that tool support for backend packages such as Python that are raising funds through OpenCollective.

Based on initial research, the level of effort should be assessed to determine whether the time it would take to implement this milestone is worth the result. If it's longer than 2 weeks time of one developer, it may not be worth it.

## Develop opportunity protocol
Diagram short name: `Opportunity-Protocol`

Dependencies: `DB-API-Plan`

Investigate whether it is appropriate to develop a protocol that is system-agnostic that describes the core components of what's contained in an opportunity. This could be shared across both federal grantmaking as well as some private-sector grantmaking to facilitate standardization and simplification. This could help bring us closer to the goal of having, for grantmaking, a version of what US colleges and universities share in their [Common App](https://www.commonapp.org/).

The protocol would be implemented by our particular API ecosystem, but other platforms could implement the same protocol as well.

Much more investigation is needed to define this milestone.

For some research on common form fields, please see [this analysis from Technology Association for Grantmakers](https://www.tagtech.org/news/586811/TAG-Publishes-List-of-Common-Grant-Fields-from-FixtheForm-Analysis-.htm).

# Communications Tooling

## Communication platforms
Diagram short name: `Comms-Platforms`

[Link](./individual_milestones/communication_platforms.md)

## Milestone template published
Diagram short name: `Milestone-Template`

[Link](./individual_milestones/milestone_template_published.md)

## Open source tools
Diagram short name: `Open-Source-Tools`

Dependencies: `Comms-Platforms`

Configure the following things in the open source repository:

1. License
2. Responsible disclosure policy
3. Wiki (or link to wiki)
4. Contributions guide
5. Anti-deficiency act explainer
6. Paperwork reduction act explainer

## Open source group kickoff
Diagram short name: `Open-Source-Group`

Dependencies: `Open-Source-Tools`, `Comms-Platforms`

Configure the following things for the open source group:

1. Chat channel for communication
2. Unconference tools for voting on agenda topics (EasyRetro or alternative)
3. Mailing list (Google Group, GSA List, or alternative)

Then schedule and execute a kickoff meeting with interested attendees.

## Bug bounty
Diagram short name: `Bug-Bounty`

Dependencies: `None`

Start executing an ongoing bug bounty that provides a means for security researchers to disclose their findings in a manner additive to our existing responsible disclosure policy.

## Setup recurring meetings
Diagram short name: `Setup-Meetings`

Dependencies: `None`

Setup ongoing meetings that are necessary for delivery across all teams working on grants.gov and NOFO simplification.

These meetings will help us align with a two-week sprint cycle. As much as possible, meetings will be open to members of the open source community and general public.

Where possible and appropriate, it would be great to use 'unconference' tooling (the CEJST team used GitHub issues, but this had a challenging user experience) so that any participant can propose a topic for discussion for either themselves or others to facilitate. On the CEJST team, the team would propose a topic subject, description, duration, and facilitator name. For instance, here's an example entry:

    Subject: Review latest user research findings
    Description: We just completed two weeks of our latest user research study and want to review the findings and answer questions for anyone interested
    Duration: 30 minutes
    Facilitator: Abdul

Ideally these topics would have updates as well to let participants indicate which presentations they're most interested in seeing.

As of this time, it probably makes most sense to have all these meetings online, or at least in a hybrid online/in-person format.

These should be discussed and refined, and we're open to all ideas about how to make this more effective, but here's an example set of meetings:

1. Team of teams: sprint planning (60m, once per 2 weeks)
  - Review delivery plan for each team for the coming 2 week sprint
  - This meeting is at the start of the sprint.
2. Team of teams: burndown check-in (30m, once per 2 weeks)
  - Mid-sprint review of burndown charts against delivery.
  - This meeting is in the middle of the sprint.
3. Demo of demos (60m, once per 2 weeks)
  - All teams present demos of what was delivered this sprint.
4. Retro (60m, once per 2 weeks)
  - Retrospective on what went well, what could go better, review and agree upon specific ideas for improvements
  - Using a tool such as EasyRetro
  - At the end of the agenda, each person self-reports how happy they are with their work and the project right now, and what could be done to make them happier.
5. Open discussion calendar holds (60m, once per two weeks)
  - Calendar hold to keep time on everyone's calendar for whatever ad-hoc topics are needed.
  - Use unconference tooling
6. Milestone pre-planning (15m, as needed)
  - One meeting per milestone definition
  - Do a quick overview of milestones that are getting ready to be defined
7. Milestone planning (60m, as needed)
  - One meeting per milestone definition
  - Present near-final draft of milestone definition, according to milestone template.
  - Review and get feedback from all attendees, answer all outstanding questions
  - Mark milestone as fully defined and ready to be worked.
8. Grants.gov tea time (60m, once per two weeks)
  - A casual social hang to get to know each other better as people outside of just our daily work.
  - Host this during a casual part of the sprint cycle (not the beginning or end).
9. Open source community gathering (60m, once per two weeks)
  - A gathering of members of the public specifically to talk about issues relevant to the open source nature of the project.

To organize the delivery of this milestone, it may be useful to create a ticket for each of the meetings underneath the overall milestone epic.

For each of these meetings, their definition of done is:

* Meeting invites sent
* Method for easily adding people to the invites is documented publicly
* Recurring agenda set (in our shared comms tools (e.g., our Wiki) and in body of the calendar invite)
* Roles are set (e.g., an MC or rotating MC schedule is assigned)
* We've had at least one of these meetings


# NOFO milestones

## NOFO milestone planning
Diagram short name: `NOFO-Milestone-Planning`

Dependencies: `None`

Document ongoing milestones related to NOFO simplification.

## NOFO prototypes
Diagram short name: `NOFO-prototypes`

Dependencies: `None`

Deliver 4 NOFOs where the text and the PDF layout of the NOFO are fully redesigned.

## Define usability test metrics for NOFO prototypes
Diagram short name: `NOFO-Prototypes-Metrics`

Dependencies: `None`

Define usability testing metrics that will be used to evaluate the success of the 4 NOFO prototypes.

## Report on learnings from NOFO prototypes
Diagram short name: `NOFO-Prototypes-Learnings`

Dependencies: `NOFO-Prototypes-Metrics`, `NOFO-Prototypes`

Create report defining what we've learned from NOFO prototypes usability testing, such as a clear set of best practices and things to avoid.

## Readability scoring for NOFOs
Diagram short name: `NOFOs-Readability-Scoring`

Dependencies: `NOFOs-Text`

Automatically run readability scoring on all NOFOs posted to Grants.gov.

## Writing assistance tools for NOFOs: planning stage
Diagram short name: `NOFOs-Writing-Assistance-Plan`

Dependencies: `None`

Plan for how to provide grantors with tools that integrate into their daily workflow that will help them write simpler, clearer NOFOs.

## Writing assistance tools for NOFOs: implementation stage
Diagram short name: `NOFOs-Writing-Assistance`

Dependencies: `NOFOs-Writing-Assistance-Plan`

Implement writing assistance tools.

## PRA submitted & public comment started
Diagram short name: `Start-PRA-Comment`

Dependencies: `None`

Submit generic clearance documents to secure generic PRA approval. The approval does not need to be completed to complete the milestone, but the documents do need to be submitted and the public comment period needs to be started by posting them publicly.

## Update NOFO templates in grant solutions
Diagram short name: `NOFO-Grant-Solutions-Templates`

Dependencies: `None`

Work with GrantSolutions to implement new templates for NOFO writers to use that are compatible with the simplified, accessible templates designed by the NOFO simplification team.

The GrantSolutions software currently provides What You See Is What You Get (WYSIWYG) editing using two software frameworks:

* CKEditor
* Aspose

# Analytics milestones

## Operational analytics endpoint
Diagram short name: `Analytics-API`

Dependencies: `GET-Opportunities`

Produce one statistic about the operational effectiveness of grants.gov that is served with live data over a public API endpoint. This can be any statistic. Preferably it should be something useful that is interesting to members of the HHS team and members of the public, such as the total number of applications received for a given opportunity.

## Data quality analytics endpoint
Diagram short name: `Data-Quality-API`

Dependencies: `Analytics-API`

Produce one statistic about the data quality of one or more fields in grants.gov that is served with live data over a public API endpoint. This can be any statistic. Preferably it should be something useful that is interesting to members of the HHS team and members of the public, such as the percent of null values in a given field, reported by Agency/OpDiv.

## Data analytics visualization
Diagram short name: `Analytics-Visualization`

Dependencies: `Analytics-API`, `Data-Quality-API`

Produce visualizations of the data served over the two endpoints. These visualizations should be publicly accessible and scripted so that they are updated frequently and/or at the time of a visitor landing on the page. They should not be produced using one-off techniques but should be part of a sustainable, deployed analytics solution.

This could look like Javascript code being used to write and deploy D3 visualizations, or Python notebooks that are hosted in such a fashion that the data powering the visualizations is updated live.

## Publish place of performance data
Diagram short name: `Place-Of-Performance-API`

Dependencies: `Analytics-API`

Produce an API endpoint that for at least two grantmaking programs provides data on the place of performance of their grants. This will be using spatial data.

## Place of performance analytics visualization
Diagram short name: `Place-Of-Performance-Visualization`

Dependencies: `Place-Of-Performance-API`

Produce visualizations of the place of performance data. This could look like a map using MapBox or MapLibre (preferable because it's open source).

# Auth milestones

## Document authentication (authN) and authorization (authZ) frameworks
Diagram short name: `Document-AuthN-AuthZ`

Dependencies: `None`

Document the authentication (authN) and authorization (authZ) frameworks currently used by grants.gov with as much specificity and accuracy as possible. What workflows do users go through to access new authZ roles? What permissions do they get per role?

Furthermore, we should also document with as much specificity and accuracy as possible the authN and authZ roles of sam.gov, since completing tasks in sam.gov is necessary for completing most tasks within grants.gov.

## Authenticate via API using Login.gov
Diagram short name: `AuthN-API`

Dependencies: `GET-Opportunities`, `Document-AuthN-AuthZ`

Users should be able to login to an authenticated experience of the APIs using their login.gov credentials. This will at the moment not provide any additional functionality to users (login will be the basis of future functionality).

## Authorize via API
Diagram short name: `AuthZ-API`

Dependencies: `AuthN-API`, `Document-AuthN-AuthZ`

Users should be able to manage authorizations (authZ) for their grants.gov work over APIs.

## OAuth
Diagram short name: `OAuth`

Dependencies: `AuthN-API`

Users should be able to delegate API access by logging in using their login.gov credentials to another system, which authenticates with beta.grants.gov APIs on their behalf using OAuth.

OAuth is already implemented as part of login.gov: https://developers.login.gov/oidc/.

## User and entity information endpoint
Diagram short name: `Entity-API`

Dependencies: `AuthN-API`

Authenticated users should be able to see at least one field about their profile (for instance, whether their affiliated entity has a UEI number already affiliated).

# Sam.gov integration milestones

## Document sam.gov tasks
Diagram short name: `Document-Sam`

Dependencies: `None`

Document all tasks that need to be completed on sam.gov to enable functionality on grants.gov.

Document which of these tasks can be completed using APIs versus which must go through the sam.gov user interface.

## Integrate sam.gov APIs
Diagram short name: `Sam-APIs`

Dependencies: `Document-Sam`

Integrate with the [Sam.gov APIs](https://open.gsa.gov/api/entity-api/) to complete as many Sam.gov-related tasks as possible through grants.gov.

Much more definition of this milestone is needed.

## Integrate sam.gov and grants.gov help desk
Diagram short name: `Sam-Help-Desk`

Dependencies: `Document-Sam`

Investigate potentailly providing a "warm hand-off" option to integrate sam.gov and grants.gov help desks to reduce user frustration at being told to hang up and call a different help desk.

This may not be feasible.

# Hackathon milestones

## Plan participatory processes
Diagram short name: `Participatory-Plan`

Dependencies: `None`

Make a plan for the overall approach to participatory processes for the grants.gov open source project, including:

* Participant advisory council & governance procedures
* "Hackathon" with challenge budget
* Ongoing sprint/quarterly planning for "budgeting" software delivery based on story points

## Hackathon informational page
Diagram short name: `Hackathon-Page`

Dependencies: `Participatory-Plan`

Deploy a webpage somewhere that gives a full description of the hackathon plan, invitation, signup, etc.

As part of this milestone, choose a better and more inclusive name than "hackathon".

## Recruit hackathon participants
Diagram short name: `Recruit-Hackathon-Participants`

Dependencies: `None`

Recruit at least 3 organizations that have said they are interested in participating in the first hackathon phase on NOFO listings.

## Recruit hackathon workgroups
Diagram short name: `Recruit-Hackathon-Workgroups`

Dependencies: `None`

For the hackathon, we may choose to form workgroups that function as a sort of caucus that makes recommendations about various entries. This paradigm can be continued as part of the ongoing open source work on grants.gov.

Workgroups review demos and make recommendations and endorsements representing their affinity group.

For instance, there could be different workgroups for:

* Staff from city governments
* Environmental justice / Justice40 organizations
* Grantmaking networks (such as Grant Professionals Association)
* Visually impaired individuals and/or individuals with other accessibility needs
* System-to-system users

Grants.gov team staff would provide support through tools to assist these groups in decisionmaking and submitting recommendations. As with all members of the public, they'd be invited to attend sprint demos and other planning sessions.

For this milestone, we would recruit at least three participants for each of three workgroups to help get the concept started.

Recruit at least 3 organizations that have said they are interested in participating in the first hackathon phase on NOFO listings.

## Request for information (RFI)
Diagram short name: `RFI`

Dependencies: `None`

Begin a request for information (RFI) process to solicit public comment on NOFO design and simplicity.

## Request for information (RFI) tooling
Diagram short name: `RFI-Tools`

Dependencies: `None`

Configure and deploy better tools for soliciting and processing responses from the request for information (RFI) process.

## Hackathon Phase 1: NOFO listing
Diagram short name: `Hackathon-Listing`

Dependencies: `Open-Source-Group`, `Hackathon-Page`, `RFI`, `NOFO-Prototypes`, `Recruit-Hackathon-Workgroups`, `Recruit-Hackathon-Participants`

Target date: aim to kick off this hackathon by March 2024 at the latest

Phase 1 of the hackathon: the listing itself.

Key parts of this milestone:

* Large invite list
* Kickoff event (hybrid in-person and remote)
  * Speakers and introductions organized for kickoff event
  * Demo 4 simplified NOFOs and talk about overall approach.
  * Discuss vision, goals, and process for hackathon.
  * Press invited to event
* Regular meetings scheduled for duration of hackathon (e.g., once every two weeks for demos and questions)
* Closing ceremonies scheduled for 2-3 months later

## Hackathon NOFO listing: Internal entry
Diagram short name: `Hacakthon-Listing-Internal-Entry`

Dependencies: `Hacakthon-Listing`, `Research-Synthesis`

A submission, by the software development modernization team for grants.gov, for the hackathon phase 1: listing page.

## Hackathon Phase 2: Apply
Diagram short name: `Hacakthon-Apply`

Dependencies: `Hacakthon-Listing`

Phase 2 of the hackathon: the application.

## Hackathon NOFO Apply: Internal entry
Diagram short name: `Hacakthon-Apply-Internal-Entry`

Dependencies: `Hacakthon-Apply`, `Research-Synthesis`

A submission, by the software development modernization team for grants.gov, for the hackathon phase 2: application page.

## Hackathon Phase 3: Data
Diagram short name: `Hacakthon-Data`

Dependencies: `Hacakthon-Apply`, `Analytics-API`

Phase 3 of the hackathon: the data.

## Hackathon data: Internal entry
Diagram short name: `Hacakthon-Data-Internal-Entry`

Dependencies: `Hacakthon-Data`

A submission, by the software development modernization team for grants.gov, for the hackathon phase 2: data.

# User interface milestones

## Static site launch with NOFO content
Diagram short name: `Static-Site`

Dependencies: `Beta-Domain`, `FE-Plan`

Launch a simple site at beta.grants.gov that provides static, informational content relevant to the NOFO simplification effort.

This content could include:

* Information about the goals and structure of the NOFO simplification project
* Links to the four NOFO prototypes
* Information about how to sign up for future updates
* Information about upcoming events

The benefits of launching this site would be:

* Increase awareness of the NOFO simplification effort
* Providing a single web presence for information about the NOFO simplification effort
* Delivering quick wins that motivate technical milestone completion, such as securing the beta domain

Content may update frequently, so it would be important for content updates to be relatively easily to implement -- which may suggest doing a static site (such as GitHub Pages) or integrating a Content Management System (such as Storyblok, which is being implemented for the existing grants.gov service).

However, if rushing to create and deploy this site, and maintain and update its content, provides more distraction from the path of technical delivery of the grants.gov modernization than it provides benefits, we should consider alternative methods for making a single web presence for NOFO simplification information.

## Front-end planning
Diagram short name: `FE-Plan`

Dependencies: `None`

Choose language (e.g., TypeScript), framework (e.g., React) and testing framework (e.g., Jest) for front-end.

## Front-end CI-CD
Diagram short name: `FE-CI-CD`

Dependencies: `FE-Plan`

Install developer tools for front-end, including:

- Automated test framework
- Linters, code quality checkers, and code autoformatters
- Automated test coverage analysis
- Security scan of packages (Snyk or alternative)
- Automated accessibility testing
- Mobile responsiveness testing
- Funding needs of packages (https://backyourstack.com/ or alternative)
- etc

These should all run on CI-CD like the definition of the milestone `CI-CD`.

## CMS

Diagram short name: `CMS`

Dependencies: `FE-Plan`

Choose and implement a CMS, such as the headless CMS Storyblok being implemented by grants.gov.

## Open source CMS content

Diagram short name: `CMS-Open-Source`

Dependencies: `CMS`

Implement CMS in such a way so that the content is tracked and version controlled in an open source fashion, if this is at all possible.

## Web analytics

Diagram short name: `Web-Analytics`

Dependencies: `FE-Plan`

Choose and implement a web analytics framework, such as analytics.gov or Google Analytics, where all data can be made publicly available.

## Grants.gov analytics
Diagram short name: `Web-Analytics-Legacy`

Dependencies: `None`

Establish existing baseline of customer satisfaction and other analytics in existing grants.gov.

The longer we have this baseline data, the more we can use the baseline comparison to ensure that beta.grants.gov provides an improved user experience with higher rates of customer satisfaction.

## Internationalization framework

Diagram short name: `i18n`

Dependencies: `FE-Plan`, `CMS`

Implement an internationalization framework (to support multiple languages) we believe can scale as the site scales.

Invest early in this. It is much easier to build internationalization in from the beginning than it is to add support for it to an existing codebase.

## Translation process & contracts

Diagram short name: `Translation-Process`

Dependencies: `i18n`, `CMS-Open-Source`

Implement a process (preferably an automated one) that makes translations quickly and accurately available for content.

This could include using the State Department for translation like many USDS websites do, or setting up external bounties for translation such as those used by Open Collective Foundation: https://docs.opencollective.com/help/contributing/translation#bounties.

Preference for integrating the external team that does translations directly into the codebase so they can make their own pull requests to content.

Define languages planned on support for website. The most common languages are published by the Census: https://www.census.gov/library/stories/2022/12/languages-we-speak-in-united-states.html. A reasonable option for a starting point for supported languages would be Spanish and either Mandarin or Cantonese (the Census marks both of these as 'Chinese' so it is not clear which is the 3rd most commonly spoken language in the US).

For language data, there is more detailed microdata found in the Microdata Access Tool (MDAT).  Here's a table using the 2021 1-year ACS Public Use Microdata Sample (PUMS) file: https://data.census.gov/mdat/#/search?ds=ACSPUMS1Y2021&rv=HHLANP&wt=WGTP.

Ideally, every release of new content should be followed shortly thereafter by translations in key supported languages. Milestones will not be complete until their related content is released in all supported languages.

## Foundational UI
Diagram short name: `Foundational-UI`

Dependencies: `FE-CI-CD`, `Research-Synthesis`

Build and deploy a basic UI framework for the site, using USWDS, informed by research synthesis.

This includes basic information architecture, navigation, path parameters for navigating to different pages, the capability to complete query parameters, etc.

Responsive design should be included from the beginning and integrated into testing.

# Search milestones

## Search API
Diagram short name: `Search-API`

Dependencies: `GET-Opportunities`

1.0 version of an API to provide better searching on opportunities.

## Search UI
Diagram short name: `Search-UI`

Dependencies: `Search-API`, `Foundational-UI`

Target date: aim to launch this in beta.grants.gov by sometime between December 2024 and March 2024.

Front-end for search API.

## Full text of NOFOs stored as text
Diagram short name: `NOFOs-Text`

Dependencies: `GET-Opportunities`

Convert all PDFs of NOFO listings (using their XML-based representation) into free text that can be stored in the database(s) and searched.

## Full text search of NOFOs
Diagram short name: `NOFOs-Text-Search`

Dependencies: `NOFOs-Text`, `Search-API`

Search free text of NOFOs.

## Tuned search API (Search 2.0)
Diagram short name: `Search-API-2.0`

Dependencies: `NOFOs-Text-Search`

Tune the search API endpoint to give better results based on what users are looking for.

## Geographic search
Diagram short name: `Geographic-Search`

Dependencies: `Search-API`

Organizations are located in and/or serving very specific geographies. Currently, there's no way to add geographic search filters to results. For instance, searching "environmental justice" returns a lot of results for international aid or for specific countries (e.g., Mexico) that will be irrelevant to applicants from Alabama.

Build a search API feature that, for at least some NOFOs, restricts search results to the geographies that are affiliated with the applicant that is searching for NOFOs.

The challenge with this milestone will be that few NOFOs have easily accessible, clearly tagged geographic data. Perhaps we can setup a system of adding this data per NOFO, or crowdsourcing the data with verification.

## User research for search
Diagram short name: `Search-User-Research`

Dependencies: `Search-API`

Conduct additional user research on search needs.

## Additional search
Diagram short name: `Additional-Search`

Dependencies: `Search-User-Research`

Add additional search (e.g., by community type, by capital availability, etc) features driven by user research's identification of search needs.

# Personalization milestones

## Save NOFOs to profile

Diagram short name: `Save-NOFOs`

Dependencies: `Entity-API`

Possibly allow users the ability to mark a NOFO to be "saved" to their profile, for instance as an opportunity they're interested in working on.

## Show NOFOs the user has worked on

Diagram short name: `NOFOs-Worked`

Dependencies: `Entity-API`

Possibly allow users the ability to see which NOFOs they have submitted in the past or are currently working on.

## NOFO Recommendations API

Diagram short name: `NOFO-Recommendations-API`

Dependencies: `Save-NOFOs`, `NOFOs-Worked`, `Profile-Builder`

Possibly implement API that generates recommendations for users to look at certain opportunities based on their profile, their "saved" NOFOs and the NOFOs they have previously submitted or worked on.

## NOFO Recommendations UI

Diagram short name: `NOFO-Recommendations-UI `

Dependencies: `NOFO-Recommendations-API`, `Search-UI`

UI for recommendations.

## Profile builder

Diagram short name: `Profile-Builder`

Dependencies: `Entity-API`

Possibly implement API that allows users to interact with their profile, and update characteristics such as their entity type (e.g., small local government, Tribal, CBO, etc), their capacity for matching funds (e.g., <=$20m), etc.

Particular attention should be paid to profile fields that are relevant for finding related federal opportunities.

# User research milestones

## Generative user research
Diagram short name: `Generative-User-Research`

Dependencies: `None`

Since January 25, 2023, Huge has conducted in-depth one-on-one interviews with applicants and grantors to understand the end user experience of Grants.gov. With the aim of creating a more equitable Grants.gov, Huge explored key barriers for underserved and first-time applicants, and identified areas for improvement along the grantor and applicant user journeys. Focusing specifically on Find and Apply functions, Huge examined the role of Grants.gov in the broader grant opportunity ecosystem and examined specific pain points that hinder the grant seeking process for end users.

The results of these findings will be incorporated in the Phase II Vision presentation, which will feature user archetypes and a strategic vision for a more equitable Grants.gov. The purpose of this document is to serve as a topline preview of grantor and applicant insights as the Huge team continues to synthesize research findings and inform the overall vision.

Research Objectives

1. Exploration of the role of Grants.gov in the broader ecosystem: Examine existing user behaviors in the grant seeker’s and grantor’s journey, identifying where Grants.gov fits in their overall approach and what role it provides in relation to other systems.
2. Evaluation of semi-structured Grants.gov experience: Investigate participants’ experience, including their organic user journeys based on their role, features of Grants.gov that standout, and any challenges they have with the interaction along the way.
3. Evaluation of specific task completion: Observe participants’ pain points and delights while they attempt to complete specific journeys related to their roles in posting, finding, and applying to grants, and their ability to complete related tasks.
4. Exploration of opportunities for an equitable experience: Identify key barriers to and areas of opportunity where grants.gov can help increase applications for underserved communities.

Methodology

* Method: Moderated in-depth interviews
* LOI: 60-75 minutes
* Platform: Google Meet
 * Audience:
○ n=12 Grantors
○ n=38 Applicants (26% First Time Applicants, 39% Casual/Occasional Applicants, 34% Serial/Frequent Applicants)
* Field Dates - 1/25/2023 - 3/3/2023

## Research synthesis and vision
Diagram short name: `Research-synthesis`

Dependencies: `Generative-User-Research`

Note: Research synthesis must inform all UI designs. This relationship is not always marked on the diagram due to the complexity of the arrows, but it is a necessary dependency for all UI designs.

Deliverables from Huge:

* Research synthesis - Huge will compile findings from the user research sessions to identify key insights. In doing this, we will highlight user pain points and challenges as well as features and functionalities that are liked by users today.
* Archetype definition - Based on research findings, Huge will define user archetypes structured by needs and behavioral attributes. These archetypes create a common, shared understanding of users’ behaviors, attitudes, goals, and pain points that will need to be met by the future state of Grants.gov.
* UX explorations - The Huge UX lead will design initial wireframes that will explore identified areas of opportunity as a way to highlight future state solutions for Grants.gov.  Wireframes will be illustrative but will provide a solid foundation for planning and development of high fidelity design.
* Visual design explorations - The Huge team will ideate on how to improve the current Grants.gov design system visually. Explorations will be illustrative but could be iterated on in future phases of work.
* Vision creation - The vision for Grants.gov will summarize our recommended ‘North Star’ for the product ecosystem.  This north star will provide the guardrails for planning the subsequent design and release phases.
* Roadmap planning - Based on the shared vision, Huge will define a sequenced roadmap for how to bring to life Grants.gov that takes into account regular, iterative releases of key functionality.

## Document GrantSolutions integration points
Diagram short name: `Document-GrantSolutions`

Dependencies: `None`

Document all tasks that need to be completed on GrantSolutions to enable functionality on grants.gov. For instance, to post a NOFO to grants.gov, you may (or may not) need to go through the announcement module of GrantSolutions.

Document which of these tasks can be completed using APIs vs which must go through the GrantSolutions.gov user interface.

## User research compensation
Diagram short name: `User-Research-Compensation`

Dependencies: `None`

Investigate potentially setting up a system for compensation user research participants, modeled after the compensation system developed by USDS at the White House.

This will promote fairness, as well as increasing the quality and diversity of our pool of user research participants, by compensating participants for sharing their lived experience and expertise.

## User research participants database
Diagram short name: `User-Research-Database`

Dependencies: `None`

Create a database that is easy to maintain and update of potential participants for ongoing user research to contact about future user research opportunities.

Ideally, this database would also have some (appropriate) characteristics of the people stored so that when we're looking to talk to individuals representing certain characteristics, we can narrow our search to those people.

## Additional user research TBD
Diagram short name: `User-Research-TBD`

Dependencies: `Research-Synthesis`

Additional user research milestones to be defined later on topics such as search, apply, etc. These need to be fleshed out in detail.

## NOFO writing journey mapping
Diagram short name: `User-Research-NOFO-Writing`

Dependencies: `Research-Synthesis`

Conduct user research on the process of grantors writing NOFO listings.

This includes the stages of planning, budgeting, designing, developing, writing, getting approvals on content, and posting.

Producing a user journey on this topic would be essential for developing features relating to enhanced NOFO listing pages, because we need to understand how users write and post their NOFOs.

## Unified cross-platform branding and identity
Diagram short name: `Unified-Brand`

Dependencies: `Research-Synthesis`

Develop a unified brand and visual/comms identity that communicates Office of Grants and/or grants.gov vision and principles across multiple platforms (web, email, PowerPoint, etc).

# Expanded UI milestones

## NOFO Listing page
Diagram short name: `NOFO-Listing-UI`

Dependencies: `Foundational-UI`, `Research-synthesis`

A page for individual NOFO listings.

Should likely be built using configurable page template. For instance, using query parameters (or path parameters?) users should be able to view the NOFO listing in an alternative template format. This will make it easier to try new, modified designs for improved user experiences in the future and allow customization for users. (For instance, a third party could contribute a template via open source code that can be easily configured by users who want to use that third-party template.)

This milestone uses *only* the standard fields and data that are available for all NOFOs in the grants.gov legacy database.

## Enhanced NOFO Listing page
Diagram short name: `NOFO-Listing-UI-Enhanced`

Dependencies: `NOFO-Listing-UI`, `User-Research-NOFO-Writing`

Target launch date: Between January 2024 and March 2024

An enhanced page for individual NOFO listings, to be launched with at least 5 real, live NOFOs by approximately March 2024.

This listing page should have interactive contents, informed by best practices in design and user research on the topic, that make the content of the NOFOs easily accessible to users. The content should have a better user experience than simply a link to a PDF.

In planning this milestone, it's useful to know that most HHS OpDivs develop and submit NOFOs through GrantSolutions, using templates within GrantSolutions. GrantSolutions also provides a structured review process that facilitates getting several rounds of review of the NOFO listing and approvals from various departments (legal, budget, etc) before any content is approved as final. When the final approvals are in and the user chooses to submit the NOFO listing, GrantSolutions then posts the content over system-to-system connections to grants.gov.

One challenge of this milestone is that unlike its dependency, `NOFO-Listing-UI`, it may require using specialized content that is not available through the legacy grants.gov databases. This may require setting up a new service or API that allows this new content to be submitted. This may require updating GrantSolutions and its accompanying workflows to support that new content.

Alternatively, the content management for new NOFO listings may be as simple as configuring a headless CMS to support permissioning and approvals by the program staff. More user research is necessary to understand the journey map of NOFO writers and ensure that this enhanced NOFO listing milestone has all of its dependencies known.

Definition of done:
* For five or more NOFOs, program staff writing the NOFOs are able to submit the listing's content through an automated service of some kind that then populates the data onto beta.grants.gov.
* For five or more NOFOs, those listings are available in production at beta.grants.gov with an enhanced page listing experience for real programs.

## Sam.gov assistance page
Diagram short name: `Sam-Assistance-UI`

Dependencies: `Foundational-UI`, `Document-Sam`, `Research-synthesis`

A page for helping people understand and navigate their necessary tasks on Sam.gov.

## Grants.gov assistance page
Diagram short name: `Grants-Assistance-UI`

Dependencies: `Foundational-UI`, `Research-synthesis`

A page for helping people understand and navigate their necessary tasks on Grants.gov.

## Help page
Diagram short name: `Help-UI`

Dependencies: `Foundational-UI`, `Research-synthesis`

A page for helping people contact the help desk and other avenues for seeking customer support.

## Authentication (authN) page
Diagram short name: `AuthN-UI`

Dependencies: `Foundational-UI`, `AuthN-API`, `Research-synthesis`

A workflow for helping people create accounts (via Login.gov) for use on Grants.gov.

## Authorization (authZ) page
Diagram short name: `AuthZ-UI`

Dependencies: `Foundational-UI`, `AuthZ-API`, `Research-synthesis`

A workflow for helping people manage roles for use on Grants.gov.

# Appendix

Here is a template to use for these descriptions.

The first option below is for milestones that have not been defined according to the [Milestone Template](./milestone_template.md). It provides fields for a short description of the milestone.

The second option below is for milestones that have already been defined according to the [Milestone Template](./milestone_template.md). It provides a link to the template-based definition.

## Milestone name
Diagram short name: `-`

Dependencies: `-` or `None`

Short description.

OR

Diagram short name: `-`

[Link]()
