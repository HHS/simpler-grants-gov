# Communications Tooling: Wiki Platform

- **Status:** Draft
- **Last Modified:** 2023-06-15 <!-- REQUIRED -->
- **Related Issue:** [#{issue number}](https://github.com/HHS/grants-api/issues) <!-- RECOMMENDED -->
- **Deciders:** {list everyone involved in the decision} <!-- OPTIONAL -->
- **Tags:** {space and/or comma separated list of tags} <!-- OPTIONAL -->

## Context and Problem Statement

The [communications platform milestone](milestone) identifies a series of platforms through which the Grants API project needs to engage both internal and external stakeholders. One of these platforms is a wiki for storing notes, documents, and other content about the project. Ideally we would select a platform that balances ease of use and flexibility with the cost of implementing and maintaining the wiki.

The goal of this ADR is to evaluate a series of potential wiki platforms and determine which one best fits the needs and objectives of this project based on the decision criteria outlined below.

## Decision Drivers <!-- RECOMMENDED -->

#### Must Have

- **Usability:** Non-technical users should be able to access and create content with minimal training or guidance.
- **Public Access:** Members of the public should be able to read public documentation in the wiki without needing to sign up or login to a service.
- **Content Review:** Collaborators should be able to review and edit draft content before those changes are published.
- **Version History:** Editors should be able to see and restore previous versions of a given page.
- **Multi-Media:** The platform should support multiple types of media (e.g. videos, images, file uploads, tables, diagrams) with minimal configuration.
- **Internationalization (i18n):** The platform should provide support for displaying content in multiple languages.
- **Web Analytics:** The platform should provide support for tracking site usage and other web analytics.
- **Onboarding Costs:** Onboarding new members to the platform should be relatively inexpensive, both in terms of staff time/resources and direct costs (e.g. licensing fees).
- **Maintenance Costs:** It should not be prohibitively expensive to maintain the wiki, both in terms of staff time/resources and direct costs (e.g. hosting fees).
- **Authority to Operate (ATO):** The platform already must be authorized under the Grants.gov ATO (Authority to Operate) or ATO coverage must be requested.

#### Nice to Have

- **External Contributions:** Members of the public should be able to suggest changes to wiki content and internal stakeholders should be able to review those contributions before they are published.
- **Data Access:** Content generated and stored in the wiki should be accessible outside of the wiki platform, either through syncing content to an HHS owned repository or through an official API.
- **Machine Readability:** The wiki platform should also support storing and exposing content in a machine-readable format so that certain types structured data can be managed within and accessed from the wiki without parsing.
- **Open Source:** The tool used to manage and host the wiki content should be open source, if possible.

## Options Considered

- [Confluence](confluence)
- [Notion](notion)
- [GitHub Wiki](gh-wiki)
- [GitBook](gitbook)
- [WikiJS](wiki-js)
- Git-based Headless CMS (e.g. [Decap CMS](git-cms-decap) and [Tina.io](git-cms-tina))
- API-based Headless CMS (e.g. [Strapi](strapi) and [Directus](directus))

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets k.o. criterion decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### Confluence

[Confluence](confluence) is a Software as a Service (SaaS) documentation and collaboration tool offered by Atlassian that organizes content into "spaces" and offers a series of templates and components that can be used to create custom documentation for internal and external stakeholders.

#### Details

- **Hosting:** SaaS
- **Pricing:** [$5.75 (standard) or $11 (premium) per user per month](confluence-pricing)
- **Public Access:** Supported, but limited to individual pages or entire spaces
- **Content Review:** Supported through drafts, not enforceable
- **Supported Media:** TODO
- **I18n:** Limited third party plugins for automating translation
- **Web Analytics:** [Google Analytics plugin](confluence-ga) available, also native analytics with premium tier
- **Open Source Status:** Propietary
- **External Contributions:** Only supported in public spaces (without review)

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
- **Public Access:** Supported, but oriented around individual pages
- **Content Review:** Not supported
- **Supported Media:** TODO
- **I18n:** Third-party beta plugin for translation
- **Web Analytics:** TODO
- **Open Source Status:** Propietary
- **External Contributions:** Supported in app (without review)

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
- **Content Review:** TODO
- **Supported Media:** TODO
- **I18n:** TODO
- **Web Analytics:** TODO
- **Open Source Status:** Propietary
- **Data Access:** TODO

#### Pros

- TODO

#### Cons

- TODO

### GitBook

[GitBook](gitbook) is a Software as a Service (SaaS) platform for creating and managing public documentation for a project. GitBook prioritizes version control and collaboration by offering first class support for reviewing and merging content changes. It has become a common documentation and wiki tool for many open source projects.

#### Details

- **Hosting:** SaaS
- **Pricing:** [Free (open source projects)](gitbook-oss) or [$6.70 (plus) per user per month](gitbook-pricing)
- **Public Access:** Supported by default
- **Content Review:** Supported by default
- **Supported Media:** TODO
- **I18n:** Native support with [page collections and variants](gitbook-i18n)
- **Web Analytics:** [Google Analytics integration](gitbook-ga) available
- **Open Source Status:** Propietary
- **Data Access:** TODO

#### Pros

- Relatively friendly for non-technical users
- Most robust content review process across all wikis, enforceable on a page-by-page basis
- Public spaces and pages are well organized and searchable
- Supports a wide variety of media and content types
- Supports Google Analytics integration as well as limited native analytics
- Supports external contributions through GitHub PRs
- Supports beginning of type page history and version comparison
- Provides native support for itnernationalization across all pages
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

## Comparison Matrix

✅ Feature available, meets requirement
❌ Feature not available, does not meet requirement
🔄 Partial feature, limited feature availability, feature in progress or undergoing improvements
1-3 Strength level
❓Unknown

| Factor                      | Confluence | Notion | GitHub Wiki | GitBook | Wiki.js |
| --------------------------- | :--------: | :----: | :---------: | :-----: | :-----: |
| Usability                   |     3      |   2    |      1      |    2    |    1    |
| Public Access               |    🔄     |  🔄   |     ✅      |   ✅    |   ✅    |
| Content Review              |    🔄     |   ❌   |     ❌      |   ✅    |   🔄   |
| Version History             |     ✅     |  🔄   |     ✅      |   ✅    |   🔄   |
| Multi-Media                 |     ✅     |   ✅   |     ❌      |   ✅    |   ✅    |
| I18n                        |    🔄     |  🔄   |     ❌      |   ✅    |   ✅    |
| Web Analytics               |     ✅     |   ✅   |     ❌      |   ✅    |   🔄   |
| Onboarding Cost Efficiency  |     2      |   2    |      3      |    2    |    2    |
| Maintenance Cost Efficiency |     2      |   2    |      3      |    2    |    1    |
| Authority to Operate        |     ✅     |   ❌   |     ✅      |   ❌    |   ✅    |
| External Contributions      |     ✅     |   ✅   |     🔄     |   🔄   |   ✅    |
| Data Access                 |    🔄     |  🔄   |     ✅      |   ✅    |   ✅    |
| Machine Readability         |    🔄     |   ✅   |     ❌      |   🔄   |   ✅    |
| Open Source                 |     ❌     |   ❌   |     ❌      |   ❌    |   ✅    |

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
- [Decap CMS](git-cms-decap)
- [Tina CMS](git-cms-tina)
- [Next Internatioanlization](next-i18n)
- [Strapi](strapi)
  - [Strapi Cloud Pricing](strapi-pricing-cloud)
  - [Strapi Self Hosted Pricing](strapi-pricing-self)
- [Directus](directus)
  - [Directus Cloud Pricing](directus-pricing-cloud)

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
<!-- Git-based CMS links -->
[git-cms-decap]: https://decapcms.org/
[git-cms-tina]: https://tina.io/
[next-i18n]: https://nextjs.org/docs/pages/building-your-application/routing/internationalization
<!-- API-based CMS links -->
[strapi]: https://strapi.io
[strapi-pricing-cloud]: https://strapi.io/pricing-cloud
[strapi-pricing-self]: https://strapi.io/pricing-self-hosted
[directus]: https://directus.io
[directus-pricing-cloud]: https://directus.io/pricing/cloud/
