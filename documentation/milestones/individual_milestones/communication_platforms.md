# Communication platforms

| Field           | Value                                                                |
| --------------- | -------------------------------------------------------------------- |
| Document Status | Completed.                                                           |
| Epic Link       | [Issue 47](https://github.com/HHS/grants-equity/issues/47)           |
| Epic Dashboard  | [Milestone Roadmap](https://github.com/orgs/HHS/projects/12/views/4) |
| Target Release  | 2023-08-23                                                           |
| Product Owner   | Lucas Brown                                                          |
| Document Owner  | Billy Daly                                                           |
| Lead Developer  | Aaron Couch                                                          |
| Lead Designer   | Andy Cochran                                                         |

## Short description

Implement chat, wiki, ticket tracking, calendar, email listservs, and email inboxes in a way accessible for all team members and the public.

## Goals

### Business description & value

We must have easy-to-use and effective tools for communicating as a team. These communication technologies will be perhaps the most important pieces of technology implemented by and used by the team.

These need to be accessible to internal (HHS or employed by HHS) partners as well as external partners (members of the general public).

### User stories

- As a **full-time HHS staff member**, I want to:
  -  adopt tools that are intuitive and easy to use, so that I can spend less time learning how to use these tools and more time completing the important work they are designed to facilitate.
  -  review contributions from external users before those changes are published, so that we can ensure the content aligns with our values as an agency.
  -  be able to access these communication platforms from within the HHS network, so that I can reliably get work done while I'm at the office.
- As a **member of an HHS contractor team**, I want to:
  -  adopt tools require as little ongoing maintenance, so that I minimize the amount of time spent supporting the deliverables associated with this milestone and begin working on delivering future milestones.
  -  monitor user participation across these platforms, so that I can understand how well we are engaging stakeholders throughout this process.
  -  track metrics about our projects like task burndown, so that we can monitor progress and identify blockers more quickly.
- As a **member of the public**, I want to:
  -  know when HHS is hosting public meetings about grants.gov, so that I can help inform the priorities and roadmap for the new grants.gov
  -  be able to access and view project documents and tasks without logging in, so that I can understand the priorities of the project and the progress being made on those priorities.
  -  be able to report issues with or requests features for the team work on, so that the new version of grants.gov actually meets my needs.
  -  be able to ask questions about or recommend improvements to documentation, so that the documentation is clear and easy to understand for other members of the public as well.

## Technical description

For each of the following tools:

- Evaluate a set of options according to the criteria listed below
- Select an option and document that choice as an ADR
- Implement and onboard members of the team to that tool
- Make any code used to deploy or integrate these services open source

The tools are listed (roughly) in priority order based on their importance to collaboration within the project and the availability of substitutes.

### Ticket tracking

Explore options for tracking of tickets with ability to track epics and burndown charts, such as:

- [GitHub](https://github.com/) with [Zenhub](https://www.zenhub.com/)
- [Atlassian Jira](https://www.atlassian.com/software/jira)
- [Asana](https://asana.com/)
- Others as suggested by dev team

### Chat

Explore and evaluate options for group chat, such as:

- [Slack](https://slack.com/features)
- [Discord](https://discord.com/)
- [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software)
- [GitHub Discussions](https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/about-discussions)
- [Rocket.chat](https://www.rocket.chat/)
- [Mattermost](https://mattermost.com/)
- Others as suggested by dev team

### Shared calendar

Explore options for a shared calendar of dates across teams, such as:

- [Confluence](https://www.atlassian.com/software/confluence/team-calendars)
- [Google Calendar](https://support.google.com/calendar/answer/37083?hl=en)
- Others as suggested by dev team

### Video conference

Explore options for supporting video calls both among project collaborators and members of the public, such as:

- [Zoom](https://zoom.us/)
- [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software)
- [Google Meet](https://meet.google.com/)
- [Jitsi](https://jitsi.org/)
- Others as suggested by dev team

### Wiki

Explore and evaluate options for wiki-style storage and editing of documents, such as:

- [Confluence](https://www.atlassian.com/software/confluence)
- [Notion](https://www.notion.so/product)
- [GitHub Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis)
- [GitBook](https://www.gitbook.com/)
- [Wiki.js](https://js.wiki/)
- Git-based Headless CMS
- API-based Headless CMS
- Others as suggested by dev team

### Document sharing

Explore and evaluate options for drafting, sharing, and collaborating on internal project documents:

- One of the wiki options above
- [Google Drive](https://www.google.com/drive/)
- [Microsoft Sharepoint](https://www.microsoft.com/en-us/microsoft-365/sharepoint/collaboration)
- [Dropbox](https://www.dropbox.com/)
- Others as suggested by dev team

### Sprint retro

Explore and evaluate options for a tool that helps facilitate sprint retrospectives, such as:

- [EasyRetro](https://easyretro.io/)
- [TeamRetro](https://www.teamretro.com/)
- [Reetro](https://reetro.io/)
- Others as suggested by dev team

### Listserv

Explore options for a way to host listserves, such as:

- [Google Groups](https://support.google.com/groups/answer/46601?hl=en&ref_topic=9216&sjid=6954506169775690555-NA)
- [GSA's listservs](http://listserv.gsa.gov/)
- [Groups.io](https://groups.io/)
- [Mailman GNU](https://list.org/)
- [GroupServer](http://groupserver.org/)
- Others as suggested by dev team

### Contact us

Explore options for solutions that allow members of of the public to submit questions or comments about the project as an alternative to a public forum like a listserv:

- [Front](https://front.com/)
- [Loop Email](https://www.intheloop.io/pricing-us/)
- [Google collaborative inbox](https://support.google.com/a/users/answer/167430?hl=en)
- Contact us form on the website
- HHS internal options for shared inbox, such as grants.simplification@hhs.gov
- Others as suggested by dev team

### General requirements

For the wiki-style tool, we need integrated page analytics so we can view stats such as the number of total visits to a page (or collection of pages) as well as unique visitors, time on page, etc.

The wiki-style tool should have internationalization capabilities or we should document

Ideally, the tool would have the ability to designate some users as direct editors of pages (do not need permission before merging changes) and some users as suggesters (can submit suggested changes that need to be approved by one or more editors before they get merged).

### Definition of done

- [ ] The following conditions have been satisfied for all tools:
  - [ ] At least 5 members of HHS full-time staff have been onboarded.
  - [ ] At least 5 members of contractor teams (employed by HHS) have been onboarded.
  - [ ] At least 3 members of the general public have been onboarded.
  - [ ] New users can be onboarded to the tool for no cost to the user in a process that takes less than 2 days.
  - [ ] Services are accessible to all people on the HHS network, public internet, and *preferably* the White House network and most or all agency networks
  - [ ] Onboarding instructions for new users are clearly and accessibly documented in a public place.
  - [ ] Instructions for the internal team that assists with onboarding new users are clearly and accessibly documented in a public place.
  - [ ] Code for managing and deploying these services is deployed to `main` & PROD (if necessary)
  - [ ] An ADR has been recorded which documents the tool chosen and the reasons for selecting it
  - [ ] An ADR has been recorded which outlines the norms around how these tools should be used collectively as part of a broader team communication plan
- [ ] Ticketing system is live with the following conditions satisfied:
  - [ ] At least 1 ticket has been created and assigned to an epic (or an equivalent concept).
  - [ ] Without logging in, members of the public can see tickets that are being worked on.
  - [ ] Default 'templates' have been created for tickets, epics, etc, that have the fields we've decided are necessary for the project.
  - [ ] Users can track tickets in sprints and monitor things like burndown.
  - [ ] Members of the public can submit feature requests or report bugs
- [ ] Chat is live with the following conditions satisfied:
  - [ ] Users can post messages to public channels (potentially with some restrictions applied).
  - [ ] Users can send private messages to each other as well as view private and public channels.
  - [ ] Users can reply to messages in a thread that other users can see.
  - [ ] Users can use emojis to react to messages.
- [ ] Calendar is live with the following conditions satisfied:
  - [ ] At least 1 event has been added
  - [ ] Without logging in, members of the public can see calendar events that are open to the public
  - [ ] Members of the public can copy events to their own calendar and/or RSVP to attend the event
- [ ] Video conference is live with the following conditions satisfied
  - [ ] At least one public meeting has been hosted
  - [ ] At least one public meeting has been recorded, with recording and transcript uploaded to the wiki
  - [ ] Users can join the call via video or phone
  - [ ] Users can access a live transcript during the video call
- [ ] Wiki is live with the following conditions satisfied:
  - [ ] At least 1 document has been added to the wiki (preferably the onboarding instructions for these tools)
  - [ ] Without logging in, members of the public can see wiki documents.
  - [ ] Users can see history of changes to all documents.
  - [ ] Web analytics have been integrated into the wiki and administrators can report on unique users, page views, etc.
- [ ] Document sharing platform is live with the following conditions satisfied:
  - [ ] At least 1 document has been created and shared via the platform
  - [ ] At least 2 people have contributed to the document
  - [ ] Multiple users can collaboratively edit the document
  - [ ] Access to documents can be restricted to certain users or groups
  - [ ] Documents can optionally be shared with the public so that they can read it without logging in
- [ ] Sprint retro tool is live with the following conditions satisfied:
  - [ ] At least 1 sprint retro has been conducted with the tool
  - [ ] Users can create and assign action items from within the tool
- [ ] Email listserv is live with the following conditions satisfied
  - [ ] At least one email has been sent out to the listserv
  - [ ] Any member of the listserv can send emails to the entire listserv
  - [ ] Any member of the listserv can reply all to an email
  - [ ] Any member of the listserv can reply directly to an email sender
- [ ] Contact us option is live with the following conditions satisfied
  - [ ] At least 1 inquiry has been received

### Proposed metrics for measuring goals/value/definition of done

TODO: See if we can reduce the list of metrics to track

1. Ticket Tracking Metrics
   1. Total story points assigned per sprint
   2. Total story points completed per sprint
2. Chat Metrics
   1. Number of monthly active users in chat, total
   2. Number of monthly active users in chat, external
   3. Weekly volume of Chat messages
3. Calendar Metrics
   1. Number of public meetings per quarter
   2. Number of external users attending public meetings
4. Video Conference
   1. Number of attendees, total (public meetings)
   2. Number of attendees, external (public meetings)
5. Wiki Metrics
   1. Number of monthly active users in wiki, total
   2. Number of monthly active users in wiki, visitors
   3. Weekly volume of wiki edits/contributions
6. Document sharing metrics
   1. Number of internal project documents
   2. Number of publicly accessible project documents
7. Listserv Metrics
   1. Number of subscribed users in listserv, total
   2. Number of subscribed users in listserv, external
   3. Average number of responses in listserv thread
8. Contact Us Metrics
   1. Weekly volume of messages/inquiries
   2. Average response time for a message

### Destination for live updating metrics

Page on the public wiki. **Note:** This will likely change once we deliver [the Public Measurement Dashboard milestone](../milestone_short_descriptions.md#public-measurement-dashboards)

## Planning

### Assumptions & dependencies
<!-- Required -->

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [x] **Onboard dev team:** The dev team will be evaluating and making many of these key architectural decisions

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- [x] **Internationalization:** While there will be content delivered within this milestone that needs to be translated in the future, we do not expect to have a framework for managing translations set up by the time this milestone is delivered.

### Open questions
<!-- Optional -->

- [x] None

### Not doing
<!-- Optional -->

The following work will *not* be completed as part of this milestone:

1. **Translating onboarding documents:** Translation of key documents will be covered in an upcoming milestone

## Integrations

### Translations
<!-- Required -->

*Does this milestone involve delivering any content that needs translation?*

*If so, when will English-language content be locked? Then when will translation be started and completed?*

- Yes, the onboarding documents for each of the tools will need to be translated:
  - Chat
  - Ticket tracking
  - Shared calendar
  - Video conference
  - Wiki
  - Document sharing
  - Sprint retro
  - Email listserv
  - Contact us tool
- Timeline and strategy for translation is still TBD

### Services going into PROD for the first time
<!-- Required -->

*This can include services going into PROD behind a feature flag that is not turned on.*

Yes the following tools will be deployed:

1. Chat
2. Ticket tracking
3. Shared calendar
4. Video conference
5. Wiki
6. Document sharing
7. Sprint retro
8. Email listserv
9. Contact us tool

### Services being integrated in PROD for the first time
<!-- Required -->

*Are there multiple services that are being connected for the first time in PROD?*

Yes, we expect there to be some integrations between the following tools in production:

1. **Chat + Ticket tracking:** Option to receive updates on key tickets in chat
2. **Wiki + Chat:** Option to receive updates on key document changes in chat
3. **Document Sharing + Chat:** Option to show previews of documents shared in chat
4. **Sprint Retro + Chat:** Option to share retro takeaways and action items in chat
5. **Video Conference + Shared Calendar:** Option to add video conference details to events
6. **Document Sharing + Wiki:** Option to embed public documents in wiki
7. **Shared Calendar + Wiki:** Option to embed public calendar events in the wiki

### Data being shared publicly for the first time
<!-- Required -->

*Are there any fields being shared publicly that have never been shared in PROD before?*

1. No

### Security considerations
<!-- Required -->

*Does this milestone expose any new attack vectors or expand the attack surface of the product?*

1. **Public Access:** While most of these tools are meant for sharing publicly available content to external stakeholders, some tools we may also want to use for internal collaboration (e.g. document sharing, shared calendar). As a result we must be mindful of configuration changes that may expose internal content (documents, events, etc.) to members of the public who are also on these platforms.
2. **External Contributions:** If members of the public are able to comment on or contribute content to these communications platforms, certain contributors may contribute content that does not align with the values or perspectives of HHS or the community guidelines established for the open source community.

*If so, how are we addressing these risks?*

1. **Public Access:** Document expectations around what content can be made public on these platforms and train internal stakeholders (e.g. HHS full-time staff and HHS contractors) on how to appropriately determine whether content can be published on these platforms.
2. **External Contributions:** Document the community guidelines within the public repository and prioritize tools and platforms that enable content moderation and review, so that internal members can ensure that inappropriate content is either prevented from being published or removed once its identified.
