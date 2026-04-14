---
description: >-
  Answer the most common questions we hear about how an open source software
  affects security, and explain why public code is an asset, not a liability,
  when it is paired with strong operational control
---

# Open source and security

### Summary

Open source does not remove the need for strong security engineering. It does something more useful: it makes our code, dependencies, and architecture reviewable, so issues can be found, discussed, and fixed in the open.

For Simpler Grants, our security posture is not based on hiding how the system works. It is based on controls that remain effective even when the code is fully visible:

* secrets stored outside the repository
* least-privilege access controls
* network boundaries and managed cloud services
* automated vulnerability scanning and patching workflows
* code review, audit trails, and reproducible dependency management

This approach is consistent with modern security practice, with federal guidance from **CISA**, and with how the federal government is increasingly required to develop software under the **SHARE IT Act** (Public Law 118-187) and **OMB Memorandum M-16-21**, the Federal Source Code Policy.

***

### How this applies to Simpler Grants

Our repository separates **public design information** from **sensitive runtime data**. Specifically:

* Architecture is documented publicly in the repo so reviewers, partners, and contributors can see how the system is built.
* Runtime secrets and sensitive configuration are managed outside the repository using AWS secrets management and environment-scoped parameters. No credentials, API keys, or private certificates live in the code.
* Dependencies are pinned and reproducible via lockfiles, so any change is reviewable and auditable.
* Production dependency footprint is minimized by separating dev-only packages from runtime dependencies and by using minimal release images where possible.
* Automated dependency maintenance runs through Renovate, including vulnerability alert handling and documented SLAs for patching.
* Vulnerability scanning runs pre-deploy via Anchore, with scan output persisted to S3 and an analytics database for compliance reporting and trend visibility.
* Post-build and cloud-side scanning runs through AWS Inspector and Security Hub.
* Code review, audit trails, and branch protections mean that every change to production code is attributable, reviewable, and traceable.

In other words: the public repo shows how we build software. It does not expose credentials, keys, private data, or production access paths.

***

#### What is not public

Our open source approach does not mean every security-relevant detail is published. We do not publish:

* secrets, tokens, private keys, or credentials
* protected production data
* privileged operational access paths
* private incident handling details that would create unnecessary risk while an issue is being remediated

Security vulnerabilities should be reported through the HHS Vulnerability Disclosure Policy, not through public GitHub issues.

***

### Why this is a security advantage

Open source strengthens security when paired with mature operational controls:

* Security researchers, vendors, partners, and HHS reviewers can inspect the same code and documentation our team uses. No black box.
* When a new CVE is published, maintainers can quickly determine whether a vulnerable dependency is present and whether a fix has landed.
* Pull requests, commit history, and lockfile changes create an auditable record of what changed, when, by whom, and why.
* Sensitive protections live in secrets, access controls, infrastructure policy, and runtime defenses, not in the assumption that design details will stay hidden.
* HHS is not dependent on a single vendor's black-box implementation to understand, operate, or transition the software in the future.

This is consistent with [CISA's Open Source Software Security Roadmap](https://www.cisa.gov/resources-tools/resources/cisa-open-source-software-security-roadmap), which treats secure open source usage as a core part of modern federal cybersecurity rather than an exception to it. CISA itself operates under an "open-by-default" software development policy and publishes its own code on GitHub.

***

### Industry and government examples of open source in high-risk environments

Public code and professionally operated, security-sensitive services are not mutually exclusive. This is especially well-established in the federal government.

#### Federal government

* **Login.gov** (GSA / Technology Transformation Services). The identity provider that secures authentication for dozens of federal agencies is fully open source. Its core codebase lives at [github.com/18F/identity-idp](https://github.com/18F/identity-idp). Login.gov protects access to services handling SSNs, IRS records, veteran benefits, and more — and it does so with a public codebase.
* **CISA.** America's cyber defense agency operates under an open-by-default software development policy and [publishes its own code publicly on GitHub](https://github.com/cisagov). This is the agency whose guidance most federal security programs follow.

#### Legal framework

Federal open source is not a fringe practice; it is increasingly the default:

* **OMB M-16-21 (Federal Source Code Policy, 2016)** requires federal agencies to release at least 20% of custom-developed code as open source and to make code reusable across agencies by default.
* **The SHARE IT Act (2024, Public Law 118-187)** reinforces and extends this direction: custom-developed federal code should be shared across the government and, where appropriate, with the public.

#### Industry

Many organizations operating security-sensitive, mission-critical systems combine public codebases with strong hosted operations:

* **GitLab.** GitLab's core product is [developed in public](https://gitlab.com/gitlab-org/gitlab), and GitLab.com runs as a multi-tenant SaaS on top of that public codebase. GitLab holds FedRAMP and other government certifications.
* **HashiCorp Vault / Terraform.** Vault, used for secrets management at many Fortune 500 companies and federal agencies, is developed in the open.
* **Signal.** End-to-end encrypted messaging for journalists, activists, and national security personnel is [fully open source](https://github.com/signalapp) on both client and server.
* **Bitwarden.** Password manager handling credentials for millions of users and enterprise customers is open source.
* **Discourse**, **Zulip**, **Mattermost.** All operate public codebases alongside managed cloud offerings used by governments and regulated industries.
* **Kubernetes, PostgreSQL, Linux, nginx, OpenSSL.** The foundational infrastructure of essentially every modern cloud and government system, including classified environments, is open source.

These examples do not prove that every open source implementation is secure. They do show that mature organizations including those handling the most sensitive data in the federal government routinely combine public codebases with strong security and operations.

***

### Bottom line

Open source changes the security model from _"trust us, the implementation is hidden"_ to _"inspect the implementation, and judge the quality of the controls."_

For Simpler Grants, that is a benefit. It supports transparency, independent review, faster remediation, and better long-term continuity for HHS while keeping sensitive material out of the public repository. It is consistent with CISA guidance, with the Federal Source Code Policy, with the SHARE IT Act, and with how the rest of the federal government's most security-sensitive modern services are already being built.

***

### The short answer to the concerns we hear most often

#### "If the architecture is public, attackers can study it and craft exploits."

Attackers do not need a public repository to learn how a target works. In practice, they infer technology choices from network behavior, HTTP headers, client-side code, package fingerprints, infrastructure patterns, error messages, and previously disclosed CVEs. "Security through obscurity" is widely recognized by security professionals, including CISA, as a weak control on its own.

The more useful question is whether the system stays secure even when an attacker understands the general design. Strong systems assume that design details may become known and still protect sensitive assets through authentication, authorization, secret management, encryption, monitoring, and rapid patching.

Open source actually improves this situation, because more people can inspect the implementation, challenge assumptions, and surface weaknesses before they become incidents. Public review is not a substitute for internal security work, it is an additional layer of scrutiny on top of it.

#### "If package versions are public, attackers can see when we're running vulnerable versions."

Visibility cuts both ways. Public dependency data also helps defenders, auditors, and maintainers identify exposure faster, validate fixes, and confirm that upgrades actually happened. When a new CVE is published, a public, lockfile-based repository lets us answer "are we affected?" in minutes.

Closed-source systems are not automatically protected from this risk. Attackers routinely fingerprint versions indirectly, and operators of closed systems still need the same disciplined process to detect vulnerable components and remediate them quickly. The stronger posture is to make dependency changes traceable and to pair that transparency with automated scanning, patch management, and deployment controls, which is what we do.

#### "Can you show us examples of this working safely in high-risk environments?"

Yes. See the industry and government examples section below. The short version: public code and professionally operated, high-assurance services are not mutually exclusive, and much of the federal government's most security-sensitive software is already developed this way.

### Further reading

* [CISA Open Source Software Security Roadmap](https://www.cisa.gov/resources-tools/resources/cisa-open-source-software-security-roadmap)
* [CISA Open Source Security program page](https://www.cisa.gov/opensource)
* [OMB M-16-21: Federal Source Code Policy](https://www.cio.gov/policies-and-priorities/source-code/)
* [SHARE IT Act (Public Law 118-187)](https://www.congress.gov/bill/118th-congress/house-bill/9566)
* [Login.gov core codebase on GitHub](https://github.com/18F/identity-idp)
* [IRS Direct File on GitHub](https://github.com/IRS-Public/direct-file)
