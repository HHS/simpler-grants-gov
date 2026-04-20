---
description: Content Management System (CMS) selection for Simpler.Grants.gov
---

# Content management system (CMS)

* **Status:** Active
* **Last Modified:** 2026-04-10
* **Related Issue:** [#6559](https://github.com/HHS/simpler-grants-gov/issues/6559)
* **Deciders:** Julius, Jay (contributors: Doug, Andy, Matt, Yan-Yin)&#x20;
* **Tags:** cms, storyblok, drupal, content&#x20;

## Context and problem statement

The Simpler Grants project requires a Content Management System (CMS) to transition from developer-managed JSON files to a system where non-technical content managers can independently update the platform. A CMS should enable content creators to self-serve, reduce the time and associated cost it takes to get content changes into production, and allow frontend developers to focus on more impactful feature improvements. The chosen solution must facilitate frequent content updates, maintain high security standards, and minimize vendor lock-in while remaining cost-effective.&#x20;

## Decision drivers

1. **Stack integration & performance:** Ease of integration into our tech stack (Next.js/React) and development practices via headless, API-first architecture.&#x20;
2. **Editorial Experience:** A robust/configurable "Preview ⇒ Approve ⇒ Publish" workflow that's compatible with our production, lower, and local development environments.&#x20;
3. **Security & compliance:** Role-Based Access Control (RBAC), FedRAMP compliance, and server location.&#x20;
   1. Note: Since the initial draft ADR, FedRAMP has been identified as a requirement for managed hosting.&#x20;
4. **Operational sustainability & cost efficiency:** Maintenance burden and total cost of ownership, including licensing, hosting, and internal engineering time.&#x20;
   1. The pros of vendor-hosted being managed infrastructure, automated updates and patching, and enterprise support; the cons being less control and (mostly) the higher ongoing costs.&#x20;
   2. The pros of self-hosted being full control over the tech stack, configurability, customization, and how/where the data is securely stored; the cons being developer time for maintenance.&#x20;
5. **Vendor alignment:** Avoiding proprietary lock-in and leveraging robust community support.&#x20;
   1. The project's core principles preference open-source solutions when possible.

## Options considered

Nava explored the current headless CMS SaaS market landscape. Four options stood out as most appropriate. We stood up sandbox demo instances, consulted with vendor support/sales teams, and completed technical spikes to thoroughly evaluate each option. All provide the functionalities required, including custom roles & permissions and configurable publishing workflows.

* [**Decoupled Drupal**](https://www.drupal.org/docs/develop/decoupled-drupal) (both self-hosted and managed hosting via Acquia)&#x20;
* **​**[**Storyblok**](https://www.storyblok.com/) (existing CMS for current Grants.gov)&#x20;
* [**Directus**](https://directus.io/)​
* [**Payload CMS**](https://payloadcms.com/)**​**

_<mark style="color:$info;">Other options considered, but determined less appropriate:</mark>_ [_<mark style="color:$info;">Liferay DXP</mark>_](https://www.liferay.com/platform)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Oracle Content Management</mark>_](https://docs.oracle.com/en-us/iaas/content-management/index.html)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Strapi</mark>_](https://strapi.io/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Ghost</mark>_](https://ghost.org/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Headless WordPress</mark>_](https://wordpress.com/blog/2025/03/20/headless-wordpress/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Contentful</mark>_](https://www.contentful.com/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Sanity</mark>_](https://www.sanity.io/)_<mark style="color:$info;">,</mark>_ [_<mark style="color:$info;">Hygraph</mark>_](https://hygraph.com/)&#x20;

## Decision outcome

### Chosen option: self-hosted [Decoupled Drupal](https://www.drupal.org/docs/develop/decoupled-drupal)

A self-hosted Drupal instance is by far the least expensive option. Nava has a great deal of Drupal experience that can be leveraged to provide a simple, streamlined content management system solution. And being open-source, with a long history of support from an active community, Drupal is likely to remain relevant for beyond the life of this project's current vendors/contracts.

#### Advantages of self-hosting Drupal

1. **Stack:** A "headless" configuration allows Drupal to serve content via API to our Next.js frontend. Flexible architecture for future needs.&#x20;
2. **Experience:** Full control of configurable workflows and how changes are rolled out through environments. Drupal can be set up to:&#x20;
   1. Have any number of states, conditions, or requirements in a custom "Preview ⇒ Approve ⇒ Publish" workflow.
   2. Support phased rollouts of draft content that's visible in lower environments before being published to production.&#x20;
   3. Support zero-downtime deployments (via CI/CD, blue-green deployment strategies, or container orchestration) to keep the CMS live during code and database updates.&#x20;
3. **Security:**&#x20;
   1. Enterprise-grade security and compliance that's trusted across government.&#x20;
   2. Provides full compliance control through AWS GovCloud or similar FedRAMP infrastructure.&#x20;
   3. Rapid patch response from a dedicated security team and public vulnerability disclosure process that ensure swift mitigation of threats.&#x20;
   4. Natively supports federal mandates: Section 508, FISMA, and FedRAMP-compliant implementations are standard practice.&#x20;
   5. Handles millions of visitors per month for high-demand public sites.&#x20;
4. **Sustainability/cost:**&#x20;
   1. Significant cost savings ($0 licensing fees).&#x20;
   2. Marginally increased AWS costs — estimated $300/month&#x20;
5. **Vendor:**&#x20;
   1. Managed by the [Drupal Association](https://www.drupal.org/association), heavily trusted by government entities. Powers over 400 U.S. government websites, including VA, SEC, NASA, FEMA, Department of Energy, NIH, U.S. Courts…&#x20;
   2. Large open-source community.&#x20;
   3. Nava expertise and experience. while reducing vendor lock-in with an open, competitive market of qualified government contractors ensuring flexibility.

#### Risks of self-hosting Drupal

* Long-term, requires internal developer time to configure, maintain, upgrade, patch.&#x20;
* Short-term, its utilitarian UI/UX is not as intuitive or polished as Storyblok out-of-the-box.

## Options considered, not recommended

### [Acquia](https://www.acquia.com/) (managed Drupal hosting)

In addition to the benefits of self-hosted Drupal (listed above),[ Acquia](https://www.acquia.com/) provides enterprise-level managed hosting and support. Acquia is the only trusted provider of managed, FedRAMP-certified Drupal hosting. But their service comes at a premium and is the most expensive option considered. The cost is much greater than developer time needed to manage a self-hosted Drupal instance. Acquia provides features and functionalities we'd likely not leverage, considering the basic needs we have of a CMS.&#x20;

However, it should be noted that Acquia's main offering is hosting. While the service can automate minor patching/upgrades, internal developer time is still required to configure our Drupal setup, maintain our data model, and implement major version upgrades. Acquia's baked-in FedRAMP compliance is appealing. But in the experience of Drupal experts at Nava, Acquia is not demonstrably better than native Drupal functionality that's be easily supported with a low number of engineering hours when self-hosting.

#### Advantages of Acquia&#x20;

1. **Stack:** (Same as self-hosted Drupal)&#x20;
2. **Experience:** (Same as self-hosted Drupal)&#x20;
3. **Security:** FedRAMP-compliant out-of-the-box (+ same as self-hosted Drupal). Servers located in the US.&#x20;
4. **Sustainability/cost:** None.&#x20;
5. **Vendor:** The only trusted managed-hosting provider (+ same as self-hosted Drupal)

#### Risks of Acquia&#x20;

* Long-term, more expensive than developer time needed to manage a self-hosted Drupal instance. Drupal is free and open-source software (FOSS). Acquia is charging a premium for managed hosting that isn't necessarily more secure or compliant than self hosting.&#x20;
* Cost is estimated at **$168K–213K/year**:
  * FedRAMP Acquia Cloud Plus (5M views) and Enterprise Security Package: $92.5k
  * Optional Add ons: $75k Acquia Shield VPN/VPC; $45k Technical Account Management Team
* Provides a level of features and support we are not likely to leverage.&#x20;

See[ Acquia Drupal CMS Evaluation](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2425456172/Acquia+Drupal+CMS+Evaluation)

### [Storyblok](https://www.storyblok.com/)

**Dismissal Reason:** Storyblok’s hosting is not FedRAMP compliant, which is a requirement for managed hosting.

Storyblok is the most feature-rich option out-of-the-box, with more advanced features that we're likely to actually use than other options. The Office of Grants is also already very familiar with using Storyblok to manage content on the existing Grants.gov. Our evaluation spike required very little effort to set up a static page. And the experience for non-developers will be the most intuitive among the options.

However, while Storyblok offers the choice of US-based servers, they are not FedRAMP certified. And the Storyblok support team does not recommend (or want to support) running their product outside of their own cloud servers.

#### Advantages of Storyblok

1. **Stack:** Short-term, we can get Storyblok set up and running quickly. Its API can easily serve content to our Next.js frontend. Long-term, flexible architecture for future needs. Great separation of code and content, easy to integrate into our stack
2. **Experience:** Medium-term, training Office of Grants staff will be simple (already very familiar with using Storyblok to manage content). Best "WYSIWYG" visual editor that shows exactly how changes appear before publishing. Full control of configurable workflows and how changes are rolled out through environments.&#x20;
3. **Security:** Managed hosting (can choose to host on US-based servers only) keeps us up-to-date with the latest features, w/ zero maintenance burden on the internal dev team.&#x20;
4. **Sustainability/cost:** Long-term, low maintenance burden directs more engineering resources to product development. Their pricing tiers are based on usage:
   1. Low | 100K API requests, 500 assets, 0.4TB traffic — $51,326/year
   2. Suggested (by Storyblok support) | 100K API requests, 2,500 assets, 1TB traffic — **$64,152/year**
   3. High | 1M API requests, 10K assets, 1TB traffic — $74,844/year
   4. All tiers include: 10 user seats, 2 spaces (prod + non-prod), unlimited custom roles/workflows, US server location.
5. **Vendor:** Industry-standard, trusted service. Very responsive support team (plan includes dedicated point of contact / solutions engineer)

#### Risks of Storyblok

* Long-term, a non-FedRAMP solution might affect Simpler Grants' own FedRAMP Certification efforts if sought in the future
* Short-term, increased timelines required for security review, approval, and procurement of a non-FedRAMP solution may be infeasible or impossible
* Not open-source. Vendor lock-in.&#x20;
* Includes fancy features we'd likely not leverage (e.g. AI content generation)

See[ Storyblok CMS Evaluation](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2286354433/Storyblok+CMS+Evaluation)

### [Directus](https://directus.io/)​

Directus is kind of a middle ground between Drupal and Storyblok in terms of what they offer. It's more user friendly than Drupal, while still being an open source offering.&#x20;

Being open-source, Directus can be self-hosted "for free" with a $1K/month license. With the 20% discount, this would be $9,600/year. Additional user licenses are $15/month (10 are included).&#x20;

They also provide basic support for $300/month — which would likely suffice for our implementation — or premium support for an additional $300/month.

#### Advantages

1. **Stack:** Ideal for developers who want full control over their database and who prefer to adapt the CMS to an existing schema. Intended for projects requiring a high degree of customization and flexibility (or with existing SQL/schemas).
2. **Experience:** More user-friendly than Drupal. Full control of configurable workflows and how changes are rolled out through environments.&#x20;
3. **Security:** Can be self-hosted.&#x20;
4. **Sustainability/cost:** Free to self-host with low-cost licensing & support.&#x20;
5. **Vendor:** Industry-standard, trusted service. Responsive support team.&#x20;

#### Risks

* Managed hosting is not FedRAMP certified.&#x20;
* Although the code is open-source, it is unclear how the required licensing fee might affect cost and usage long-term.&#x20;
* Potentially more difficult to integrate/use than other options, and may require more customization.&#x20;

See[ Draft Directus CMS Evaluation](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2518515777/Draft+Directus+CMS+Evaluation)

### [Payload CMS](https://payloadcms.com/)​

Payload CMS is a newer, developer-focused content management system built for integrating tightly with Next.js applications. It's gaining rapid traction among Next.js developers. So we did our due diligence to understand its appropriateness for Simpler. In summary, Payload is very cool, but we'd not leverage its most impressive features.

#### Advantages of Payload

1. **Stack:** Tightly coupled w/ [Next.js](http://next.js)
2. **Experience:** Full control of configurable workflows and how changes are rolled out through environments.&#x20;
3. **Security:**&#x20;
   1. Self-hosted, can sit alongside the frontend app.&#x20;
   2. Marginally increased AWS costs — estimated $300/month&#x20;
4. **Sustainability/cost:** No licensing fees.&#x20;
5. **Vendor:** Industry-standard service. 100% free and open-source.&#x20;

#### Risks of Payload

* Tightly coupling a non-critical service to a critical one is something we should try to avoid.&#x20;
* Would require a major code refactor.&#x20;

See[ Payload CMS Evaluation](https://navasage.atlassian.net/wiki/spaces/Grantsgov/pages/2236088328/Payload+CMS+Evaluation)

## Comparative assessment

<table data-header-hidden="false" data-header-sticky data-full-width="true"><thead><tr><th width="314.1953125">BASIC FEATURES</th><th align="center">Drupal (self-hosted)</th><th align="center">Drupal (Acquia)</th><th align="center">Storyblok</th><th align="center">Directus</th><th align="center">Payload</th></tr></thead><tbody><tr><td><strong>Stack integration &#x26; performance</strong></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td></tr><tr><td>Headless integration w/ Next.js</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center"><p>✅</p><p><sup>(can also be run natively)</sup></p></td></tr><tr><td>Integration w/ existing dev practices</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">⚠️<br><sup>(requires major refactor)</sup></td></tr><tr><td><strong>Editorial Experience</strong></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td></tr><tr><td>RBAC</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Publishing workflow</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td><strong>Security &#x26; compliance</strong></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td></tr><tr><td>Hosting method</td><td align="center">Self</td><td align="center">Managed</td><td align="center">Managed</td><td align="center">Either</td><td align="center">Either</td></tr><tr><td>Supports federal mandates (e.g. FedRAMP-compliant) </td><td align="center"><p>✅</p><p><sup>(native support)</sup></p></td><td align="center"><p>✅</p><p><sup>(out-of-the-box)</sup></p></td><td align="center"><p>❌</p><p><sup>(infeasible)</sup></p></td><td align="center"><p>⚠️</p><p><sup>(possible if self-hosted)</sup></p></td><td align="center"><p>⚠️</p><p><sup>(possible if self-hosted)</sup></p></td></tr><tr><td>Server location</td><td align="center">Simpler's AWS</td><td align="center">US-based</td><td align="center">US-based option</td><td align="center">Simpler's AWS</td><td align="center">Simpler's AWS</td></tr><tr><td><strong>Operational sustainability &#x26; cost efficiency</strong></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td></tr><tr><td>Approximate yearly cost</td><td align="center">$3,600</td><td align="center">$168K–213K</td><td align="center">$51–75K</td><td align="center">$9,600</td><td align="center">$3,600</td></tr><tr><td><strong>Vendor alignment</strong></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td><td align="center"><br></td></tr><tr><td>Open source</td><td align="center">✅</td><td align="center">✅</td><td align="center">❌</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Avoids lock-in</td><td align="center">✅</td><td align="center">✅</td><td align="center">❌</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Industry standard </td><td align="center">High level of trust within gov</td><td align="center">High level of trust within gov</td><td align="center">Mostly used in private-sector </td><td align="center">Mostly used in private-sector </td><td align="center">Mostly used in private-sector </td></tr><tr><td>Owner </td><td align="center"><a href="https://www.drupal.org/association">Drupal Association</a></td><td align="center"><a href="https://www.acquia.com/about-us/vista-equity-partners-acquia">Vista Equity Partners</a></td><td align="center"><a href="https://www.greathillpartners.com/media/storyblocks-announces-acquisition-by-great-hill-partners">Great Hill Partners</a></td><td align="center"><a href="https://directus.io/about">Ben Haynes (Founder,  CEO) operating Series A company</a></td><td align="center"><a href="https://www.figma.com/">Figma</a></td></tr></tbody></table>

<br>
