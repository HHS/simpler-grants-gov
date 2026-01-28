---
description: Content Management System (CMS) selection for Simpler.Grants.gov
---

# \[Draft] Content Management System

* **Status:** Active
* **Last Modified:** 2026-01-27
* **Related Issue:** [#6559](https://github.com/HHS/simpler-grants-gov/issues/6559)
* **Deciders:** [Andy Cochran](https://app.gitbook.com/u/lcQCDQDQ89bczhJijH2pkU1TvRD3 "mention"), [Doug Schrashun](https://app.gitbook.com/u/5h0M5no8r0g9AIhCavDL31iuGKJ3 "mention"), [Matt Dragon](https://app.gitbook.com/u/CyuO2uFtgbcij80PZx6GDpee6UP2 "mention")&#x20;
* **Tags:** cms, storyblok, drupal, content&#x20;

## Context and Problem Statement

[Simpler.Grants.gov](http://simpler.grants.gov) needs a content management system to 1) reduce the time it takes for content changes to get into production, 2) enable content creators to self serve, and 3) reduce the dependency on developers to make content changes. Current bottlenecks can delay critical updates by days or weeks and distract frontend developers from focusing on more impactful feature improvements.&#x20;

**Which content management system is best suited for** [**Simpler.Grants.gov**](http://simpler.grants.gov)**?**&#x20;

## Decision Drivers

* Ease of integration into our tech stack (specifically Next.js) and development practices&#x20;
* A robust/configurable "Preview ⇒ Approve ⇒ Publish" workflow that's compatible with our production, lower, and local development environments&#x20;
* Role-Based Access Control (RBAC)
* Cost saving advantages of vendor-hosted vs. self-hosted
  * The pros of vendor-hosted being managed infrastructure, automated updates and patching, and enterprise support; the cons being less control and (mostly) the higher dollar cost
  * The pros of self-hosted being full control over the tech stack, configurability, customization, and how/where the data is securely stored; the cons being developer time for maintenance&#x20;
* Open source _<mark style="color:$info;">(although a secondary concern, this is relevant to the project's principles)</mark>_&#x20;
* FedRAMP certification&#x20;

## Options Considered

Nava explored the current headless CMS SaaS market landscape. Four options stood out as most appropriate for [Simpler.Grants.gov](http://simpler.grants.gov). All provide the functionalities required by Simpler, including custom roles & permissions and configurable publishing workflows.&#x20;

* [**Storyblok**](https://www.storyblok.com/)&#x20;
* [**Decoupled Drupal**](https://www.drupal.org/docs/develop/decoupled-drupal)&#x20;
* [**Directus**](https://directus.io/)
* [**Payload CMS**](https://payloadcms.com/)

_<mark style="color:$info;">(Other options considered, but determined inappropriate after cursory exploration:</mark>_ [_<mark style="color:$info;">Liferay DXP</mark>_](https://www.liferay.com/platform)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Oracle Content Management</mark>_](https://docs.oracle.com/en-us/iaas/content-management/index.html)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Strapi</mark>_](https://strapi.io/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Ghost</mark>_](https://ghost.org/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Headless WordPress</mark>_](https://wordpress.com/blog/2025/03/20/headless-wordpress/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Contentful</mark>_](https://www.contentful.com/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Sanity</mark>_](https://www.sanity.io/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Hygraph</mark>_](https://hygraph.com/)_<mark style="color:$info;">)</mark>_

## Decision Outcome

### Chosen option: **Storyblok** ("Enterprise Elite" plan)&#x20;

Storyblok is the most feature-rich option out-of-the-box, with more advanced features that we're likely to actually use than other options. The Office of Grants is also already very familiar with using Storyblok to manage content.&#x20;

However, Storyblok is only recommended if [Simpler.Grants.gov](http://simpler.grants.gov)'s static site content can be hosted on Storyblok's managed hosting. Storyblok offers the choice of US-based servers, but they are not FedRAMP certified. And the Storyblok support team does not recommend (or want to support) running their product outside of their own cloud servers.&#x20;

### Alternative options:&#x20;

#### **2nd choice: Drupal** (self-hosted)

If FedRAMP certification is a requirement for managed hosting, we would instead recommend self hosting Drupal over Storyblok. Drupal provides full compliance control through AWS GovCloud or similar FedRAMP infrastructure. Being open-source, with a long history of support from an active community, Drupal is likely to remain relevant for beyond the life of this project's current vendors/contracts.&#x20;

A self-hosted Drupal instance is by far the least expensive option. Although it comes with a cost of developer time in maintenance, Nava engineers have a great deal of Drupal experience that can be leveraged to provide a custom-tailored content management system solution for [Simpler.Grants.gov](http://simpler.grants.gov).&#x20;

#### **3rd choice: Drupal** (managed hosting)&#x20;

If FedRAMP certification is a requirement for managed hosting _**and**_ self hosting is not preferred, Acquia provides FedRAMP-certified Drupal hosting. However, this is the most expensive option considered (far more expensive than developer time needed to manage a self-hosted Drupal instance). This service comes at a premium, considering [Simpler.Grants.gov](http://simpler.grants.gov)'s basic needs of a content management system.&#x20;

## Pros and Cons of the Options

### Basic feature comparison

<table data-full-width="false"><thead><tr><th width="225.890625">BASIC FEATURES</th><th align="center">Storyblok</th><th align="center">Drupal</th><th align="center">Directus</th><th align="center">Payload</th></tr></thead><tbody><tr><td>RBAC</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Publishing workflow</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Self-hosted</td><td align="center">❌</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Vendor-hosted</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">❌</td></tr><tr><td>FedRAMP certification</td><td align="center">❌</td><td align="center">✅</td><td align="center">❌</td><td align="center">❌</td></tr><tr><td>Open source</td><td align="center">❌</td><td align="center">✅ </td><td align="center">✅<br><sup>(w/ license)</sup></td><td align="center">✅</td></tr></tbody></table>

### Price comparison (estimates)

<table><thead><tr><th valign="top">Storyblok</th><th valign="top">Drupal (self-hosted)</th><th valign="top">Acquia</th><th valign="top">Directus</th></tr></thead><tbody><tr><td valign="top"><p>$51–75K/year</p><p></p><p>"Enterprise Elite" plan</p><p></p><p><em>* $64K plan recommended, pending usage requirements</em></p></td><td valign="top"><p>$15K–25K/year</p><p></p><p><em>* infrastructure costs only (additional maintenance cost for engineering time)</em> </p></td><td valign="top"><p>$168K–213K/year </p><p></p><p>"FedRAMP Acquia Cloud Plus &#x26; Enterprise Security Package" </p><p></p><p><em>* $92.5k (base) + $75k (VPN/VPC) + $45k (technical account mgmt team)</em></p></td><td valign="top"><p>$35,520/year</p><p></p><p>"Tier 3 Enterprise Cloud" plan (including a 20% open-source/gov discount)</p><p></p><p><em>* lower tier would likely suffice: $19,200/year for Tier 1, and $25,920/year for Tier 2</em> </p></td></tr></tbody></table>

### [**Storyblok**](https://www.storyblok.com/)&#x20;

Storyblok is a great solution for our use case. It's more feature-rich than other options out-of-the-box. The ease of a hosted solution, and the straightforward requirements for supporting content in the application are appealing. Our evaluation spike required very little effort to set up a static page. And the experience for non-developers will be the most intuitive among the options.&#x20;

Their pricing tiers are based on usage:

* Low | 100K API requests, 500 assets, 0.4TB traffic — $51,326/year
* Suggested (by Storyblok support) | 100K API requests, 2,500 assets, 1TB traffic — **$64,152/year**
* High | 1M API requests, 10K assets, 1TB traffic — $74,844/year

All tiers include: 10 user seats, 2 spaces (prod + non-prod), unlimited custom roles/workflows, US server location.&#x20;

* **Pros**
  * Office of Grants is already very familiar with using Storyblok to manage content&#x20;
  * Best "WYSIWYG" visual editor that shows exactly how changes appear before publishing
  * Great separation of code and content, easy to integrate into out stack&#x20;
  * Managed hosting (can choose to host on US-based servers only) keeps us up-to-date with the latest features, w/ zero maintenance burden on internal dev team&#x20;
  * Very responsive support team (plan includes dedicated point of contact / solutions engineer)&#x20;
* **Cons**
  * Not FedRAMP certified&#x20;
  * Not open-source
  * A few fancy features we'd likely not leverage (e.g. AI content generation)&#x20;

_See_ [_**Storyblok CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2286354433/Storyblok+CMS+Evaluation)&#x20;

### [**Self-hosted Drupal**](https://www.drupal.org/docs/develop/decoupled-drupal)&#x20;

{example | description | pointer to more information | ...}

* **Pros**
  * Open-source
  * Large community
* **Cons**
  *

### [Acquia](https://www.acquia.com/)

{example | description | pointer to more information | ...}

* **Pros**
  *
* **Cons**
  *

_See_ [_**Acquia Drupal CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2425456172/Acquia+Drupal+CMS+Evaluation)

### [**Directus**](https://directus.io/)

Directus is a good choice regardless of hosting. It can be self-hosted "for free" (with a paid license).&#x20;

Their most robust Tier 3 Enterprise Cloud plan is $3,200/month for a production environment + $800/month for an additional staging environment + $500/month for each additional sandbox environment. We'd need only production (which can handle the entire content workflow, with drafts and preview available in lower frontend environments) and one sandbox environment (for specific testing and development without affecting prod), which would be $35,520/year, including a 20% open-source/gov discount. However, it's quite possible their lower tiers would suffice — at $19,200/year for Tier 1, and $25,920/year for Tier 2.&#x20;

If we prefer to self host, Directus requires an $1K/month license. With the 20% discount, this would be $9,600/year.&#x20;

Regardless of hosting, additional user licenses are $15/month (10 are included).&#x20;

Directus also provides basic support for $300/month (free with Enterprise Cloud plans) or premium support for an additional $300/month with either hosting option. Basic support will likely suffice for our implementation.&#x20;

**Pros**

* Kind of a middle ground between Drupal and Storyblok in terms of what they offer.&#x20;
* Likely more user friendly than Drupal, while still being an open source offering.&#x20;
* Ideal for developers who want full control over their database and who prefer to adapt the CMS to an existing schema. Intended for projects requiring a high degree of customization and flexibility (or with existing SQL/schemas).
* Since it can be self- or vendor-hosted, it would be a matter of preference.

**Cons**

* Not FedRAMP certified&#x20;
* Tho open-source, requires a licensing fee
* Potentially more difficult to use than other options, and may require more customization

_See_ [_**Draft Directus CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2518515777/Draft+Directus+CMS+Evaluation)&#x20;

### [**Payload CMS**](https://payloadcms.com/)

Payload CMS is a newer, developer-focused content management system built for integrating tightly with Next.js applications. It's gaining rapid traction among Next.js developers. So we did our due diligence to understand its appropriateness for Simpler.&#x20;

TL;DR = Payload is very cool. But we would not leverage its most impressive features.&#x20;

* **Pros**
  * Tightly coupled w/ Next.js
* **Cons**
  * Tightly coupling a non-critical service to a critical one is something we should try to avoid
  * Would require major code refactor&#x20;
  * Self-hosted only (not a managed-hosting option)&#x20;

_See_ [_**Payload CMS Evaluation**_](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2236088328/Payload+CMS+Evaluation)



