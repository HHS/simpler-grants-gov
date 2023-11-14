# Use Ethnio for design research

- **Status:** Active
- **Last Modified:** Nov 14, 2023
- **Related Issue:** [#117}](https://github.com/HHS/simpler-grants-gov/issues/117})
- **Deciders:** Andy Cochran, \[Designer/researcher\]
- **Tags:** design, research, recruitment, incentives, scheduling

## Context and Problem Statement

Simpler Grants would benefit from more robust tools for conducting user research (e.g. interviews and usability tests).

## Decision Drivers

- **Participant recruitment and management** -- The tool(s) should allow for robust management of research participants. We need the ability to track, sort, and filter participants and our interaction with them in a central database.
- **Incentives disbursement** -- It's important ethically that we compensate research participants for their time. We need a tool that allows us to easily send electronic rewards (e.g. gift cards) to participants after research sessions. This tool should include tracking and reporting.
- **Scheduling** -- Larger research efforts require a lot of calendar coordination to provide participants with options that also work for facilitators. The tool should be able to schedule 1:1s, group sessions, and multi-part sessions; account for time zones; allow syncing of facilitators' calendars; integrate with Zoom; and send emails to participants (bonus: SMS) to both schedule and remind them of their scheduled time.
- **Screeners / intercepts** -- Calls-to-action on the site should allow users to sign up as potential research participants. The tool should include a way of analyzing the pool of participants so that they can be funnelled to the right engagement opportunity (usability study, interview, focus group, etc) based on their answers to a set of survey questions that help identify the their archetype.
- **Research data repository** -- The tool(s) _might_ also include a place to store, manage, analyze, and share customer insights. However, of these decsion drivers, this may most easily be done through existing tools (see (Use Mural for design diagrams and whiteboarding)[./2023-07-11-design-diagramming-tool.md]), and insights/findings should be stored in a long-term location kepr separate from PII.


## Options Considered

[Ethnio]: https://ethn.io/
[Tremendous]: https://www.tremendous.com/
[Qualtrics]: https://www.qualtrics.com/
[GreatQuestion]: https://greatquestion.co
[Dovetail]: https://dovetail.com/
[Giftbit]: https://www.giftbit.com/
[Typeform]: https://www.typeform.com/
[SurveyMonkey]: https://www.surveymonkey.com/

| tool/feature    | [Ethnio] | [Tremendous] | [Qualtrics] | [GreatQuestion] | [Dovetail] | [Giftbit] | [Typeform] | [SurveyMonkey] |
| User            | ✔        | ✗            | ✔           | ✔               | ✗          | ✗         | ✗          | ✗              |
| Incentives      | ✔        | ✔            | ✢           | ✢               | ✗          | ✔         | ✗          | ✗              |
| Scheduling/cal  | ✔        | ✗            | ✔           | ✔               | ✗          | ✗         | ✗          | ✗              |
| Surveys         | ✔        | ✗            | ✔           | ✔               | ✗          | ✗         | ✔          | ✔              |
| Data repo       | ✢        | ✗            | ✔           | ✔               | ✔          | ✗         | ✗          | ✗              |
| Nava experience | ✔        | ✔            | ✗           | ✔               | ✔          | ✗         | ✗          | ✗              |

(✔ Built-in, ✢ Integration available, ✗ Not included)

## Decision Outcome

Chosen option: (Ethnio)[https://ethn.io/], because as a single tool it satisfies most decision drivers and has been validated/endorsed by Nava experience.

### Positive Consequences

Ethnio is a user research CRM for tracking participant activity. Nava has used it with much success on other projects. It addresses many needs in one tool with the following features:

- **Participant pool** — Manage participants with tags, notes, segments and filters. Keep a record of key interactions.
- **Incentives** — Participants receive compensation in their preferred method. Weekly or monthly reports on spending. Prepaid balance never expires.
- **Screeners** — Post or email screeners that recruit participants with qualifying questions and filtering logic and optional feedback surveys.
- **Intercepts** — Embed targeted intercepts in desktop and mobile viewports to recruit or survey site users in specific locations or devices.
- **Scheduling** — Invite, schedule, and remind participants. Combined team calendar with Outlook and Google integration.

There is potential (depending on procurement) for Ethnio to be used both by this Simpler.Grants.gov project and HHS's other grants improvement efforts, which would let them share a single participant pool within a centralized database where participants can be tagged/labeled and their activity can be tracked (incentives might also be funded in a single location).

Other features of note: Internationalized and localized. Section 508 and WCAG 2.0 (AA). GDPR- and CCPA-compliant data retention, expiration, and portability.

### Negative Consequences

Ethnio does not include a research data repository. However, this is the one single feature need unmet (and shared text docs, internal wiki, and Mural will suffice).

The cost is $82+/seat/month, however an Enterprise account is required for the Participant Pool feature.


## Pros and Cons of other options

### Tremendous

(Tremendous)[https://www.tremendous.com/] is only for incentives disbursement. Nava has experience using this. Free to use, Tremendous lets the user select their preferred method: cash, prepaid card, gift card, or donation.

**Cost:** Free (Only pay for the incentives loaded into it.)

- **Pros**
  - Simple
  - Free
  - Simple reporting
  - WCAG 2.0
  - W-9 form collection
- **Cons**
  - Only addresses a single need. Requires we either procure other tools (e.g. for participant mgmt) or handle those needs through existing tools and manual processes (see caveat under Priority). However, it should be noted that Tremendous has integrations with other tools (e.g. Qualitrics, Great Question, etc).

### Qualtrics

(Qualtrics)[https://www.qualtrics.com/] is used for feedback forms on HHS.gov. Includes a user research CRM (among other features). Integrates with Tremendous, Slack, Figma, calendars, Zoom.

**Unknowns:** Might it possible for both Simpler Grants teams (Nava and HHS staff) to access this tool? If seats are available, we could use it for participant recruiting & management, as a research data repository, and integrate with Tremendous for incentives.

**Cost:** Pricing not clear (enterprise only?)

- **Pros**
  - Already in use for www
  - FedRAMP authorization / NIST 800-53
- **Cons**
  - Not specifically for user research
  - Unintuitive UI complicated by unnecessary features (people mgmt, HR, product mgmt, etc)
  - Nava has no previous experience with it

### GreatQuestion

(GreatQuestion)[https://greatquestion.co] is the all-in-one solution. It has all the features we need. It even includes unmoderated usability testing (note: Nava would recommend maze.co if we were to pick a single-purpose tool for usability tests, and choosing other tools does not preclude us from conducting unmoderated tests in the future). Integrates with Tremendous and other tools. GDPR/HIPAA compliant.

**Cost:** $35/seat/month "Team" plan may suffice.

- **Pros**
  - Has everything
  - Intuitive interface
- **Cons**
  - Nava has little experience with it (a free trial for a single project test)

### Other tools explored (tho quickly ruled out)
- [Dovetail] -- Industry-standard research data repository. Lots of tool integrations. Hefty price tag. Likely not necessary for such a small team. Only feature it provides is a data repo.
- [Giftbit] -- Similar functionality to Tremendous (which is preferred by Nava). Is (recommended by 18F/TSS)[https://handbook.tts.gsa.gov/18f/how-18f-works/research-guidelines/#how-do-i-actually-distribute-the-compensation-to-research-participants].
- [Typeform] -- Basic surveys. Custom branding. High price point.Integrates w/ Tremendous, Dovetail. Only feature it provides is surveys.
- [SurveyMonkey] -- Integrates with Tremendous, Dovetail. Only feature it provides is surveys.
- (maze.co)[https://maze.co] -- Industry-standard Figma testing. Nava's recommended platform for unmoderated usability testing (likely not needed in the near-term).
