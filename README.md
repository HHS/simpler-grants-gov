# Grants.gov modernization

A modernization effort for Grants.gov.

## Getting Started

### Agency Mission

### Team Mission

### Project Vision

### Project Information
<!-- Example Innersource Project Info
 * [Project Website](https://cms.gov/digital-service-cms)
 * [Project Documentation:](https://confluence.cms.gov/)
 * [Project Sprint/Roadmap:](https://jira.cms.gov/)
 * [Project Slack Channel:](https://cmsgov.slack.com/archives/XXXXXXXXXX)
 * [Project Tools/Hosting/Deployment:](https://confluence.cms.gov)
 * Project Keyword(s) for Search: KEYWORD1, KEYWORD2
 * Project Members:
    * Team Lead, PO, Delivery Lead, Approvers, Trusted Committers etc.
-->

<!-- Example Open Source Info
 * [Project Website](https://cms.gov/digital-service-cms)
 * [Project Documentation:](https://confluence.cms.gov/)
 * Public Contact: opensource@cms.hhs.gov (**NOTE: Do not use individual/personal email addresses**)
 * Follow [@CMSgov](https://twitter.com/cmsgov) on Twitter for updates.
-->

### Installation

<!--- Example Install Instructions

1. Clone the repo

    `git clone https://github.com/cmsgov/PROJECT_REPO.git`

1. Setup your development environment

    `python -m venv venv`

1. Install project dependencies

    `pip install -r requirements.txt`

    `yarn install package.json`

1. Run the test suite

    `pytest tests/tox.ini`

1. Start the webserver

    `make start`

1. Visit [localhost:9001](https://localhost:9001) to view the server
-->

### Setting up development tools 

#### Configuring pre-commit hooks

To promote consistent code style and quality, we use git pre-commit hooks to
automatically lint and reformat our code before every commit we make to the codebase.
Pre-commit hooks are defined in the file [`.pre-commit-config.yaml`](../.pre-commit-config.yaml).

1.  First, install [`pre-commit`](https://pre-commit.com/) globally:

        $ brew install pre-commit

2.  While in the root `grants-equity` directory, run `pre-commit install` to install
    the specific git hooks used in this repository.

Now, any time you commit code to the repository, the hooks will run on all modified files automatically. If you wish, you can force a re-run on all files with `pre-commit run --all-files`.

### Testing

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
