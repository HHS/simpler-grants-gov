---
description: ADR document our decision to use Confluence for internal knowledge management.
---

# Internal knowledge management

* **Status:** Accepted
* **Last Modified:** 2025-04-18
* **Related Issue:** [#4625](https://github.com/HHS/simpler-grants-gov/issues/4625)
* **Deciders:** Lucas, Julius, Margaret
* **Tags:** Knowledge management

### Context and problem statement

We are using Google Drive to manage most internal documents, like meeting notes, presentations, and working documents (e.g. draft ADRs, draft deliverables). However, we haven’t officially decided where more engineering-heavy internal documentation will live, such as technical specifications, runbooks, and other reference documents that require active collaboration up front, but then are meant to be read by a broader audience in the long run. We also need an easier way to navigate between artifacts created or managed in different mediums, such as Mural, Figma, GitHub, etc.

Many technical specifications for our open source project can be made publicly available because they do not contain sensitive information about personnel, security, or other private matters. Most publicly available content that is relevant to the development of our codebase is already managed in GitHub.

However, some technical documentation cannot be made publicly available. Here are some examples:&#x20;

* On-call schedules that reference individual team members’ names or vacation schedules
* Engineering technical specs meant for an internal audience&#x20;
* Runbooks that contain contact information or sensitive information

Some other documentation can be made public, but needs a level of collaboration that is difficult in GitHub, such as a desire for non-engineering team members to contribute to the documents. Here are some examples:&#x20;

* Engineering technical specification drafts
* Runbooks&#x20;

Some other documentation serves as a table-of-contents or persistent reference to other artifacts. In most projects, this kind of information is stored in a wiki of some kind, and we may want to consider the same here, or we could use alternative tools from our existing stack for it.&#x20;

We need to decide which platform(s) to use for this category of internal, private reference documents, especially ones that require engineering feature support like code blocks, diagrams, etc.

### Decision drivers

* **Collaborative features:** Platform supports comments and live collaborative editing in an easy-to-use user experience
* **Engineering features:** Platform supports common engineering features like code comments with syntax highlighting and embedded diagrams
* **Access control:** Platform provides fine-grained control over view, edit, and comment access
* **Discoverability:** Platform makes content easy to organize and discover alongside other engineering resources and communication.
* **Cost:** We can extend access to this platform without the addition of significant license costs or platform costs.

### Options considered

* [Confluence](2025-04-18-internal-knowledge-management.md#confluence)
* [Google Drive](2025-04-18-internal-knowledge-management.md#google-drive)
* [GitHub](https://docs.google.com/document/d/1KThRD8jIjZuSxNTRqD5OfJQdF9U1DhQ7jxOr2Q_f4DY/edit?tab=t.0#heading=h.eb10fcu3jxre)
* [Slack canvas](2025-04-18-internal-knowledge-management.md#slack-canvas)
* [Public wiki](2025-04-18-internal-knowledge-management.md#public-wiki-gitbook)

Another internal GitBook instance was not evaluated and is not recommended at this time due to usability concerns raised by the team pertaining to multiple GitBook instances.

## Decision outcome

### Chosen: Use Confluence

Establish Confluence (hosted by Nava) as an official platform for managing internal documentation, especially for technical specifications and runbooks. Then grant licenses to the HHS PMO and Agile Six teams.

#### Positive consequences

* Nava is already using Confluence for a lot of internal documentation, so the change management associated with adoption is minimal
* Nava uses Confluence for a lot of its company documentation, so even if Simpler doesn’t use Confluence, most of the Nava staff working on Simpler will already be using Confluence already.
* Balances needs around collaborative editing, code snippets, access management, and discoverability fairly well.
* Confluence could provide an entry point for linking to internal resources managed on other platforms that are less discoverable (e.g. Google Drive).
* Many team members prefer Confluence’s user interface to GitBook, with easier commenting and editing support.

#### Negative consequences

* Requires adding license costs for PMO and Agile Six to ODCs – either \~$6 per user/mo (basic) or \~$12 per user/mo (pro)
* Adds another tool we need to manage and track, and a new tool for everyone on the project who’s not Nava.
* May create a second set of questions about when to use Google Drive vs. Confluence or Confluence vs. public wiki.
* People using Confluence regularly may start to post content in Confluence that is non-sensitive (and thus should be public) and is essential to understanding how to run the codebase, or understanding why certain decisions about technical architecture were made. If this information is private in Confluence, it means our project is not truly open source and our documentation is not available open source.

## Considered but not chosen

### Option B: Use Google Drive + Slack canvas

Continue using Google Drive for most internal documentation, selectively choosing to publish certain reference documents in Slack canvas if access and management is driven largely by channel membership (e.g. incident response runbooks in #topic-infra-alerts).

#### Positive consequences

* Avoids adding another tool to manage and onboard people to
* Avoids adding to ODCs for the program
* Keeps most of our internal documentation together on one platform
* Works well for reference docs that are tightly coupled with a channel (e.g. Incident Response Plans in #topic-infra-alerts)

#### Negative consequences

* We’ll need to find some workarounds (i.e. plugins) for engineering specific features like code snippets with syntax highlighting or diagram embedding
* Some internal docs may be harder to find or organize, or it will require us to find workarounds to promote more centralized discovery (e.g. Slack Canvas or pinned docs in slack channels)
* May create a second set of questions about when to use Google Drive vs. Slack canvas
* Members of the team have expressed some frustrations with using Slack Canvas, especially around its collaboration and commenting features.
* Tracking changes and versioning is&#x20;

### Option C: Use public GitBook + Google Drive

Use public GitBook for all engineering-heavy drafts that include things such as code snippets and that do not contain information that must be kept private. The vast majority of our engineering documentation will be able to be publicly accessible. For any documents that need to be kept private, such as on-call and vacation schedules, use Google Drive.

If the Google Drive has permissions configured correctly so that only people on the team can view the documents, then the public GitBook pages could even link to these Google Drive documents.

#### Positive consequences

* Avoids adding another tool to manage and onboard people to
* Avoids adding to ODCs for the program
* Keeps most of our engineering related documentation open source, while providing an option for storing sensitive documents internally
* Makes documentation more easily discoverable and searchable through the wiki, while also ensuring it remains version controlled in GitHub (with git syncing)

#### Negative consequences

* The team has expressed frustration with the usability of GitBook for editing and review workflows, this approach may resurface those frustrations
* May create a second set of questions about when to use Google Drive vs. public wiki or public wiki vs. GitHub especially for engineering docs
* Adding more technical specifications and discovery documents to the wiki may make the intended audience a bit less clear, or lead to issues with content organization for public visitors

## Pros and cons

### Side-by-side

* ✅ Satisfies criterion
* 🟡 Partially meets criterion
* ❌ Does not meet criterion

<table><thead><tr><th width="147.35546875">Criteria</th><th width="118.37890625" align="center">Confluence</th><th width="119.34375" align="center">Google Drive</th><th width="120.07421875" align="center">GitHub</th><th width="118.2421875" align="center">Slack canvas</th><th width="119.62109375" align="center">Public wiki</th></tr></thead><tbody><tr><td>Engineering features</td><td align="center">✅</td><td align="center">🟡</td><td align="center">✅</td><td align="center">❌</td><td align="center">✅</td></tr><tr><td>Collaborative features</td><td align="center">🟡</td><td align="center">✅</td><td align="center">❌</td><td align="center">🟡</td><td align="center">🟡</td></tr><tr><td>Access control</td><td align="center">✅</td><td align="center">✅</td><td align="center">❌</td><td align="center">🟡</td><td align="center">❌</td></tr><tr><td>Discoverability</td><td align="center">🟡</td><td align="center">❌</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr><tr><td>Cost </td><td align="center">🟡</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td><td align="center">✅</td></tr></tbody></table>

### Confluence

{% hint style="success" %}
**Bottom Line**

Confluence is best if:

* We want a tool that the Nava team is already using with balanced support for engineering features, access control, collaboration, and discoverability;
* But we’re willing to add to our ODCs and the number of platforms we’re managing.
{% endhint %}

#### Breakdown

* **Pros**
  * Nava is already using a company Confluence instance to manage technical specifications and engineering runbooks.
  * Confluence has strong support for engineering features like code blocks, diagrams, etc.
  * It’s easier to organize and discover content in Confluence than in Google Drive.
  * Confluence has stronger support for comments and collaborative editing than Slack canvas or GitHub.
* **Cons**
  * Choosing Confluence as our official platform for engineering docs would require adding (at a minimum) licenses for Agile Six and Grants PMO.
  * Adding Confluence expands the number of tools that the team needs to manage and track.
  * While better than Slack or GitHub, Confluence’s support for collaborative editing and comment isn’t quite as robust as Google docs.

### Google Drive

{% hint style="success" %}
**Bottom line**

Google Drive is best if:

* We want an existing tool that we already use for our other internal documents with strong support for collaboration and access management;
* And we’re willing to address some friction with discoverability and code snippet support.
{% endhint %}

#### Breakdown

* **Pros**
  * The team is already using Google Drive to manage other internal documents.
  * Google Drive offers the strongest support for comments and collaborative editing.
  * Using Google Drive doesn’t require adding any additional licenses or ODCs.
  * Using Google Drive doesn’t require adding support for new tools or platforms.
  * Google docs plugins offer support for engineering features like code blocks and diagrams.
* **Cons**
  * Google Drive makes content harder to organize and discover than other platforms, especially if we’re using it to manage other program documentation.
  * The support for engineering features is less mature than Confluence or GitHub.

### GitHub

{% hint style="success" %}
**Bottom line**

GitHub is best if:

* We want an existing tool that is already used for public engineering docs with strong support for code snippets;
* But we’re willing to compromise on collaborative features and accept that the docs will be public.
{% endhint %}

#### Breakdown

* **Pros**
  * GitHub offers strong support for engineering features like code snippets and embedded mermaid diagrams.
  * GitHub is already used to manage most of our engineering documentation.
  * Using GitHub doesn’t require adding any additional licenses or ODCs
  * Using Google Drive doesn’t require adding support for new tools or platforms.
* **Cons**
  * GitHub only supports comments through PRs and doesn’t offer collaborative editing.
  * GitHub makes less sense to manage non-engineering reference documentation.
  * Content in GitHub is visible to the public, so we’d have to be careful about the information contained in these reference docs.

### Slack canvas

{% hint style="success" %}
**Bottom line**

Slack canvas is best if:

* We want an existing tool that we already use to share internal documentation, and we value channel-based access management;
* But we’re willing to accept some friction around collaborative editing and code snippet support.
{% endhint %}

#### Breakdown

* **Pros**
  * Slack is where we already share or pin most documentation.
  * Slack canvas makes it easy to manage access and discoverability within a channel, which aligns with access management needs for many internal docs.
  * Using Slack doesn’t require adding any additional licenses or ODCs.
  * Using Slack Drive doesn’t require adding support for new tools or platforms.
* **Cons**
  * Slack canvas support for collaboration and comments are not as robust as Google Drive.
  * Slack canvas doesn’t easily support syntax highlighting or embedded diagrams.
  * Slack canvases could become harder to manage if we’re using them for lots of internal documentation, instead of select reference docs.

### Public wiki (GitBook)

{% hint style="success" %}
**Bottom line**

Public wiki is best if:

* We want an existing tool that is already used for public documentation with better diagramming and comment support than GitHub;
* But we’re willing to compromise on more advanced collaborative features and accept that the docs will be public.
{% endhint %}

#### Breakdown

* **Pros**
  * The public wiki is where we already share much of our public documentation, especially for open source contributors.
  * The public wiki supports a wider range of features than GitHub or Google Docs for technical documentation, like embedded content, tool tips, etc.
  * The public wiki supports more collaborative features than GitHub.
  * The public wiki content is automatically synced with our GitHub repository when change requests are merged.
  * Content in the public wiki is more easily searchable and better organized than GitHub or Google Drive.
  * Using the public wiki doesn’t require adding any additional licenses or ODCs.
  * Using the public wiki doesn’t require adding support for new tools or platforms.
* **Cons**
  * The team has expressed frustration with GitBook’s usability for editing and review.
  * GitBook’s collaboration features are less mature than Confluence or Google Drive.
  * All documentation published on the public wiki is publicly available.
  * The public wiki content or organization could become harder to navigate if we’re using it for more discovery docs and technical specifications.
