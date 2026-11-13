---
description: How content managers sign in to the Simpler.Grants.gov Drupal CMS, and how the CMS is isolated on the network
---

# CMS sign-in and network access

- **Status:** Active
- **Last Modified:** 2026-11-04
- **Related Issue:** [#13041](https://github.com/HHS/simpler-grants-gov/issues/13041)
- **Deciders:** Julius Chang (HHS) (contributors: Eric Serrato, Matt Dragon, Prasanthreddy Arikatla, Margaret Spring, Marques Webster)
- **Tags:** cms, drupal, authentication, security, vpn, networking

## Context and problem statement

The [CMS ADR](2026-01-content-management-system.md) selected self-hosted, headless Drupal for Simpler.Grants.gov editorial content. Content managers will sign in to the Drupal admin interface to write, review, and publish content. The public never uses the Drupal admin. Visitors see content through the Next.js frontend, which reads it from Drupal's API.

Only a small group needs to sign in: content managers at HHS and the Nava staff who support them.

Drupal is a common target for attackers, and its admin interface is powerful. We plan as if the Drupal instance could someday be compromised, so we want to limit what an attacker could reach from it.

This ADR answers three questions:

1. How do content managers sign in to Drupal?
2. How do content managers reach Drupal, given that it has no public access?
3. Where does Drupal run on the network, and what can it talk to?

## Decision drivers

- **Security:** Privileged access requires multi-factor authentication (MFA), and Drupal should not be reachable from the public internet.
- **Limited damage from a compromise:** If Drupal is compromised, the attacker should not be able to reach the Simpler.Grants.gov API, the application database, or other infrastructure.
- **Accountability:** Every content change must be traceable to a named person. There are no shared accounts.
- **Low operational burden:** We prefer managed services to servers the team must patch and maintain.
- **Effort that fits the need:** Setup, infrastructure code, and ongoing maintenance should match the size of the user group.
- **Low cost at low usage:** Only a few people will use the CMS, and not continuously.
- **Works for HHS and Nava users alike:** The two groups don't share one identity provider.
- **Independence:** Editing content shouldn't depend on the applicant-facing Login.gov integration or on AWS console access.

## Options considered

**Sign-in**

1. Drupal-provisioned accounts with MFA
2. Federated sign-in through Login.gov
3. Federated sign-in through HHS enterprise single sign-on (SSO)
4. Access through existing AWS sign-in, scoped to the Drupal instance

**Remote access**

1. AWS Client VPN (managed by AWS)
2. OpenVPN on an EC2 instance (managed by the team)

**Network placement**

1. The existing VPC, with Drupal locked down by security groups
2. A dedicated VPC for Drupal

## Decision outcome

Content managers connect to an AWS Client VPN, then sign in directly to Drupal with a named Drupal account and MFA. Drupal has no public access. It runs in the existing VPC, and security groups limit what it can talk to and what can talk to it.

### Sign-in: Drupal-provisioned accounts with MFA

The group of content managers is small, so creating and maintaining a few named Drupal accounts takes less effort than integrating and maintaining a federated identity provider. The VPN and network isolation below provide most of the security benefit. Required MFA and a regular access review cover the risks that federation would otherwise address.

- **Named accounts only.** A Drupal administrator creates one account per person once the request is approved. There are no shared or generic accounts.
- **Direct sign-in to Drupal.** Content managers sign in to the Drupal admin with a Drupal username and password. Sign-in does not go through Login.gov or AWS.
- **Required MFA.** Every account must enroll in MFA, for example an authenticator app through Drupal's [TFA module](https://www.drupal.org/project/tfa).
- **Password rules** that meet HHS requirements, enforced with Drupal's [Password Policy module](https://www.drupal.org/project/password_policy).
- **Least-privilege roles.** Each person gets only the role they need, such as editor, reviewer/publisher, or administrator. The publishing workflow defines these roles. See [CMS content preview and environments](2026-11-04-cms-content-preview-and-environments.md).
- **Account lifecycle.** An account is blocked or removed, and its VPN access revoked, when its owner leaves the program or no longer needs access. A periodic access review (proposed: quarterly) confirms that each active account still belongs to someone who needs it.
- **Logging.** Drupal records who made each content change and each workflow transition. Sign-ins and administrative actions, such as role changes, are also logged.

### Remote access: AWS Client VPN

AWS manages Client VPN, so the team has no VPN server to patch, monitor, or keep running. Usage will be low, and Client VPN is billed by the hour, which suits a few occasional users.

- **VPN first, then Drupal.** Content managers connect to the Client VPN before they open the Drupal admin.
- **VPN users reach Drupal only.** Client VPN authorization rules and security groups limit VPN users to Drupal. Connecting to the VPN does not give access to the API, databases, or other services.
- **Authentication method to be decided.** Client VPN can authenticate users with per-user certificates or through SAML with an identity provider. The team will choose one in [#7580](https://github.com/HHS/simpler-grants-gov/issues/7580).
- **Access follows the Drupal account.** VPN access is granted and removed together with the person's Drupal account.

### Network placement: the existing VPC, locked down

Reusing the existing VPC keeps the infrastructure code simpler and lets the frontend reach Drupal directly. Security groups provide the isolation that a separate VPC would otherwise provide.

- **Each environment's Drupal runs in that environment's existing VPC.**
- **No public access.** Drupal has no public load balancer or public IP address.
- **Inbound traffic:** Only the frontend service and VPN users can reach Drupal.
- **Outbound traffic:** Drupal can reach its own database. It cannot reach the Simpler.Grants.gov API, the application database, or other services. Drupal gets outbound internet access only if it needs it while running, for example for update checks. Modules and updates are installed when the container image is built, so this may not be needed.
- **Rules live in code.** The security group and VPN rules are defined in Terraform, so every change to them goes through code review.

### Positive consequences

- Sign-in is quick to set up. There is no new identity provider integration to configure, test, and get approved before content managers can start.
- HHS and Nava users follow the same sign-in process.
- Drupal is not reachable from the public internet, which blocks automated attacks on its sign-in pages and admin interface.
- If Drupal is compromised, the attacker cannot reach the API, the application database, or other infrastructure from it.
- The team has no VPN server to patch or maintain.
- The design reuses the existing VPC and Terraform patterns, and the frontend can reach Drupal directly.
- Every content change can be traced to a named person.
- Content editing does not depend on Login.gov availability or AWS console access.
- The experience is close to how content managers use Storyblok for Grants.gov today. We believe Storyblok does not use federated SSO; see the open questions below.

### Negative consequences

- Content managers have one more username, password, and MFA device to manage. They also need to install a VPN client and connect before each editing session.
- Accounts and VPN access are created and removed by hand. If someone skips the offboarding process, a former team member could keep access. The access review reduces this risk but doesn't remove it.
- Because Drupal shares a VPC with other services, isolation depends on the security group and VPN authorization rules being correct. A mistake could let Drupal or VPN users reach other services. A dedicated VPC would give a firmer boundary. Keeping the rules in Terraform under code review, and periodically confirming that VPN users can't reach the API or databases, reduces this risk.
- Client VPN charges for each hour the endpoint is attached to a subnet, even when no one is connected, and for each hour a user is connected. The cost should be low at this usage, but it isn't zero.
- The Training frontend, which is used for draft previews, runs in a different VPC from the production Drupal. It needs a private connection to the production Drupal, limited to that one path. See [CMS content preview and environments](2026-11-04-cms-content-preview-and-environments.md).
- The TFA and Password Policy modules are contributed modules, not part of Drupal core. The team must keep them patched along with core.
- If the number of content managers grows a lot, for example if many program offices start editing their own pages, the sign-in decision should be revisited. Drupal can add SAML or OpenID Connect sign-in later and link it to existing accounts.

## Pros and cons of the options

### Sign-in options

#### Drupal-provisioned accounts with MFA

Described in the decision outcome above.

- **Pros**
  - Good, because it needs the least setup and has no external dependencies.
  - Good, because it works the same way for HHS and Nava users.
- **Cons**
  - Bad, because accounts are managed by hand.
  - Bad, because content managers have a separate set of credentials.

#### Federated sign-in through Login.gov

Content managers would sign in with their Login.gov accounts through an OpenID Connect integration in Drupal. Simpler.Grants.gov already uses Login.gov for applicants.

- **Pros**
  - Good, because Login.gov handles MFA and account recovery.
  - Good, because the team already has experience with Login.gov.
- **Cons**
  - Bad, because it needs its own Login.gov integration, with separate sandbox and production configuration. Reusing the applicant integration would mix staff access with public applicant sign-in.
  - Bad, because Drupal would still need a local account and role for each person. Login.gov confirms who someone is, not whether they may edit content, so the account setup work remains.
  - Bad, because a Login.gov outage or configuration problem would block content updates.
  - Bad, because the setup and maintenance effort is large for a small group of users.

#### Federated sign-in through HHS enterprise SSO

Content managers would sign in with their existing HHS credentials through SAML or OpenID Connect.

- **Pros**
  - Good, because HHS staff would use credentials they already have.
  - Good, because disabling a person's HHS account would also end their CMS access.
- **Cons**
  - Bad, because Nava staff may not have HHS identities, so a second sign-in method would still be needed.
  - Bad, because it needs approval from HHS IT, which would take time to coordinate.
  - Bad, because Drupal would still need a local role for each person.

#### Access through existing AWS sign-in

Users would sign in with AWS accounts limited to the Drupal instance, then reach the Drupal admin through AWS.

- **Pros**
  - Good, because Nava engineers already have AWS access, and AWS access can be revoked centrally.
- **Cons**
  - Bad, because HHS content managers would need AWS accounts just to edit web pages.
  - Bad, because it widens who has AWS access and ties content editing to infrastructure permissions.
  - Bad, because content managers would go through more steps to sign in.
  - Bad, because each person would still need a Drupal account after signing in to AWS.

### Remote access options

#### AWS Client VPN

A VPN endpoint that AWS manages, attached to the VPC where Drupal runs.

- **Pros**
  - Good, because AWS patches and runs it, so there's no VPN server for the team to maintain.
  - Good, because hourly billing keeps costs low for a few occasional users.
  - Good, because it works with security groups and authorization rules, which can limit VPN users to Drupal.
- **Cons**
  - Bad, because the endpoint is billed for every hour it's attached, even when idle.
  - Bad, because the team still has to choose and manage a user authentication method.

#### OpenVPN on an EC2 instance

A VPN server that the team installs and runs on its own EC2 instance.

- **Pros**
  - Good, because the team has full control over its configuration.
  - Good, because the cost is a predictable instance charge.
- **Cons**
  - Bad, because the team must patch and maintain the server's operating system and the OpenVPN software.
  - Bad, because the team must manage VPN users and certificates on the server.
  - Bad, because a single instance is a single point of failure and another internet-facing server to secure.

### Network placement options

#### The existing VPC, locked down

Drupal runs in each environment's existing VPC. Security groups restrict its inbound and outbound traffic.

- **Pros**
  - Good, because it's the simplest option to build in Terraform.
  - Good, because the frontend can reach Drupal directly, without extra networking.
- **Cons**
  - Bad, because isolation depends on the security group and VPN rules being correct.
  - Bad, because VPN users connect into the same VPC as the API and databases, so the VPN rules must keep them limited to Drupal.

#### A dedicated VPC for Drupal

Drupal runs in its own VPC, and the VPN connects only to that VPC.

- **Pros**
  - Good, because it provides a firmer network boundary between Drupal and the rest of the infrastructure.
  - Good, because VPN users would land in a VPC that contains only Drupal.
- **Cons**
  - Bad, because the frontend would need a cross-VPC connection, such as VPC peering or PrivateLink, to reach Drupal.
  - Bad, because it means more Terraform to build and maintain: another network, routing, and DNS.
  - Bad, because it departs from the project's pattern of one VPC per environment.

## Open questions for HHS

1. Does HHS approve this approach: named Drupal accounts with MFA, reachable only through an AWS Client VPN?
2. Who approves requests for new content manager accounts and VPN access?
3. Does HHS have requirements for passwords, MFA type, session timeouts, or VPN authentication that the setup must meet?
4. We assume Storyblok on Grants.gov does not use a federated SSO provider today. Is that correct?

## Follow-up work

- [#7580](https://github.com/HHS/simpler-grants-gov/issues/7580): Set up the AWS Client VPN and Drupal network isolation, including the VPN authentication method.
- Set up the private connection from the Training frontend to the production Drupal for draft previews. See [CMS content preview and environments](2026-11-04-cms-content-preview-and-environments.md).

## Links

- [Content management system (CMS) ADR](2026-01-content-management-system.md)
- [CMS content preview and environments ADR](2026-11-04-cms-content-preview-and-environments.md)
- [AWS Client VPN documentation](https://docs.aws.amazon.com/vpn/latest/clientvpn-admin/what-is.html)
- [Drupal TFA module](https://www.drupal.org/project/tfa)
- [Drupal Password Policy module](https://www.drupal.org/project/password_policy)
