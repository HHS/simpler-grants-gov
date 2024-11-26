# Internal Wiki ADR

* **Status:** Draft
* **Last Modified:** 2024-11-22
* **Deciders:** Lucas Brown, Julius Chang, Billy Daly, Sarah Knopp, Margaret Spring, Andy Cochran

## Overview

### Context and Problem Statement

The SimplerGrants program needs a way of storing and sharing information about the program for internal team members. A wiki format is ideal because it provides context and information for users to help them navigate through content and requires few clicks for team members to obtain what they need. The team can also make their own updates to content on the wiki, so it is a self-service solution. The current solution, Gitbook, has received negative feedback from program team members due to concerns around usability. A re-evaluation of the needs for an internal wiki platform is conducted here, and the criteria have been updated to reflect current program priorities.

### Assumptions

* This ADR assumes only internal team members will use the internal wiki. External groups we interface with, such as Co-Design Group and Code Challenge participants, should only use the external wiki or the document sharing repositories.
* This ADR does not cover the public wiki or any needs related to the public wiki. These should be addressed separately.
* Additional decisionmaking will be required by creating norms for the external wiki and doc sharing tools. This will inform where we are storing what information.

### Decision Drivers

#### **Must Have**

* Hosting: SaaS is needed so as not to increase program overhead with hosting management.
* Usability: Non-technical users must be able to access and create content with minimal training or guidance.
* Comments: Reviewers should be able to leave in-line comments on content that they are reviewing.
* Version History: Editors should be able to see and restore previous versions of a given page.
* Multi-Media: The platform should support multiple types of media (e.g. videos, images, file uploads, tables, diagrams) with minimal configuration.
* Onboarding Costs: Onboarding new members to the platform should be relatively inexpensive, both in terms of staff time/resources and direct costs (e.g. licensing fees).
* Maintenance Costs: It should not be prohibitively expensive to maintain the wiki, both in terms of staff time/resources and direct costs (e.g. hosting fees).

#### **Nice to Have**

* Web Analytics: The platform should provide support for tracking site usage and other web analytics.
* Content Review: The ability to put new changes into a change request or similar state and allow for a reviewer to preview before it is merged is not critical given the tool is only for internal use.
* Open Source: The tool used to manage and host the wiki content should be open source, if possible.
* Calendar page: Shared calendars have been a program challenge. The ability to sync and display calendars for multiple teams on a wiki page would be a nice asset that would resolve a current pain point.

### Options Considered

* Confluence
* Notion
* Gitbook
* wiki.js
* Google Workspace (Document Sharing Solution)

### Decision Outcome

The SimplerGrants.gov team does not find enough of a need for a dedicated internal wiki to purchase a wiki platform or continue on with our internal Gitbook wiki. Instead, a combination of our Gitbook external wiki and our chosen Doc Sharing platform, Google Workspace, will be used to host the documents the team needs.&#x20;

The project’s dedication to transparency and developing in the open lends itself well to the idea that some documentation that can be made public about the work, should be made public. However, the team also recognizes that there is a need to keep certain documentation private (such as security related matters or administration guidelines for our open source community, for example) and these documents can be stored on Google Drive.

Additional discussion is required to form norms around the Doc Sharing and External Wiki solution to ensure that it meeds all of the needs of the team to replace the internal wiki.

#### Positive Consequences

Moving to this solution will reduce overhead for the team, as we will not have to learn and manage yet another tool and contents of it, and also ensures we are spending contract funds wisely.&#x20;

#### Negative Consequences

There will need to be time and effort put into updating and migrating all of the exisiting content in the internal wiki. There is also a lack of a knowledge base type space that is just for program team members,

## Pros and cons of the options

### Confluence

Confluence is a Software as a Service (SaaS) documentation and collaboration tool offered by Atlassian that organizes content into "spaces" and offers a series of templates and components that can be used to create custom documentation for internal and external stakeholders.

#### Details

* **Pricing:** $6.40 (standard) or $12.30 (premium) per user per month
* **Hosting:** SaaS
* **Usability:** A good choice for non-technical users
* **Comments:** Yes
* **Version History:** Yes
* **Multi-Media:** Yes
* **Onboarding Costs:** Cost to purchase license and migrate content
* **Maintenance Costs:** See pricing
* **Web Analytics:** Yes
* **Content Review:** Yes, but through drafts
* **Open Source:** Proprietary
* **Calendar page:** Yes

#### Pros

* User friendly for non-technical users. Enthusiastic support from the program team for this option.
* Supports a wide variety of media and page content
* Supports drafts, which allow edits to be made without publishing
* Supports page history and comparison of previous versions
* Limited support for public pages and spaces
* Minimal ongoing maintenance costs due to SaaS hosting
* Most affordable per user cost for a given tier of features
* Calendar page will allow syncing of multiple team calendars

#### Cons

* Does not support a formal review process for drafts before they can be published
* Supports fewer content types than Notion, especially in terms of structured data
* Not open source

### Notion

Notion is a Software as a Service (SaaS) documentation and collaboration tool that also allows users to add structured and semi-structured content to pages. Because Notion offers a fully-featured API for reading and managing content, it also has a robust set of community integrations that extend Notion's core functionality.

#### Details

* **Pricing:** $8 (pro) or $15 (business) per user per month
* **Hosting:** SaaS
* **Usability:** Good for non-technical users
* **Comments:** Yes
* **Version History:** Limited support, past 30-90 days
* **Multi-Media:** Yes
* **Onboarding Costs:** Moderately high- need to purchase the tool, train the team, migrate content
* **Maintenance Costs:** Moderately high (see pricing)
* **Web Analytics:** Native page analytics available
* **Content Review:** No
* **Open Source:** No
* **Calendar page:** Yes

#### Pros

* Relatively user friendly for non-technical users
* Allows publishing pages to the web for external user access
* Supports the widest variety of page content and media
* Robust plugin and add-on community

#### Cons

* Slightly more complicated interface than Confluence
* Pages published to the web aren't organized as clearly as public pages in GitBook
* No content review process, all changes and comments are published automatically
* Page history is limited to 30 (pro) or 90 (business) days
* Closed source proprietary tool

### GitBook

GitBook is a Software as a Service (SaaS) platform for creating and managing public documentation for a project. GitBook prioritizes version control and collaboration by offering first class support for reviewing and merging content changes. It has become a common documentation and wiki tool for many open source projects.

#### Details

* **Hosting:** SaaS
* **Pricing:** $6.70 (plus) or $12.50 (pro) per user per month- currently use pro
* **Usability:** Moderate learning curve for non-technical users. Negative feedback received from the program team about usability of the platform.
* **Comments:** Yes
* **Version History:** Yes, at the level of a space. Page-based history is harder to see.
* **Multi-Media:** Yes
* **Onboarding Costs:** None, as we currently use this platform
* **Maintenance Costs:** See pricing, continuous training of users
* **Web Analytics:** Yes
* **Content Review:** Yes
* **Open Source:** Proprietary
* **Calendar page:** No

#### Pros

* Relatively friendly for non-technical users
* Most robust content review process across all wikis, enforceable on a page-by-page basis
* Public spaces and pages are well organized and searchable
* Supports a wide variety of media and content types
* Supports Google Analytics integration as well as limited native analytics
* Supports external contributions through GitHub PRs
* Supports beginning-of-time page history and version comparison
* Minimal ongoing maintenance costs due to SaaS hosting
* Exposes limited API for content and space management
* Data can be synced to GitHub repo owned by HHS

#### Cons

* Interface has received negative feedback from current program team members, specifically around creating, reading, and updating tables and knowing which of our two wikis is being edited.
* Supports fewer content types than Notion, especially in terms of structured data
* Content API is limited in capability and less intuitive than Notion API
* External users cannot directly comment or suggest changes in the app
* Native web analytics are less robust than Confluence or Notion
* More expensive than Confluence for similar feature set

### Wiki.js

Wiki.js is an open source wiki platform that seeks to replicate many of the basic features found in SaaS offerings like Confluence or GitBook.

#### Details

* **Pricing:** Free
* **Hosting:** Self-hosted
* **Usability:** Steep learning curve for non-technical users
* **Comments:** Yes
* **Version History:** Limited Support
* **Multi-Media:** Yes
* **Onboarding Costs:** Cost would be the investment for users to learn the platform
* **Maintenance Costs:** None
* **Web Analytics:** Total control over data, Git-sync and API available
* **Content Review:** Yes
* **Open Source:** Yes
* **Calendar page:** No

#### Pros

* Open source and self-hosted
* Robust control over access and permissions
* Supports Google Analytics integration
* Supports external contributions through GitHub PRs
* Full control over data

#### Cons

* Significantly less intuitive than other wiki options
* Documentation for the tool is lacking
* Requires significant investment of staff time for initial configuration and ongoing maintenance
* Features are less mature than other SaaS offerings like Confluence or GitBook

#### Using Google Workspace/Document Sharing Solution as a wiki tool

Given that our program Document Sharing solution is low cost, and utilizing a wiki is technically a way of sharing documentation, an assessment of using Google Workspace as a wiki is included to find out if it is usable and what the benefits or drawbacks are.

* **Price:** None- already owned by program contractors
* **Hosting:** SaaS
* **Usability:** Perceived as challenging given information is buried in documents without any way to denote what to open other than external instructions or file names. No wiki format is available in Google Workspace.
* **Comments:** Yes
* **Version History:** Yes
* **Multi-Media:** Yes
* **Onboarding Costs:** Expected to be high in terms of labor given IA is based on folder structure
* **Maintenance Costs:** Expected to be high in terms of labor given IA is based on folder structure
* **Web Analytics:** None
* **Content Review:** No functionality available for this
* **Open Source:** Proprietary
* **Calendar page:** Team members can see their own workspace calendars and any calendars they’ve added. No hosted wiki page with a calendar is available.

### Links

* [Confluence](https://www.atlassian.com/software/confluence)
* [Confluence Pricing](https://www.atlassian.com/software/confluence/pricing?gclsrc=aw.ds&\&campaign=18312196222\&adgroup=138055851821\&targetid=kwd-28314402634\&matchtype=e\&network=g\&device=c\&device_model=\&creative=666242883495\&keyword=confluence%20pricing\&placement=\&target=\&ds_eid=700000001542923\&ds_e1=GOOGLE\&gad_source=1\&gclid=Cj0KCQiAlsy5BhDeARIsABRc6ZtSUJKITdmvyJ1QLWfFuXqdUGDdzEShcEjRZHTp1CRHtplvlzvj9iMaAr1MEALw_wcB)
* [Notion.so product](https://www.notion.so/product)
* [Github Wiki](https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis)
* [Gitbook](https://www.gitbook.com/)
* [wiki.js](https://js.wiki/)
* [Google Workspace](https://workspace.google.com/)
