# Grants Equity

A modernization effort for Grants.gov.

## About the Project

Our vision is for the following to become true:

Grants.gov is the simplest, most inclusive, and most gratifying way to find and apply for financial assistance ever built, inside or outside the federal government.

Grants.gov helps ensure that no communities are underserved by the federal government.

See [goals.md](./documentation/goals.md) for more information about the vision and goals for the project.

## Core Team

The core team on the project is a small group of designers, developers, product managers, and more  working for an with the Department of Health and Human Services and other federal agencies.

An up-to-date list of core team members can be found in [MAINTAINERS.md](./MAINTAINERS.md). At this time, the project is still building the core team and defining roles and responsibilities. We are eagerly seeking individuals who would like to join the community and help us define and fill these roles. 

## Repository Structure

- [./github](./github) contains Github specific settings files and testing, linting, and CI/CD workflows
- [./api](./api) contains an API built in Python using the Flask library
- [./bin](./bin) contains scripts for managing infrastructure
- [./documentation](./documentation) contains project guides, documentation, and decision records
- [./frontend](./frontend) contains a web application built using Next.js
- [./infra](./infra) contains Terraform modules and configuration for managing the infrastructure

## Development

### API

Documentation for the API is linked to from the [API README.md](./api/README.md). For installation instructions, see the [development documentation](./documentation/api/development.md).

### Front-end

Documentation and development instructions for the front-end are provided in the [Front-end README.md](./frontend/README.md).

### Testing

#### Configuring pre-commit hooks

To promote consistent code style and quality, we use git pre-commit hooks to
automatically lint and reformat our code before every commit we make to the codebase.

Pre-commit hooks are defined in the file [`.pre-commit-config.yaml`](./.pre-commit-config.yaml).

1.  First, install [`pre-commit`](https://pre-commit.com/) globally:

        $ brew install pre-commit

2.  While in the root `grants-equity` directory, run `pre-commit install` to install
    the specific git hooks used in this repository.

Now, any time you commit code to the repository, the hooks will run on all modified files automatically. If you wish, you can force a re-run on all files with `pre-commit run --all-files`.

## Contributing

Thank you for considering contributing to an Open Source project of the US
Government! For more information about our contribution guidelines, see
[CONTRIBUTING.md](CONTRIBUTING.md)

## Security

For more information about our Security, Vulnerability, and Responsible
Disclosure Policies, see [SECURITY.md](SECURITY.md).

## Authors and Maintainers

For more information about our Authors and maintainers, see [MAINTAINERS.md](MAINTAINERS.md).

A full list of [contributors](https://github.com/HHS/grants-equity/graphs/contributors?type=a) can be found on GitHub.

## Public domain

This project is licensed within in the public domain within the United States,
and copyright and related rights in the work worldwide are waived through the
[CC0 1.0 Universal public domain
dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By
submitting a pull request or issue, you are agreeing to comply with this waiver
of copyright interest.
