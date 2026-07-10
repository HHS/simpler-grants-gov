# Adding Slack Users to SimplerGrants Slack Workspace

* **Status:** Active
* **Last Modified:**&#x31;2/16/2024
* **Deciders:** Sarah, Billy, Lucas, Margaret

## Context and Problem Statement

Slack has multiple ways of adding new users: they can be added as members, guests, or by using Slack Connect. Currently new users have been added in inconsistent ways which leads to confusion and some users have been added multiple times using different ways. In order to streamline onboarding and ensure cost efficiency, standardization on the way we add new users is needed.

## Decision Drivers

* Create simple and repeatable processes to add new internal team members and external community members to slack.
* Minimize the cost of user licenses.
* Prioritize usability, both for individual Slack members and for admins who are managing our Slack workspace.

## Options Considered

The options considered include using Slack Connect along with the Full Member and Guest permissions, or to disable Slack Connect and only use Full Members and Guests.

A **full member** is someone who has access to all public slack channels and permissions to add integrations to Slack.

A **guest** is someone who has permissions to access only selected channel(s) and does not have permissions to add integrations or automations to Slack. There is no fee to add guests if they only have access to a single channel in the Slack workspace.

A **Slack Connect** user is a type of account where someone who is a paid user in another Slack workspace can gain access to specific Simpler Slack channel(s) in their other Slack workspace through Slack Connect. They will not need to switch Slack workspaces to see the channel and respond to messages, and will appear as an external user in the other Slack workspace.

## Decision Outcome

Add internal team members and external community members as full members to the SimplerGrants slack, and discontinue using Slack Connect. At present, Slack Connect only needs to be used for Metabase and GitBook support channels.

### Positive Consequences

* Having a consistent way to onboard internal team members will reduce confusion during set-up.
* Not using Slack Connect will reduce confusion in how channels are organized and in what kinds of permissions people have.
* Using the Guest permission set for external community members means that we can more easily limit their access to our slack. Guests can only access channels they are given specific access to, so we could reduce the number of private channels we have and label channels with “internal” to create an understanding that those channels are only for internal use.

### Negative Consequences

* Slack Connect users are free as long as both the organization the user is from and the organization creating the Slack Connect channel are on paid accounts; therefore, SimplerGrants would have to pay for all the internal users. If we don’t use Slack Connect, we will miss out on an opportunity to save costs on Slack members.
* Disabling Slack Connect and switching open source users to guest licenses would involve change management and some extra overhead upfront. For example, we’ll need to get all users currently using Slack Connect to create full licenses and invite them back to their corresponding channels.
* Previous messages or comments from Slack Connect users may become harder to search, depending on how they are archived when Slack Connect is turned off.
* Guests cannot browse/explore channels and add themselves to the topics they are interested in. Guests must be manually added to channels by members. This makes our workspace less transparent and increases the effort it takes to get guests into all the channels they need to access.&#x20;

### Pros and Cons of the Options

#### Adding users as full members or guests and disabling Slack Connect

In this scenario, every user added to Slack would be added either as a full member (with access to all public channels and permissions to add automations), or guests with limited access to select channels and limited permissions in those channels (usually to read and write in those channels, but without the ability to add plug-ins or automations.) Slack Connect could be disabled or simply not used.

#### Pros

* Straightforward way of adding users
* Easily ensure the right users have the right access
* Protects against duplicate users (Slack Connect can cause user duplication) which creates confusion on the team&#x20;
* Reduces the confusing channel labeling that occurs when Slack Connect users are added to a channel

#### Cons

* If users only need access to 1-2 channels, they’ll still have to use the SimplerGrants Slack workspace instead of accessing the channels through their connected Slack workspace
* Requires paying for licenses for all users, including those who would be eligible to join channels using Slack Connect.

#### Using Slack Connect for some users, and full members or guests for other users

In this instance, some users would be added as Slack Connect users which would allow them to access channels through their company Slack workspace. They would be added as externally  connected users to SimplerGrants Slack and would not be full members in SimplerGrants. Some users may be full members or guests instead.

#### Pros

* Slack Connect users are free in the SimplerGrants workspace and don’t count towards the membership quantity total. Slack Connect requires both Slack workspaces to have paid plans already, so there is no additional charge to add the connections.
* Provides ease of use for users who only need access to a couple of channels because they don’t have to switch Slack workspaces to use those channels.

#### Cons

* Users can be duplicated with Slack Connect- a user can be a full member and also have a connection through Slack Connect with specific channels, and this may create confusion about which instance of a user to tag or message.
* Slack Connect changes the way channels are organized globally- Slack Connect channels float to the top of the Slack workspace in their own “External Connections” category and can only be reorganized in this spot. This may create confusion for all users.
* If a user is set up with Slack Connect to access a couple of channels and then requires access to more channels, a decision will need to be made at some point around when individuals should or should not use Slack Connect and become full members. This adds process and overhead to managing Slack.
* May cause connected Slacks to fall under the Freedom of Information Act (FOIA) and could potentially require them to release information under this act.
* Requires we manually add Slack Connect users to every public channel that we want them to access. They cannot browse/explore channels and add themselves to the topics they are interested in.&#x20;

### Links

[Understand guest roles in slack](https://slack.com/help/articles/202518103-Understand-guest-roles-in-Slack)

[An introduction to sharing channels and guest accounts](https://slack.com/resources/slack-for-admins/guests-vs-channels-in-slack-connect)

[Slack connect guide](https://slack.com/help/articles/115004151203-Slack-Connect-guide--work-with-external-organizations#slack-connect-for-channels)

<br>
