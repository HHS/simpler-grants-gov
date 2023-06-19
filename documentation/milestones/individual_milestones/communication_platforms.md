# Communication platforms

| Field           | Value          |
| --------------- | -------------- |
| Document Status | Final Draft    |
| Epic Link       | TODO: Add Link |
| Epic Dashboard  | TODO: Add Link |
| Target Release  | TODO: Add Date |
| Product Owner   | Lucas Brown    |
| Document Owner  | Billy Daly     |
| Lead Developer  | TODO: Add Name |
| Lead Designer   | TODO: Add Name |

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

### Chat

Explore and evaluate options for group chat, such as:

- [Slack](https://slack.com/features)
- [Discord](https://discord.com/)
- [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software)
- [GitHub Discussions](https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/about-discussions)
- [Rocket.chat](https://www.rocket.chat/)
- [Mattermost](https://mattermost.com/)
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

### Ticket tracking

Explore options for tracking of tickets with ability to track epics and burndown charts, such as:

- [GitHub](https://github.com/) with [Zenhub](https://www.zenhub.com/)
- [Atlassian Jira](https://www.atlassian.com/software/jira)
- [Asana](https://asana.com/)
- Others as suggested by dev team

### Shared calendar

Explore options for a shared calendar of dates across teams, such as:

- [Confluence](https://www.atlassian.com/software/confluence/team-calendars)
- [Google Calendar](https://support.google.com/calendar/answer/37083?hl=en)
- Others as suggested by dev team

### Listserv

Explore options for a way to host listserves, such as:

- [Google Groups](https://support.google.com/groups/answer/46601?hl=en&ref_topic=9216&sjid=6954506169775690555-NA)
- [GSA's listservs](http://listserv.gsa.gov/)
- [Groups.io](https://groups.io/)
- [Mailman GNU](https://list.org/)
- [GroupServer](http://groupserver.org/)
- Others as suggested by dev team

### Email inbox

Explore options for a way to host an email inbox, such as `grants.simplification@hhs.gov`, where multiple staff can access the mailbox and respond to the messages, such as:

- [Front](https://front.com/)
- [Loop Email](https://www.intheloop.io/pricing-us/)
- [Google collaborative inbox](https://support.google.com/a/users/answer/167430?hl=en)
- HHS internal options
- Others as suggested by dev team

### Video conference

Explore options for supporting video calls both among project collaborators and members of the public, such as:

- [Zoom](https://zoom.us/)
- [Microsoft Teams](https://www.microsoft.com/en-us/microsoft-teams/group-chat-software)
- [Google Meet](https://meet.google.com/)
- [Jitsi](https://jitsi.org/)
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
  - [ ] Services are accessible to all people on the HHS network, White House network, public internet, and preferably most or all agency networks.
  - [ ] Onboarding instructions for new users are clearly and accessibly documented in a public place.
  - [ ] Instructions for the internal team that assists with onboarding new users are clearly and accessibly documented in a public place.
  - [ ] Code for managing and deploying these services is deployed to `main` & PROD (if necessary)
  - [ ] An ADR has been recorded which documents the tool chosen and the reasons for selecting it
- [ ] Chat is live with the following conditions satisfied:
  - [ ] Users can post messages to public channels (potentially with some restrictions applied).
  - [ ] Users can send private messages to each other as well as view private and public channels.
  - [ ] Users can reply to messages in a thread that other users can see.
  - [ ] Users can use emojis to react to messages.
- [ ] Wiki is live with the following conditions satisfied:
  - [ ] At least 1 document has been added to the wiki.
  - [ ] Without logging in, members of the public can see wiki documents.
  - [ ] Users can see history of changes to all documents.
  - [ ] Web analytics have been integrated into the wiki and administrators can report on unique users, page views, etc.
- [ ] Ticketing system is live with the following conditions satisfied:
  - [ ] Without logging in, members of the public can see tickets that are being worked on.
  - [ ] Default 'templates' have been created for tickets, epics, etc, that have the fields we've decided are necessary for the project.
  - [ ] Users can create epics (or a similar concept) and track burndown.
  - [ ] Members of the public can submit feature requests or report bugs
- [ ] Calendar is live with the following conditions satisfied:
  - [ ] At least 1 event has been added
  - [ ] Without logging in, members of the public can see calendar events that are open to the public
  - [ ] Members of the public can copy events to their own calendar and/or RSVP to attend the event
- [ ] Email listserv is live with the following conditions satisfied
  - [ ] At least one email has been sent out to the listserv
  - [ ] Any member of the listserv can send emails to the entire listserv
  - [ ] Any member of the listserv can reply all to an email
  - [ ] Any member of the listserv can reply directly to an email sender
- [ ] Shared email inbox is live with the following conditions satisfied
  - [ ] At least 1 email has been received

### Proposed metrics for measuring goals/value/definition of done

TODO: See if we can reduce the list of metrics to track

1. Chat Metrics
   1. Number of monthly active users in chat, total
   2. Number of monthly active users in chat, external
   3. Weekly volume of Chat messages
2. Wiki Metrics
   1. Number of monthly active users in wiki, total
   2. Number of monthly active users in wiki, visitors
   3. Weekly volume of wiki edits/contributions
3. Calendar Metric: Number of external users attending public meetings
4. Listserv Metrics
   1. Number of subscribed users in listserv, total
   2. Number of subscribed users in listserv, external
   3. Average number of responses in listserv thread
5. Shared Inbox Messages:
   1. Weekly volume of messages to shared inbox
   2. Average response time for a message

### Destination for live updating metrics

Not yet known.

## Planning

### Assumptions & dependencies

What capabilities / milestones do we expect to be in place at the beginning of work
on this milestone?

- [x] None

Are there any notable capabilities / milestones do NOT we expect to be in place at the
beginning of work on this milestone?

- [x] None
