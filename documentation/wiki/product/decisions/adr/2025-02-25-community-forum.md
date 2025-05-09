# Dedicated Forum for Simpler.Grants.gov Community



* **Status:** Active
* **Last Modified:** 2025-02-25
* **Related Issue:** [**#3314**](https://github.com/HHS/simpler-grants-gov/issues/3314)
* **Deciders:** Brandon
* **Tags:** open source, community

## Context and Problem Statement

We want to foster a more engaged and sustainable community space for Simpler Grants.gov (SGG) open-source & co-design community discussions.

* Our existing community channels—Slack (with \~30–50 invitees) and Google Groups—are underutilized and have not achieved the kind of broad, asynchronous engagement we want.
* Slack is a synchronous tool that can exclude a certain audience. It is a powerful tool for highly engaged users who require near real time conversations with other known collaborators. In the current stage of SGG we have found that although internal staff find this tool highly useful, that external users are turned away by the complexity and fast moving nature of a realtime discussion platform.&#x20;
* Google Groups remain largely unused. We have not publicized our Google Group’s existence to any members of the public or even to our internal team.&#x20;
* We need a dedicated discussion space that is accessible to a wide range of users (including non-technical people), public and discoverable via search engines, and capable of storing institutional knowledge over time. It also needs to be less real time to allow newer users to engage at a pace that feels more comfortable to them.

## Decision Drivers

1. Accessibility and Discoverability: Must allow for search engine indexing so potential users can stumble upon and engage with the forum.
2. Ease of Use: Low barrier to entry for both technical and non-technical audiences.
3. Asynchronous Collaboration: Ability to store long-term discussions, Q\&A, and historical context in a searchable format.
4. Integration: Should ideally integrate well with GitHub or other existing tools, or at least link seamlessly from the main SGG site.
5. Moderation and Maintenance Effort: Should not significantly burden our team, but allow for moderation controls and community management.
6. Security: Our approach keeps data secure and fulfills all relevant HHS security policies, where applicable.

## Options Considered

1. GitHub Discussions
2. Discourse

## Decision Outcome

Chosen option: Discourse Because it best meets key decision drivers around search engine discoverability, user-friendliness for non-technical audiences, flexible configuration, and the ability to host on a custom domain or subdomain.

### Positive Consequences

* Enhanced Visibility: A dedicated Discourse instance, likely on a subdomain (e.g., community.simplergrants.org), can be indexed by search engines, increasing discoverability.
* User-Friendly Experience: Discourse provides a clean UI, straightforward signup, and intuitive navigation.
* Community Growth: Easier for members (technical and non-technical) to find and join discussions; improved Q\&A and knowledge retention.

### Negative Consequences

* Hosting and Maintenance Overhead: Discourse requires hosting (self-hosted or managed) and regular maintenance (updates, backups, etc.).
* Moderation Responsibility: We will need to maintain active moderation to keep the forum healthy and welcoming.
* Separate Logins: Users need to create an account distinct from GitHub unless we configure a single-sign-on (SSO) solution.
* FedRAMP Compliance: We have investigated and determined that DIscouse is not FedRAMP compliant and does not have any plans to become compliant.

## Pros and Cons of the Options

#### Option 1: GitHub Discussions

Description: Enable GitHub Discussions in the SGG repository.

* Pros:
* Already integrated into the GitHub ecosystem; no new hosting required.
  * Familiar to technical contributors.
  * Minimal setup and maintenance effort.
* Cons:
  * Limited discoverability for non-technical folks (requires GitHub account, repository context).
  * Forum remains “buried” within the repository rather than a top-level domain.
  * Less intuitive for those unfamiliar with GitHub conventions.

#### Option 2: Discourse

Description: Set up a dedicated Discourse instance on a standalone domain or subdomain.

* Pros:
  * Search-engine-friendly; easier for new community members to stumble upon.
  * Rich discussion features (threading, tagging, badges, user trust levels, etc.).
  * Established platform used by many open-source projects with robust plugin and customization options.
* Cons:
  * Requires hosting (self-hosted or SaaS) and ongoing maintenance (updates, backups).
  * Separate account system (unless we invest in an SSO approach).\*
  * Potentially higher initial setup complexity.

\* The Standard $100/mo version of Discourse has GitHub auth.

![](https://lh7-rt.googleusercontent.com/docsz/AD_4nXdgxkl811xq33OTTHC16vYoW3_nLG-tMWE7NaY0YvAGvTW4GRDXRLICqYb2zQB9zI-INsoQtyTQjSs88EqS7sFlnq_x6I_KHf2J8LsufYU44cH-GnOJ5tMzlXzUlEtBtMVjHV1AIQ?key=ZtuX4jEtOOT1M7yYWNfaz8oD)

## Links

* [Mural](https://app.mural.co/t/nava4113/m/nava4113/1739479674617/17839f521e517c126c2a93b4737c1731e30964e7)
* [Discourse](https://www.discourse.org/)
* [GitHub Discussions Documentation](https://docs.github.com/en/discussions)
* [React GitHub Discussions](https://github.com/reactwg/react-18/discussions) (Example)
* [NASA Core Flight Systems GitHub Discussions](https://github.com/nasa/cFS/discussions) (Example)
