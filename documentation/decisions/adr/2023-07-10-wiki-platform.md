# Communications Tooling: Wiki Platform

- **Status:** Accepted
- **Last Modified:** 2023-07-10 <!-- REQUIRED -->
- **Related Issue:** [#30](https://github.com/HHS/grants-equity/issues/30) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sarah Knopp, Sumi Thaiveettil
- **Tags:** communucations, open source, wiki

## Context and Problem Statement

The [communications platform milestone](milestone) identifies a series of platforms through which the Grants API project needs to engage both internal and external stakeholders. One of these platforms is a wiki for storing notes, documents, and other content about the project. Ideally we would select a platform that balances ease of use and flexibility with the cost of implementing and maintaining the wiki.

The goal of this ADR is to evaluate a series of potential wiki platforms and determine which one best fits the needs and objectives of this project based on the decision criteria outlined below.

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Usability:** Non-technical users should be able to access and create content with minimal training or guidance.
- **Public Access:** Members of the public should be able to read public documentation in the wiki without needing to sign up or login to a service.
- **Content Review:** Collaborators should be able to review and edit draft content before those changes are published.
- **Comments:** Reviewers should be able to leave in-line comments on content that they are reviewing.
- **Version History:** Editors should be able to see and restore previous versions of a given page.
- **Multi-Media:** The platform should support multiple types of media (e.g. videos, images, file uploads, tables, diagrams) with minimal configuration.
- **Internationalization (i18n):** The platform should provide support for displaying content in multiple languages.
- **Web Analytics:** The platform should provide support for tracking site usage and other web analytics.
- **Onboarding Costs:** Onboarding new members to the platform should be relatively inexpensive, both in terms of staff time/resources and direct costs (e.g. licensing fees).
- **Maintenance Costs:** It should not be prohibitively expensive to maintain the wiki, both in terms of staff time/resources and direct costs (e.g. hosting fees).

#### Nice to Have

- **External Contributions:** Members of the public should be able to suggest changes to wiki content and internal stakeholders should be able to review those contributions before they are published.
- **Data Access:** Content generated and stored in the wiki should be accessible outside of the wiki platform, either through syncing content to an HHS owned repository or through an official API.
- **Machine Readability:** The wiki platform should also support storing and exposing content in a machine-readable format so that certain types structured data can be managed within and accessed from the wiki without parsing.
- **Open Source:** The tool used to manage and host the wiki content should be open source, if possible.
- **Authority to Operate (ATO):** Because the wiki is a support tool rather than a production service, it doesn't *need* to be covered under the Grants.gov ATO. However, being covered under the existing ATO is an advantage if, in the future, we want to use it to support our production service (e.g. hosting training materials for grant applicants or grantors)

## Options Considered

- [Confluence](confluence) - *NOT chosen* because of limits around data access and content review
- [Notion](notion) - *NOT chosen* because of limits on version history and content review
- [GitHub Wiki](gh-wiki) - *NOT chosen* because of limited feature set and issues with usability
- [GitBook](gitbook) - *Chosen* because of support for content review and GitHub syncing
- [WikiJS](wiki-js) - *NOT chosen* because of issues with usability and requirements for ongoing maintenance

## Decision Outcome <!-- REQUIRED -->

We have decided to use **GitBook** as our wiki platform because it balances the usability and maintainability of a SaaS offering like Confluence with key features around data access and content review.

Although it is a proprietary tool, it has become a standard platform for managing documentation within open source projects, mainly because it emphasizes version control within the documentation and enables bi-directional syncing of content between GitBook and GitHub.

### Positive Consequences <!-- OPTIONAL -->

- Wiki content can be presented in a more usable format for editing and reading, while still being version-controlled alongside our code in GitHub
- Non-technical users who are not familiar editing content directly in markdown can easily create and modify pages (if they have a GitBook license)
- Contributions and changes to existing documentation can be reviewed before they are published

### Negative Consequences <!-- OPTIONAL -->

- Users who don't have a license to edit and manage content in GitBook (i.e. members of the public) can only make suggested edits or contributions through creating Pull Requests (PRs) in GitHub which can present a high barrier to entry for non-technical users
- Because GitBook isn't covered under the existing Grants.gov ATO, we will not be able to use it for production services. If in the future we want to use GitBook as part of our production service, we'll need to seek ATO approval.

### Back-up Options

If we can't get coverage for GitBook under the existing ATO, we should pursue one of the following solutions:

- **Wiki.js** if we want to prioritize data access and open source tools but are willing to compromise on maintenance costs and usability

## Comparison Matrix

- ✅ Feature available, meets requirement
- ❌ Feature not available, does not meet requirement
- 🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
- 1-3 Strength level
- ❓Unknown

| Factor                      | Confluence | Notion | GitHub Wiki | GitBook | Wiki.js |
| --------------------------- | :--------: | :----: | :---------: | :-----: | :-----: |
| Usability                   |     3      |   2    |     1      |    2     |    1    |
| Public Access               |     🔄     |   🔄   |     ✅      |    ✅    |    ✅    |
| Content Review              |     🔄     |   ❌   |     ❌      |    ✅    |    🔄    |
| Comments                    |     ✅     |   ✅   |     ❌      |    ✅    |    🔄    |
| Version History             |     ✅     |   🔄   |     ✅      |    ✅    |    🔄    |
| Multi-Media                 |     ✅     |   ✅   |     ❌      |    ✅    |    ✅    |
| I18n                        |     🔄     |   🔄   |     ❌      |    ✅    |    ✅    |
| Web Analytics               |     ✅     |   ✅   |     ❌      |    ✅    |    🔄    |
| Onboarding Cost Efficiency  |     2      |   2   |      3      |    2     |    1    |
| Maintenance Cost Efficiency |     2      |   2   |      3      |    2     |    1    |
| External Contributions      |     ✅     |   ✅   |     🔄      |    🔄    |    🔄    |
| Data Access                 |     🔄     |   🔄   |     ✅      |    ✅    |    ✅    |
| Machine Readability         |     🔄     |   ✅   |     ❌      |    🔄    |    ✅    |
| Open Source                 |     ❌     |   ❌   |     ❌      |    ❌    |    ✅    |
| Authority to Operate        |     ❌     |   ❌   |     ✅      |    ❌    |    ✅    |

## Pros and Cons of the Options <!-- OPTIONAL -->

### Confluence

[Confluence](confluence) is a Software as a Service (SaaS) documentation and collaboration tool offered by Atlassian that organizes content into "spaces" and offers a series of templates and components that can be used to create custom documentation for internal and external stakeholders.

#### Details

- **Hosting:** SaaS
- **Pricing:** [$5.75 (standard) or $11 (premium) per user per month](confluence-pricing)
- **Public Access:** Supported, but limited to individual pages or entire spaces
- **Content Review:** Partial support, limited to drafts and not enforceable
- **Version History:** Supported by default
- **Supported Media**
  - Markdown style text
  - File uploads
  - Image embedding
  - Video embedding
  - Diagrams
- **I18n:** Limited third party plugins for automating translation
- **Web Analytics:** [Google Analytics plugin](confluence-ga) available, also native analytics with premium tier
- **Open Source Status:** Propietary
- **External Contributions:** Only supported in public spaces (without review)
- **Data Access:** Limited access via API

#### Pros

- Relatively user friendly for non-technical users
- Supports a wide variety of media and page content
- Supports drafts, which allow edits to be made without publishing
- Supports page history and comparison of previous versions
- Limited support for public pages and spaces
- Minimimal ongoing maintenance costs due to SaaS hosting
- Most affordable per user cost for a given tier of features

#### Cons

- Does not support a formal review process for drafts before they can be published
- Supports fewer content types than Notion, especially in terms of structured data
- Content can only be made public at the level of an individual page or an entire space
- Content API is limited in capability and less intuitive than Notion API
- No direct support for internationalization and localization
- Closed source proprietary tool
- Data is controlled by Confluence, only accessible via API

### Notion

[Notion](notion) is a Software as a Service (SaaS) documentation and collaboration tool that also allows users to add structured and semi-structured content to pages. Because Notion offers a fully-featured API for reading and managing content, it also has a robust set of community integrations that extend Notion's core functionality.

#### Details

- **Hosting:** SaaS
- **Pricing:** [$8 (pro) or $15(business) per user per month](notion-pricing)
- **Public Access:** Supported, but limited to individual pages
- **Content Review:** Not supported
- **Version History:** Limited support, past 30-90 days
- **Supported Media**
  - Markdown style text
  - Tabular/structured data
  - Image embedding
  - Video embedding
  - Diagrams
- **I18n:** Partial support, Third-party beta plugin for translation
- **Web Analytics:** Native page analytics available
- **Open Source Status:** Propietary
- **External Contributions:** Only supported on public pages (without review)
- **Data Access:** Access via API

#### Pros

- Relatively user friendly for non-technical users
- Allows publishing pages to the web for external user access
- Supports the widest variety of page content and media
- Supports public comments and edits in the app
- Minimimal ongoing maintenance costs due to SaaS hosting
- Exposes wiki content via an API
- Robust plugin and add-on community

#### Cons

- Slightly more complicated interface than Confluence
- Pages published to the web aren't organized as clearly as public pages in GitBook
- No content review process, all changes and comments are published automatically
- No direct support for internationalization and localization
- Page history is limited to 30 (pro) or 90 (business) days
- Closed source proprietary tool
- Data is controlled by Notion, only accessible via API

### GitHub Wiki

[GitHub Wiki](gh-wiki) is a free feature for public repositories that allows maintainers of the repository to host documents and other content that isn't stored directly within the repository itself.

#### Details

- **Hosting:** SaaS
- **Pricing:** Free for public repositories
- **Public Access:** Supported by default
- **Content Review:** Not supported
- **Version History:** Supported by default
- **Supported Media**
  - Markdown style text
  - Image embedding
- **I18n:** No support
- **Web Analytics:** No support
- **Open Source Status:** Propietary
- **External Contributions:** Supported with GitHub login (without review)
- **Data Access:** Can be exported or cloned from repo

#### Pros

- Available for free with public repositories
- Supports public access to view wiki content by default
- Minimimal ongoing maintenance costs due to SaaS hosting
- All of the wiki data can be exported with the GitHub repo
- Supports contributions from anyone with GitHub license (based on wiki settings)

#### Cons

- One of the hardest-to-use tools for non-technical audiences
- Supports a very limited set of media formats, mainly markdown and images
- Does not support web analytics
- Does not support internationalization
- Closed source proprietary tool

### GitBook

[GitBook](gitbook) is a Software as a Service (SaaS) platform for creating and managing public documentation for a project. GitBook prioritizes version control and collaboration by offering first class support for reviewing and merging content changes. It has become a common documentation and wiki tool for many open source projects.

#### Details

- **Hosting:** SaaS
- **Pricing:** [$6.70 (plus) or $12.50 (pro) per user per month](gitbook-pricing)
- **Public Access:** Supported by default
- **Content Review:** Supported by default
- **Version History:** Supported by default
- **Supported Media**
  - Markdown style text
  - File uploads
  - Image embedding
  - Video embedding
  - Diagrams
- **I18n:** Native support with [page collections and variants](gitbook-i18n)
- **Web Analytics:** [Google Analytics integration](gitbook-ga) available
- **Open Source Status:** Propietary
- **External Contributions:** Limited support, only through GitHub PRs
- **Data Access:** Full access with GitHub sync, limited access with API

#### Pros

- Relatively friendly for non-technical users
- Most robust content review process across all wikis, enforceable on a page-by-page basis
- Public spaces and pages are well organized and searchable
- Supports a wide variety of media and content types
- Supports Google Analytics integration as well as limited native analytics
- Supports external contributions through GitHub PRs
- Supports beginning-of-time page history and version comparison
- Supports itnernationalization across all pages
- Minimimal ongoing maintenance costs due to SaaS hosting
- Exposes limited API for content and space management
- Data can be synced to GitHub repo owned by HHS

#### Cons

- Slightly more complicated interface than Notion or Confluence
- Supports fewer content types than Notion, especially in terms of structured data
- Content API is limited in capability and less intuitive than Notion API
- External users cannot directly comment or suggest changes in the app
- Native web analytics are less robust than Confluence or Notion
- More expensive than Confluence for similar feature set
- Not currently covered under the Grants.gov ATO

### Wiki.js

[Wiki.js](wiki-js) is an open source wiki platform that seeks to replicate many of the basic features found in SaaS offerings like Confluence or GitBook.

#### Details

- **Hosting:** Self-hosted
- **Pricing:** Free to use, cost of self-hosting
- **Public Access:** Supported by default
- **Content Review:** Limited support, via GitHub PRs
- **Version History:** Limited support
- **Supported Media**
  - Markdown style text
  - File uploads
  - Image embedding
  - Video embedding
  - Diagrams
- **I18n:** Native support
- **Web Analytics:** Google Analytics support available
- **Open Source Status:** Open Source
- **External Contributions:** Requires sign up (but no license cost)
- **Data Access:** Total control over data, Git-sync and API available

#### Pros

- Open source and self-hosted
- Covered under the existing Grants.gov ATO
- Robust control over access and permissions
- Supports Google Analytics integration
- Supports external contributions through GitHub PRs
- Supports itnernationalization across all pages
- Supports for git syncing and API access
- Full control over data

#### Cons

- *Much* less intuitive than other wiki options
- Documentation for the tool is lacking
- Requires *significant* investment of staff time for initial configuration and ongoing maintenance
- Features are less mature than other SaaS offerings like Confluence or GitBook

## Links <!-- OPTIONAL -->

- [Comms Tooling Milestone](milestone)
- [Confluence](confluence)
  - [Confluence Pricing](confluence-pricing)
  - [Confluence Permissions](confluence-permissions)
  - [Confluence Google Analytics](confluence-ga)
  - [Confluence Public Spaces](confluence-public-spaces)
  - [Confluence Public Pages](confluence-public-pages)
- [Notion](notion)
  - [Notion Pricing](notion-pricing)
  - [Notion Internationalization](notion-i18n)
  - [Notion Pricing](notion-pricing)
  - [Notion Internationalization](notion-i18n)
- [GitHub Wiki](gh-wiki)
- [GitBook](gitbook)
  - [GitBook Pricing](gitbook-pricing)
  - [GitBook Open Source Pricing](gitbook-oss)
  - [GitBook Internationalization](gitbook-i18n)
  - [GitBook Google Analytics](gitbook-ga)

[milestone]: ../milestones/individual_milestones/communication_platforms.md
<!-- Confluence links -->
[confluence]: https://www.atlassian.com/software/confluence
[confluence-pricing]: https://www.atlassian.com/software/confluence/pricing
[confluence-public-spaces]: https://confluence.atlassian.com/doc/make-a-space-public-829076202.html
[confluence-public-pages]: https://support.atlassian.com/confluence-cloud/docs/share-content-externally-with-public-links/
[confluence-ga]: https://marketplace.atlassian.com/apps/1216936/google-analytics-in-confluence?tab=pricing&hosting=cloud
[confluence-permissions]: https://community.atlassian.com/t5/Confluence-questions/Let-users-to-edit-but-restrict-for-publishing-changes-without/qaq-p/945993
<!-- Notion links -->
[notion]: https://www.notion.so
[notion-pricing]: https://www.notion.so/pricing
[notion-i18n]: https://store.crowdin.com/notion
<!-- GitHub Wiki links -->
[gh-wiki]: https://docs.github.com/en/communities/documenting-your-project-with-wikis/about-wikis
<!-- GitBook links -->
[gitbook]: https://www.gitbook.com/
[gitbook-pricing]: https://www.gitbook.com/pricing
[gitbook-oss]: https://docs.gitbook.com/account-management/plans/apply-for-the-non-profit-open-source-plan#criteria-for-open-source-projects
[gitbook-i18n]: https://docs.gitbook.com/publishing/share/collection-publishing
[gitbook-ga]: https://docs.gitbook.com/product-tour/integrations/google-analytics/configure
<!-- Wiki.js links -->
[wiki-js]: https://js.wiki/
