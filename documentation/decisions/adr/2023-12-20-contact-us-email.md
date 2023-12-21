# Method and technology for "Contact Us" CTA

- **Status:** {Active}
- **Last Modified:** 2023-12-20
- **Related Issue:** [#682](https://github.com/HHS/simpler-grants-gov/issues/682)
- **Deciders:** Lucas Brown, Andy Cochran, Sumi Thaiveetil, {other collaborators}
- **Tags:** <!-- OPTIONAL -->

## Context and Problem Statement

How might we give users an alternative to public comments (GitHub, Google Groups, listserv, etc.) so that they might submit questions or feedback more privately? Is email the appropriate method? And how might we manage this feedback channel?


## Decision Drivers

- The "Contact Us" method should not be (or feel) like a black box
- Incoming messages should be easy/simple to triage, respond to, and escalate to the appropriate channels

## Options Considered

- Self-hosted .gov email address:
  - simpler@grants.gov
  - simplergrantsgov@hhs.gov
- [Google collaborative inbox](https://support.google.com/a/users/answer/167430?hl=en)
- Help Desk tool (such as):
  - [Loop](https://www.intheloop.io/)
  - [Front](https://front.com/)
  - [Odoo CRM](https://www.odoo.com/app/crm)

## Decision Outcome: simpler@grants.gov

Chosen option: **simpler@grants.gov**, because it is simple and accessible for end users, can be easily managed by comms staff, and matches the Simpler.Grants.gov domain.

### Positive Consequences

- Simple email communication is a technology that most all users are fimiliar and comfortable with.
- Since it does not require creation of accounts, or using 3rd-party ticketing dashboards, email is the most straightforward method by which users can submit their feedback.
- Provisioning an email address is fast/inexpensive and does not require procuring a service subscription.
- simpler@grants.gov echoes the project domain
- @grants.gov is an official/trusted top-level domain (TLD)
- This inbox can be easily triaged by the Simpler.Grants.gov project team via the "[Send emails to Slack](https://slack.com/help/articles/206819278-Send-emails-to-Slack)" feature.


### Negative Consequences

- We do not yet know the volume of submissions that will come through this feedback channel. A more robust Help-Desk-type of solution may be warranted in the future. We should revisit this decision if/when managing this inbox becomes unwieldy.
- There are no built-in, convenient ways to run analyses on an email inbox, or tag and filter messages by categories. It may be difficult to track metrics on common/recurring themes. This may become more of an issue as the number of submissions grows.

## Pros and cons of other options

### simplergrantsgov@hhs.gov

This option has similar benefits as the chosen option. However, we decided that it's better that the TLD of the email match that of the site.

- **Pros**
  - (See above chosen option)
- **Cons**
  - (See above chosen option)
  - Difficult to read
  - User may be confused as to why HHS is the TLD
  - This @hhs.gov email address is not easily accessible to comms staff

### Google collaborative inbox

Again, this option has similar benefits as the chosen option. However, we decided that it's better to use an official .gov TLD.

- **Pros**
  - (See above chosen option)
- **Cons**
  - (See above chosen option)
  - Not an official/trusted .gov email address


### Help Desk tool

Tools like [Loop](https://www.intheloop.io/), [Front](https://front.com/), [Odoo CRM](https://www.odoo.com/app/crm), and others were given cursory consideration. There are many various benefits. However, it is not yet know whether their functionalities are necessary. These options should be reevaluated if managing the email inbox becomes unwieldy.

- **Pros**
  - Automated workflows
  - Assigning, tracking, status
  - Labels, filters
  - Reporting and insights
  - Metrics on user satisfaction
- **Cons**
  - Additional costs and/or maintenance
