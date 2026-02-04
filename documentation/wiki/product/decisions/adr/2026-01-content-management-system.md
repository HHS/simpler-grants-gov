---
description: Content Management System (CMS) selection for Simpler.Grants.gov
---

# \[Draft] Content Management System

* **Status:** Active
* **Last Modified:** 2026-01-30
* **Related Issue:** [#6559](https://github.com/HHS/simpler-grants-gov/issues/6559)
* **Deciders:** Julius, Jay (contributors: Doug, Andy, Matt, Yan-Yin)&#x20;
* **Tags:** cms, storyblok, drupal, content&#x20;

## Context and Problem Statement

Simpler.Grants.gov needs a content management system to 1) reduce the time and associated cost it takes to get content changes into production, 2) enable content creators to self serve, and 3) reduce the dependency on developers to make content changes. Current bottlenecks can delay critical updates by days or weeks and distract frontend developers from focusing on more impactful feature improvements.&#x20;

**Which content management system is best suited for Simpler.Grants.gov?**&#x20;

## Decision Drivers

* Ease of integration into our tech stack (specifically Next.js) and development practices&#x20;
* A robust/configurable "Preview ⇒ Approve ⇒ Publish" workflow that's compatible with our production, lower, and local development environments&#x20;
* Role-Based Access Control (RBAC)
* Cost saving advantages of vendor-hosted vs. self-hosted
  * The pros of vendor-hosted being managed infrastructure, automated updates and patching, enterprise support, and reduced security review for procurement; the cons being less control and (mostly) the higher ongoing dollar cost
  * The pros of self-hosted being full control over the tech stack, configurability, customization, and how/where the data is securely stored; the cons being developer time for maintenance and additional upfront security review required for procurement&#x20;
* Open source _<mark style="color:$info;">(although a secondary concern, this is relevant to the project's principles)</mark>_&#x20;
* FedRAMP certification&#x20;

## Options Considered

Nava explored the current headless CMS SaaS market landscape. Four options stood out as most appropriate for Simpler.Grants.gov. We stood up sandbox demo instances, consulted with vendor support/sales teams, and completed technical spikes (implementing a static page in each technology) to thoroughly evaluate each option. All provide the functionalities required by Simpler, including custom roles & permissions and configurable publishing workflows.

* [**Storyblok**](https://www.storyblok.com/)&#x20;
* [**Decoupled Drupal**](https://www.drupal.org/docs/develop/decoupled-drupal)&#x20;
* [**Directus**](https://directus.io/)
* [**Payload CMS**](https://payloadcms.com/)

_<mark style="color:$info;">(Other options considered, but determined less appropriate:</mark>_ [_<mark style="color:$info;">Liferay DXP</mark>_](https://www.liferay.com/platform)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Oracle Content Management</mark>_](https://docs.oracle.com/en-us/iaas/content-management/index.html)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Strapi</mark>_](https://strapi.io/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Ghost</mark>_](https://ghost.org/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Headless WordPress</mark>_](https://wordpress.com/blog/2025/03/20/headless-wordpress/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Contentful</mark>_](https://www.contentful.com/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Sanity</mark>_](https://www.sanity.io/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Hygraph</mark>_](https://hygraph.com/)_<mark style="color:$info;">)</mark>_

## Decision Outcome

### Chosen option: **Storyblok** ("Enterprise Elite" plan)&#x20;

Storyblok is the most feature-rich option out-of-the-box, with more advanced features that we're likely to actually use than other options. The Office of Grants is also already very familiar with using Storyblok to manage content on the existing Grants.gov.&#x20;

However, Storyblok is only recommended if Simpler.Grants.gov's static site content can be hosted on Storyblok's managed hosting. Storyblok offers the choice of US-based servers, but they are not FedRAMP certified. And the Storyblok support team does not recommend (or want to support) running their product outside of their own cloud servers.&#x20;

#### Advantages:&#x20;

* Short-term, we can get Storyblok set up and running quickly
* Medium-term, training OG staff will be simple (already trained on existing instance)&#x20;
* Long-term, low maintenance burden directs more engineering resources to product development&#x20;

#### Risks:&#x20;

* Short-term, procurement timelines for a non-FedRAMP solution may be infeasible or impossible
* Long-term, a non-FedRAMP solution might affect Simpler Grants' own FedRAMP Certification efforts if ever sought in the future

### Alternative options:&#x20;

#### **2nd choice: Drupal** (self-hosted)

If Storyblok cannot be chosen because managed hosting requires FedRAMP certification, we would instead recommend self hosting Drupal.&#x20;

Drupal provides full compliance control through AWS GovCloud or similar FedRAMP infrastructure. Being open-source, with a long history of support from an active community, Drupal is likely to remain relevant for beyond the life of this project's current vendors/contracts.&#x20;

A self-hosted Drupal instance is by far the least expensive option. Although it comes with a cost of developer time in maintenance, Nava engineers have a great deal of Drupal experience that can be leveraged to provide a simple, streamlined content management system solution.&#x20;

#### **3rd choice: Drupal** (managed hosting)&#x20;

If managed hosting is preferred _**and**_ FedRAMP certification is a requirement, [Acquia](https://www.acquia.com/) is _**the**_ trusted provider of managed, FedRAMP-certified Drupal hosting. However, this is the most expensive option considered. It's far more expensive than developer time needed to manage a self-hosted Drupal instance. The service comes at a premium, and provides features and functionalities we'd likely not leverage, considering the basic needs Simpler.Grants.gov has of a content management system.&#x20;

## Feature & price comparisons

<table data-full-width="false"><thead><tr><th width="225.890625">BASIC FEATURES</th><th align="center">Storyblok</th><th align="center">Drupal</th><th align="center">Directus</th><th align="center">Payload</th></tr></thead><tbody><tr><td>RBAC</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Publishing workflow</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Self-hosted</td><td align="center">❌</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Vendor-hosted</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">❌</td></tr><tr><td>FedRAMP certification</td><td align="center">❌</td><td align="center">✅</td><td align="center">❌</td><td align="center">❌</td></tr><tr><td>Open source</td><td align="center">❌</td><td align="center">✅ </td><td align="center">✅<br><sup>(w/ license)</sup></td><td align="center">✅</td></tr></tbody></table>

Estimates, based on conversations with each product's support/sales team:

<table><thead><tr><th valign="top">Storyblok</th><th valign="top">Drupal (self-hosted)</th><th valign="top">Acquia</th><th valign="top">Directus</th></tr></thead><tbody><tr><td valign="top"><p><strong>$51–75K</strong>/year</p><p></p><p>"Enterprise Elite" plan</p><p></p><p><em>* $64K plan recommended, pending usage requirements</em></p></td><td valign="top"><p><strong>$15K–25K</strong>/year</p><p></p><p><em>* infrastructure costs only (additional maintenance cost for engineering time)</em> </p></td><td valign="top"><p><strong>$168K–213K</strong>/year </p><p></p><p>"FedRAMP Acquia Cloud Plus &#x26; Enterprise Security Package" </p><p></p><p><em>* $92.5k (base) + $75k (VPN/VPC) + $45k (technical account mgmt team)</em></p></td><td valign="top"><p><strong>$35,520</strong>/year</p><p></p><p>"Tier 3 Enterprise Cloud" plan (including a 20% open-source/gov discount)</p><p></p><p><em>* lower tier would likely suffice: $19,200/year for Tier 1, and $25,920/year for Tier 2</em> </p></td></tr></tbody></table>

## Advantages & risks of the options

### [**Storyblok**](https://www.storyblok.com/)&#x20;

Storyblok is a great solution for our use case. It's more feature-rich than other options out-of-the-box. The ease of a hosted solution, and the straightforward requirements for supporting content in the application are appealing. Our evaluation spike required very little effort to set up a static page. And the experience for non-developers will be the most intuitive among the options.&#x20;

Their pricing tiers are based on usage:

* Low | 100K API requests, 500 assets, 0.4TB traffic — $51,326/year
* Suggested (by Storyblok support) | 100K API requests, 2,500 assets, 1TB traffic — **$64,152/year**
* High | 1M API requests, 10K assets, 1TB traffic — $74,844/year

All tiers include: 10 user seats, 2 spaces (prod + non-prod), unlimited custom roles/workflows, US server location.&#x20;

* **Advantages**
  * Office of Grants is already very familiar with using Storyblok to manage content&#x20;
  * Best "WYSIWYG" visual editor that shows exactly how changes appear before publishing
  * Great separation of code and content, easy to integrate into out stack&#x20;
  * Managed hosting (can choose to host on US-based servers only) keeps us up-to-date with the latest features, w/ zero maintenance burden on internal dev team&#x20;
  * Very responsive support team (plan includes dedicated point of contact / solutions engineer)&#x20;
* **Risks**
  * May prevent long-term FedRAMP certification for Simpler.Grants.gov&#x20;
  * Not open-source
  * Includes fancy features we'd likely not leverage (e.g. AI content generation)&#x20;

_See_ [_**Storyblok CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2286354433/Storyblok+CMS+Evaluation)&#x20;

### [**Self-hosted Drupal**](https://www.drupal.org/docs/develop/decoupled-drupal)&#x20;

Drupal stands out as a battle-tested, enterprise-grade content management system for federal agencies modernizing digital services. With more than two decades of active development and a mature government user base, it is an open-source, secure, and scalable solution that lowers total cost of ownership without compromising on capabilities.&#x20;

* **Advantages**
  * Open source (with a large community)&#x20;
  * Significant cost savings ($0 licensing fees)&#x20;
  * Nava expertise and experience (while reducing vendor lock-in with an open, competitive market of qualified government contractors ensuring flexibility)
  * Enterprise-grade security and compliance that's trusted across government (Drupal powers over 400 U.S. government websites, including VA, SEC, NASA, FEMA, Department of Energy, NIH, U.S. Courts…)
  * Rapid patch response from a dedicated security team and public vulnerability disclosure process that ensure swift mitigation of threats&#x20;
  * Natively supports federal mandates: Section 508, FISMA, and FedRAMP-compliant implementations are standard practice&#x20;
  * Handles millions of visitors per month for high-demand public sites&#x20;
  * Flexible architecture for future needs&#x20;
* **Risks**
  * Requires internal developer time to configure, maintain, upgrade, patch
  * Marginally increased AWS costs (esitimated $300/month)&#x20;
  * Its generic, utilitarian UI/UX is not as intuitive or polished as Storyblok

### [Acquia](https://www.acquia.com/)

In addition to the benefits of self-hosted Drupal (listed above), [Acquia](https://www.acquia.com/) provides enterprise-level managed hosting and support. It's the clear (only?) choice for FedRAMP-certified, managed Drupal hosting.&#x20;

Cost is estimated at $168K–213K/year:&#x20;

* FedRAMP Acquia Cloud Plus (5M views) and Enterprise Security Package: $92.5k
* Optional Add ons:&#x20;
  * $75k Acquia Shield VPN/VPC
  * $45k Technical Account Management Team

(depends on secutity and support needs)&#x20;

* **Advantages**
  * Managed hosting = less internal developer time maintaining, upgrading, patching
* **Risks**
  * More expensive than developer time needed to manage a self-hosted Drupal instance
  * Provides level of support we'd likely not leverage&#x20;

_See_ [_**Acquia Drupal CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2425456172/Acquia+Drupal+CMS+Evaluation)

### [**Directus**](https://directus.io/)

Directus is a good choice regardless of hosting. It can be self-hosted "for free" (with a paid license).&#x20;

Their most robust Tier 3 Enterprise Cloud plan is $3,200/month for a production environment + $800/month for an additional staging environment + $500/month for each additional sandbox environment. We'd need only production (which can handle the entire content workflow, with drafts and preview available in lower frontend environments) and one sandbox environment (for specific testing and development without affecting prod), which would be $35,520/year, including a 20% open-source/gov discount. However, it's quite possible their lower tiers would suffice — at $19,200/year for Tier 1, and $25,920/year for Tier 2.&#x20;

If we prefer to self host, Directus requires an $1K/month license. With the 20% discount, this would be $9,600/year.&#x20;

Regardless of hosting, additional user licenses are $15/month (10 are included).&#x20;

Directus also provides basic support for $300/month (free with Enterprise Cloud plans) or premium support for an additional $300/month with either hosting option. Basic support will likely suffice for our implementation.&#x20;

**Advantages**

* Kind of a middle ground between Drupal and Storyblok in terms of what they offer.&#x20;
* Likely more user friendly than Drupal, while still being an open source offering.&#x20;
* Ideal for developers who want full control over their database and who prefer to adapt the CMS to an existing schema. Intended for projects requiring a high degree of customization and flexibility (or with existing SQL/schemas).
* Since it can be self- or vendor-hosted, it would be a matter of preference.

**Risks**

* Not FedRAMP certified&#x20;
* Although the code is open-source, it is unclear how the required licensing fee might affect cost and usage long-term&#x20;
* Potentially more difficult to use than other options, and may require more customization

_See_ [_**Draft Directus CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2518515777/Draft+Directus+CMS+Evaluation)&#x20;

### [**Payload CMS**](https://payloadcms.com/)

Payload CMS is a newer, developer-focused content management system built for integrating tightly with Next.js applications. It's gaining rapid traction among Next.js developers. So we did our due diligence to understand its appropriateness for Simpler. In summary, Payload is very cool, but we'd not leverage its most impressive features.&#x20;

* **Advantages**
  * Tightly coupled w/ Next.js
* **Risks**
  * Tightly coupling a non-critical service to a critical one is something we should try to avoid
  * Would require major code refactor&#x20;
  * Self-hosted only (not a managed-hosting option)&#x20;

_See_ [_**Payload CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2236088328/Payload+CMS+Evaluation)





