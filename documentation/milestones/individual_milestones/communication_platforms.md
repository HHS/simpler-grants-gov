# Communication platforms

## Short description

Implement chat, wiki, and ticket tracking in a way accessible for all team members and the public.

## Goals

### Business description & value

We must have easy-to-use and effective tools for communicating as a team. These communication technologies will be perhaps the most important pieces of technology implemented by and used by the team.

These need to be accessible to internal (HHS or employed by HHS) partners as well as external partners (members of the general public).

### Technical description

Explore options for group chat, such as:

* Slack
* HipChat
* Discord
* Microsoft Teams
* Open source alternatives like Mattermost, etc
* Others?

Explore options for wiki-style storage and editing of documents, such as:

* Confluence
* Github wiki
* Open source wiki platforms
* Others?

Explore options for tracking of tickets with ability to track epics and burndown charts, such as:

* GitHub with Zenhub

These should be selected, implemented, and deployed.

For the wiki-style tool, we need integrated page analytics so we can view stats such as the number of total visits to a page (or collection of pages) as well as unique visitors, time on page, etc.

The wiki-style tool should have internationalization capabilities or we should document

Ideally, the tool would have the ability to designate some users as direct editors of pages (do not need permission before merging changes) and some users as suggesters (can submit suggested changes that need to be approved by one or more editors before they get merged).

Any code used to deploy or integrate these services should be made open source.

### Definition of done

- [ ] Onboarding instructions for new users are clearly and accessibly documented in a public place.
- [ ] Instructions for the internal team that assists with onboarding new users are clearly and accessibly documented in a public place.
- [ ] Without logging in, members of the public can see tickets and wiki documents.
- [ ] New users can be onboarded to chat for no cost to the user in a process that takes less than 2 days.
- [ ] New users can be onboarded to wiki for no cost to the user in a process that takes less than 2 days.
- [ ] Services are accessible to all people on the HHS network, White House network, public internet, and preferably most or all agency networks.
- [ ] In chat, users can send private messages to each other as well as view private and public channels. Users can use emojis to react to messages.
- [ ] In wiki, users can see history of changes to all documents.
- [ ] In tickets, users can create epics (or a similar concept) and track burndown.
- [ ] At least 5 members of HHS full-time staff are onboarded to all tools.
- [ ] At least 5 members of contractor teams (employed by HHS) are onboarded to all tools.
- [ ] At least 3 members of the general public are onboarded to all tools.
- [ ] Integrate Google Analytics or similar tool into wiki-style tool.
- [ ] Code for managing and deploying these services is deployed to `main` & PROD (if necessary)

### Proposed metrics for measuring goals/value/definition of done

1. Number of monthly active users in Chat, total
2. Number of monthly active users in wiki, total
3. Number of monthly active users in Chat, external
4. Number of monthly active users in wiki, external
5. Weekly volume of Chat messages
6. Weekly volume of wiki edits/contributions

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
