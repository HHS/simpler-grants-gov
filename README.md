# [Simpler.Grants.gov](https://simpler.grants.gov/)

A modernization effort for [Grants.gov](https://grants.gov/)

## About the Project

We want Grants.gov to be an extremely simple, accessible, and easy-to-use tool for posting, finding, sharing, and applying for federal financial assistance. Our mission is to increase access to grants and improve the grants experience for everyone. We’re improving the way applicants search for and discover funding opportunities, making it easier to find and apply. For federal grantmaking agencies, we’re making it easier for their communities to find the funding they need.

Go to [Simpler.Grants.gov](https://simpler.grants.gov/) to learn about our transparent process and what we’re doing now, or explore our existing user research and the findings that are guiding our work.

See [goals.md](./documentation/goals.md) for more information about the vision and goals for the project.

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
- [Project Wiki](https://wiki.simpler.hhs.gov)

## Security

For more information about our Security, Vulnerability, and Responsible
Disclosure Policies, see [SECURITY.md](SECURITY.md).

## Authors and Maintainers

For more information about our Authors and maintainers, see [MAINTAINERS.md](MAINTAINERS.md).

A full list of [contributors](https://github.com/HHS/simpler-grants-gov/graphs/contributors) can be found on GitHub.

## Public domain

This project is licensed within in the public domain within the United States,
and copyright and related rights in the work worldwide are waived through the
[CC0 1.0 Universal public domain
dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By
submitting a pull request or issue, you are agreeing to comply with this waiver
of copyright interest.

## Bounty: $200 — L

This bounty is for contributors who are interested in making a meaningful impact on the **Simpler.Grants.gov** project. The task involves addressing a specific issue that is labeled as **L** (Low complexity) and is worth **$200**. The goal is to ensure that the change meets the acceptance criteria and is well-documented for both users and developers.

### In Scope

The task is focused on implementing a specific feature or fixing a bug that is clearly defined in the issue description. This includes modifying existing code, adding new functionality, or improving the user experience. The exact scope is outlined in the "In scope" section of the issue, and contributors should ensure that their work aligns with this.

### Out of Scope

Any changes that fall outside the defined scope, such as refactoring unrelated code, improving performance without specific requirements, or modifying third-party libraries, are not part of this bounty. Contributors should avoid making changes that are not explicitly requested.

### Suggested Starting Points

To get started, contributors should review the following files and directories:

- **Files**: Look for files that are related to the functionality or bug mentioned in the issue. These may include Python scripts in the `api` directory or frontend components in the `frontend` directory.
- **Tests**: Ensure that all existing tests continue to pass after making changes. If new behavior is introduced, new tests should be added to cover it.
- **Docs**: Update any relevant documentation, including READMEs, API references, or user guides, to reflect the changes made.
- **Related PRs / Issues**: Check for any related pull requests or issues that may provide additional context or guidance.

### Example: Adding a New API Endpoint

If the task involves adding a new API endpoint, the following Python code demonstrates how to implement this using Flask:

```python
from flask import Flask, jsonify, request
from flask_restx import Resource, Api

app = Flask(__name__)
api = Api(app)

@api.route('/api/new-endpoint')
class NewEndpoint(Resource):
    def get(self):
        return jsonify({"message": "This is a new endpoint"})

    def post(self):
        data = request.get_json()
        return jsonify({"received": data}), 201
```

This example shows a basic structure for a new endpoint that supports both GET and POST requests. Ensure that the endpoint is properly documented and that tests are written to validate its behavior.

### Documentation and Testing

All changes must be accompanied by updated documentation. If the change affects the user experience or introduces new functionality, update the relevant sections in the `documentation` directory. Additionally, ensure that all existing tests pass and that new tests are added to cover the new behavior.

By following these guidelines, contributors can ensure that their work meets the quality standards of the **Simpler.Grants.gov** project and contributes effectively to the open-source community.
