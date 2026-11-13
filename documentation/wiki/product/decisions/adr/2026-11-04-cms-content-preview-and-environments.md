---
description: Where CMS content is previewed and how it moves between Simpler.Grants.gov environments
---

# CMS content preview and environments

- **Status:** Active
- **Last Modified:** 2026-11-04
- **Related Issue:** [#12325](https://github.com/HHS/simpler-grants-gov/issues/12325)
- **Deciders:** Julius Chang (HHS) (contributors: Margaret Spring, Matt Dragon, Marques Webster)
- **Tags:** cms, drupal, preview, publishing, environments

## Context and problem statement

The [CMS ADR](2026-01-content-management-system.md) calls for a "Preview ⇒ Approve ⇒ Publish" workflow. Before content goes live, content managers and reviewers need to see it the way the public will: on the Simpler.Grants.gov frontend, with the real design and layout. Drupal is headless, so its built-in preview shows only the raw content, not the finished page.

Simpler.Grants.gov has four frontend environments: dev, staging, training, and prod. Earlier planning assumed a new, access-restricted preview frontend running alongside production. That would be one more service to build, secure, and maintain.

We need to decide:

1. Where content managers preview draft content.
2. Where content is authored, and how it reaches each environment.

There is also a new requirement. After reviewing the program, the Government Accountability Office (GAO) recommended that Simpler.Grants.gov content pages show when they were last updated. The approach chosen here must keep that date accurate.

## Decision drivers

- **Accurate preview:** Drafts render with the same frontend code and design as the live site.
- **No leaked drafts:** The public never sees unpublished content, on production or on Training.
- **One source of truth:** Content is written once, in one place, and is never copied between environments by hand.
- **Low cost and maintenance:** Reuse existing environments where possible instead of adding new services.
- **Realistic lower environments:** Dev and staging have content close to production for development and testing.
- **Auditability:** Every change and workflow step is recorded along with the person who made it.
- **Accurate "last updated" dates** on public pages.

## Options considered

1. Training as the preview space, with one authoring Drupal instance
2. A dedicated, access-restricted preview frontend in production
3. Next.js Draft Mode on the production frontend
4. Separate authoring and preview in every environment

## Decision outcome

### Chosen option: Training as the preview space, with one authoring Drupal instance

Training already runs the same frontend code as production, in the same AWS account. Using it as the preview space gives content managers an accurate preview without a separate preview service to build and maintain. With a single authoring instance, there is one source of truth, and publishing is a workflow step instead of a copy between systems.

How it works:

- **One authoring instance.** Content managers write, review, and publish content in a single Drupal instance, the production Drupal. No other environment is used for authoring.
- **Workflow.** Drupal's core [Content Moderation](https://www.drupal.org/docs/8/core/modules/content-moderation/overview) module tracks each page's state, for example Draft → In review → Published. Drupal configuration sets the states and who can move content between them.
- **Training is the preview space.** On Training, content managers can view the latest revision of any page, including drafts and content in review. The Training frontend reads these from the authoring instance over a private network connection, because Drupal has no public access (see [CMS sign-in and network access](2026-11-04-cms-sign-in-and-network-access.md)).
- **Drafts on Training are restricted.** Only content managers can see draft content on Training, for example by limiting preview pages to CMS VPN users. Public visitors to Training see the same published content as production. CloudFront never caches preview pages.
- **Production shows published content only.** The production frontend reads only published revisions. When content is published, its cached pages are cleared through a CloudFront invalidation so the change appears on production.
- **No preview in lower environments.** Dev and staging each have their own Drupal instance, isolated on the network the same way as production, with no preview or editorial workflow. A scheduled job copies production content (the database and uploaded files) down to them. The job strips account data such as names, email addresses, and password hashes during the copy. The next copy overwrites any content edits made in a lower environment.
- **Content and code move in opposite directions.** Content moves down, from production to staging and dev. Code and Drupal configuration, such as content types, fields, and workflow settings, move up through the normal deployment process: dev, then staging, then production.
- **Audit trail.** Drupal saves a revision for every change, with the author, the time, and an optional revision note. Content Moderation records each state change and who made it. Revisions are kept, so the full history of a page is always available.
- **"Last updated" dates.** Drupal records when each revision was saved. Public pages show the time of the currently published revision. Because there is only one authoring instance, this date is the same in every environment, and copying content to dev and staging does not reset it.

### Positive consequences

- Content managers preview drafts on the real frontend, without a new preview service to build, secure, or pay for.
- Content has one source of truth and is never copied between environments by hand.
- Publishing is a workflow transition in one system. No cross-environment sync can fail or drift.
- The production frontend never requests draft content, so drafts can't be cached or served on the public site.
- Dev and staging get realistic content automatically.
- Every change and workflow step is recorded with the person who made it.
- "Last updated" dates come from Drupal's own revision timestamps and stay consistent across environments.

### Negative consequences

- Training takes on a second role. Training already has its own users, and the preview restrictions must not get in their way.
- Preview depends on Training. If Training is down or mid-deployment, content managers can't preview. Training must also run the same frontend release as production, or previews won't match what the public sees.
- The Training frontend runs in the training VPC, while the production Drupal runs in the production VPC with no public access. Training needs a private connection to the production Drupal, such as VPC peering or a PrivateLink endpoint, open only to the Training frontend. This is the only path into Drupal from outside its own VPC.
- Restricting drafts on Training and keeping preview pages out of the CloudFront cache requires implementation work. Today Training is open to the public, and its CloudFront cache key includes only the `session` cookie and query strings. Content managers also reach Training through public CloudFront, not through the VPN. Limiting previews to VPN users therefore means recognizing VPN traffic, for example by sending it out through known IP addresses, or adding a separate preview sign-in.
- The Training frontend needs a credential that can read unpublished content from the production Drupal. That credential must be stored and rotated securely, and the production frontend must never have it.
- Between copies, content in dev and staging can fall behind production. Test content can't live in a lower environment across copies, so it has to come from code, such as Drupal recipes or default content.
- Changes to the editorial workflow itself, such as new states, roles, or content types, are tested in dev and staging without a preview frontend. If the team later needs preview in a lower environment, it can be added there.
- This narrows the CMS ADR, which says draft content can be "visible in lower environments before being published to production." Under this decision, drafts are visible only on Training.
- A published revision's timestamp changes with every published edit, including small fixes like typos. If HHS wants "last updated" to reflect only significant changes, we would add a date field that editors set themselves.

## Pros and cons of the options

### Training as the preview space, with one authoring Drupal instance

Described in the decision outcome above.

- **Pros**
  - Good, because it reuses an existing environment that already runs production code.
  - Good, because content has one source of truth.
  - Good, because the production frontend never handles draft content.
- **Cons**
  - Bad, because Training takes on a second role, and preview depends on Training being up and current.
  - Bad, because drafts on Training must be restricted and kept out of the CDN cache.
  - Bad, because Training needs a private network connection to the production Drupal in another VPC.

### A dedicated, access-restricted preview frontend in production

A separate copy of the frontend, available only to content managers, would read draft content from the production Drupal. This was the earlier plan.

- **Pros**
  - Good, because preview is fully isolated from every public site.
  - Good, because no existing environment takes on a new role.
  - Good, because it could run in the production VPC next to Drupal, with no cross-VPC connection.
- **Cons**
  - Bad, because it is a new service to build, deploy, secure, monitor, and pay for.
  - Bad, because it duplicates what Training already provides.

### Next.js Draft Mode on the production frontend

Content managers would switch on a draft view on the production site itself.

- **Pros**
  - Good, because no new environment or service is needed.
  - Good, because previews run exactly the production code.
- **Cons**
  - Bad, because the production CloudFront cache key includes only the `session` cookie and query strings. Draft pages could be cached and served to the public, or previews could show stale published content.
  - Bad, because the public production frontend would need access to draft content.
  - Bad, because it adds risk to the most important environment.

### Separate authoring and preview in every environment

Each environment would have its own Drupal instance, with its own workflow and preview.

- **Pros**
  - Good, because each environment could be tested end to end on its own.
- **Cons**
  - Bad, because content would live in several places and drift apart, with no clear source of truth.
  - Bad, because content managers would need to know which environment to edit, and content would have to be promoted between environments.
  - Bad, because it means the most infrastructure and the most maintenance.
  - Bad, because "last updated" dates could differ between environments.

## Open questions for HHS

1. Is Training an acceptable place for content managers to preview drafts, given its existing users?
2. Is restricting drafts on Training to VPN users enough, or do drafts need more protection?
3. How often should production content be copied to dev and staging, for example weekly or on request?
4. Should "last updated" change with every published edit, or only when an editor marks a change as significant?
5. Who must approve content before it is published? The answer sets the workflow states and roles.

## Links

- [Content management system (CMS) ADR](2026-01-content-management-system.md)
- [CMS sign-in and network access ADR](2026-11-04-cms-sign-in-and-network-access.md)
- [Determining the use cases of our environments (infra ADR)](../infra/0009-environment-use-cases.md)
- [Drupal Content Moderation module](https://www.drupal.org/docs/8/core/modules/content-moderation/overview)
