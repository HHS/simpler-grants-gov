# Cloud Platform to Host the Project

- **Status:** Accepted
- **Last Modified:** 2023-07-14 <!-- REQUIRED -->
- **Related Issue:** [#93](https://github.com/HHS/grants-api/issues/93) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly <!-- REQUIRED -->
- **Tags:** Hosting, Infrastructure, Security <!-- OPTIONAL -->

## Context and Problem Statement

The project needs a hosting provider in order to operate. The hosting provider should have a competitive suite of tools, a proven history of working with Health and Human Services (HHS), and provide necessary security controls.

## Decision Drivers <!-- RECOMMENDED -->

- **Past Performance:** The provider should have a proven track record of providing services for HHS.
- **Security:** The provider should be [Fedramp Authorizedi](https://marketplace.fedramp.gov/products) as a Platform as a Service Provider.
- **Tools**: The service provider should offer a competitive suite of tools that can be used to host the project.

## Options Considered

- Amazon Web Services
- Gov Cloud
- Google Cloud Platform

## Decision Outcome <!-- REQUIRED -->

HHS has selected Amazon Web Services to provide hosting services for the project due to:

- HHS' existing relationship with AWS,
- the existing grants.gov infrastructure is on AWS,
- migrating data and systems is more diffictult between multiple service providers,
- AWS is Fedramp approved,
- AWS offers a competitive set of tools, and
- the current engineering team and supporting organization have years of experience on AWS.

The cumulative cost and risk associated with moving away from AWS and the fact that the other service providers do not offer markedly superior features or service models meant that a feature by feature comparison was not necessary for this decision.

### Positive Consequences <!-- OPTIONAL -->

- AWS is well documented and supported, and is an industry standard, which will help the development team to perform efficiently.
- There are a large number of developers that are familiar with AWS, which will make it easier to get support and bring on more team member in the future.
- Migrating data is easier to configure, manage, secure, and is less costly than between multiple service providers.
- Simpler Grants team and existing Grants.gov teams will use the same cloud service provider.

### Negative Consequences <!-- OPTIONAL -->

- The AWS tools and infrastructure are not open source, which has negative consequences like vendor lock-in and the inability for reuse and repurposing of publicly funded tools.
- Most of the hosting tools are AWS specific, which makes it more difficult for the project to move hosts in the future if desired and for the general public to use the open source contributions as the infrastructure code will be vendor-specific.
