# Communications Tooling: Wiki Platform

- **Status:** Proposed
- **Last Modified:** 2023-06-07 <!-- REQUIRED -->
- **Related Issue:** [#{issue number}](https://github.com/HHS/grants-api/issues) <!-- RECOMMENDED -->
- **Deciders:** {list everyone involved in the decision} <!-- OPTIONAL -->
- **Tags:** {space and/or comma separated list of tags} <!-- OPTIONAL -->

## Context and Problem Statement

The [communications platform milestone](milestone) identifies a series of platforms through which the Grants API project needs to engage

## Decision Drivers <!-- RECOMMENDED -->

- **Accessibility & Usability:** The platform needs to be accessible to both technical and non-technical audiences with minimal training and guidance.
- **Role & Content Management:** The platform should support varying levels of access for reading, writing, and modifying content. Ideally external stakeholders would have some mechanism for contributing to the documentation as well, pending review from project owners.
- **Integration:** The platform should be relatively integrated with other resources associated with the project, such as code repos and documentation.
- **Feature Support:** It should also support the following key features:
  - Internationalization -- Support for displaying content in multiple languages
  - Web Analytics -- Support for tracking site usage and other web analytics
- **Implementation & Maintainability:** The platform should not be prohibitively expensive to implement, maintain, or scale both in terms of direct costs (i.e. licenses, hosting, etc.) and in terms of person hours.

## Options Considered

- Confluence
- Notion
- GitHub Wiki
- GitBook
- Git-based Headless CMS
- API-based Headless CMS

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

- **Hosting:** SaaS
- **Pricing:** [$5.75 (standard) or $11 (premium) per user per month](confluence-pricing)
- **Features**
  - **I18n:** Limited third party plugins for automating translation
  - **Analytics:** [Google Analytics plugin](confluence-ga) available, also native analytics with premium tier

[Confluence](confluence) is a Software as a Service (SaaS) documentation and collaboration tool offered by Atlassian that organizes content into "spaces" and offers a series of templates and components that can be used to create custom documentation for internal and external stakeholders.

- **Pro**
  - **Accessibility & Usability:** Confluence is an industry standard tool that many technical teams are used to using for project documentation and wikis
  - **Feature Support:** Confluence offers their own (limited) page analytics and supports a [Google Analytics plugin](confluence-ga) as well, though the plugin has its own user-based volume pricing. Atlassian marketplace also offers plugins for several other valuable features such as diagrams, language translation, etc.
  - **Implementation & Maintainability:** As a SaaS offering, Confluence manages the hosting and storage of all documentation and assets, which minimizes the amount of time that team has to invest in implementing and maintaining a Confluence wiki
- **Cons**
  - **Accessibility & Usability:** While confluence does provide support for [public pages and spaces](confluence-public-spaces), the tool tends to be designed for internal documentation and collaboration
  - **Role Management:** It can be difficult to review contributions from users before those changes are published, and in most cases [users with permission to edit pages also have permission to publish](confluence-permissions) those changes without review
  - **Integrations:** Because Confluence pages are managed and hosted by Confluence, they cannot be integrated directly with the rest of the project codebase. Accessing Confluence as a named user would also require a separate login.

### Notion

- **Hosting:** SaaS
- **Pricing:** [$8 per user per month](notion-pricing)
- **Features**
  - **I18n:** Third-party beta plugin for translation
  - **Analytics:** Google Analytics plugin available, also native analytics with premium tier

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### GitHub Wiki

- **Hosting:** SaaS
- **Pricing:** Free for public repositories
- **Features**
  - **I18n:** Plugins available from Atlassian Marketplace
  - **Analytics:** Google Analytics plugin available, also native analytics with premium tier

[GitHub Wiki](gh-wiki) is a free feature for public repositories that allows maintainers of the repository to host documents and other content that isn't stored directly within the repository itself.

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### GitBook

- **Hosting:** SaaS
- **Pricing** [Free (open source projects)](gitbook-oss) or [$6.70 (plus) per user per month](gitbook-pricing)
- **Features**
  - **I18n:** Native support with [page collections and variants](gitbook-i18n)
  - **Analytics:** [Google Analytics integration](gitbook-ga) available

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Git-based Headless CMS

- **Hosting:** Self-hosted
- **Pricing** Free open source options (e.g. [Decap CMS](git-cms-decap))
- **Features**
  - **I18n:** Depends on static site generator (e.g. [Next.js i18n routing](next-i18n))
  - **Analytics:** Google analytics must be manually added to the resulting website

A "headless" CMS separates the creation and management of web content from the format in which it's displayed for external users. This is in contrast to traditional content management systems like Drupal or WordPress. Some headless CMS tools (e.g. [Decap CMS](git-cms-decap) and [Tina.io](git-cms-tina)) use a git-based version control system like GitHub as the backend for storing content generated within the CMS. This file-based content is then rendered as a static site with a Static Site Generator (SSG) like Next.js or Gatsby

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### API-based Headless CMS

- **Hosting:** Self-hosted or SaaS
- **Pricing** Free for self-hosted ([Strapi](strapi-pricing-self)) or $99/mo for SaaS ([Strapi](strapi-pricing-cloud) and [Directus](directus-pricing-cloud))
- **Features**
  - **I18n:** Depends on static site generator (e.g. [Next.js i18n routing](next-i18n))
  - **Analytics:** Google Analytics must be manually added to the resulting website

A "headless" CMS separates the creation and management of web content from the format in which it's displayed for external users. This is in contrast to traditional content management systems like Drupal or WordPress. Some headless CMS tools (e.g. [Strapi](strapi) and [Directus](directus)) use a database as the backend for storing content generated within the CMS and expose this content via an API so that it can be rendered as a static site with a Static Site Generator (SSG) like Next.js or Gatsby.

- **Pro**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

## Links <!-- OPTIONAL -->

- [{Link type}](link to adr) <!-- example: Refined by [xxx](yyyymmdd-xxx.md) -->
- ...

[milestone]: ../milestones/individual_milestones/communication_platforms.md
<!-- Confluence links -->
[confluence]: https://www.atlassian.com/software/confluence
[confluence-pricing]: https://www.atlassian.com/software/confluence/pricing
[confluence-public-spaces]: https://confluence.atlassian.com/doc/make-a-space-public-829076202.html
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
