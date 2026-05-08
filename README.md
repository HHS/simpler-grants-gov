# [Simpler.Grants.gov](https://simpler.grants.gov/)

[![Get Paid to Contribute](https://img.shields.io/badge/Bounties-Get_Paid_to_Contribute-blue?style=flat-square&logo=github)](https://github.com/HHS/simpler-grants-gov/issues?q=is%3Aopen+is%3Aissue+label%3Abounty)

A modernization effort for [Grants.gov](https://grants.gov/)

## About the Project

We want Grants.gov to be an extremely simple, accessible, and easy-to-use tool for posting, finding, sharing, and applying for federal financial assistance. Our mission is to increase access to grants and improve the grants experience for everyone. We’re improving the way applicants search for and discover funding opportunities, making it easier to find and apply. For federal grantmaking agencies, we’re making it easier for their communities to find the funding they need.

At Simpler Grants, we believe that open-source contributors are the backbone of government modernization. To accelerate our mission of making federal financial assistance accessible to all, we've launched the **Funded Open Source Contributor Program**. This pilot initiative directly rewards developers, technical writers, and researchers for solving specific, high-priority issues that improve the Grants.gov experience for everyone.

Go to [Simpler.Grants.gov](https://simpler.grants.gov/) to learn about our transparent process and what we’re doing now, or explore our existing user research and the findings that are guiding our work.

See [goals.md](./documentation/goals.md) for more information about the vision and goals for the project.

## 💰 Open Bounties

Explore our active bounty opportunities and get paid for your contributions. We categorize our bounties into tiers based on complexity and impact:

| Tier | Reward (USD) | Issues |
| :--- | :--- | :--- |
| **Medium** | $250 | [View M-Tier Issues](https://github.com/HHS/simpler-grants-gov/issues?q=is%3Aopen+is%3Aissue+label%3A"bounty%3A+M") |
| **Large** | $500 | [View L-Tier Issues](https://github.com/HHS/simpler-grants-gov/issues?q=is%3Aopen+is%3Aissue+label%3A"bounty%3A+L") |
| **X-Large** | $1,000+ | [View XL-Tier Issues](https://github.com/HHS/simpler-grants-gov/issues?q=is%3Aopen+is%3Aissue+label%3A"bounty%3A+XL") |

*Note: Payouts are currently restricted to US citizens and require a W-9 for payments over $600.*

## Core Team

The core team on the grants.gov project is a small group of content strategists, designers, developers, and product managers working for and with the Department of Health and Human Services, and other federal agencies, and community volunteers.

An up-to-date list of core team members can be found in [MAINTAINERS.md](./MAINTAINERS.md). At this time, the project is still building the core team and defining roles and responsibilities. We are eagerly seeking individuals who would like to join the community and help us define and fill these roles.

## Repository Structure

- [./.github](./.github) contains Github specific settings files and testing, linting, and CI/CD workflows
- [./api](./api) contains an API built in Python using the Flask library
- [./bin](./bin) contains scripts for managing infrastructure
- [./documentation](./documentation) contains project guides, documentation, and decision records
- [./frontend](./frontend) contains a web application built using Next.js
- [./infra](./infra) contains Terraform modules and configuration for managing the AWS infrastructure

## Development

### API

Documentation for the API is linked to from the [API README.md](./api/README.md). For installation instructions, see the [development documentation](./documentation/api/development.md).

### Front-end

Documentation and development instructions for the front-end are provided in the [Front-end README.md](./frontend/README.md).

## Contributing

Thank you for considering contributing to an Open Source project of the US
Government! For more information about our contribution guidelines, see
[CONTRIBUTING.md](CONTRIBUTING.md) to learn more and join our community see our [wiki](https://wiki.simpler.hhs.gov).

## Community

To better understand how this project is governed and how to participate beyond code contributions, please review the following community resources:

- [Community Guidelines](./COMMUNITY_GUIDELINES.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Architecture Decision Records](./documentation/architecture/)
