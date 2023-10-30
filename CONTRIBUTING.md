<!--- # NOTE: Modify sections marked with `TODO` and then rename the file.-->

# How to Contribute as an External Contributor

🎉 First off, thanks for taking the time to contribute! 🎉

We're so thankful you're considering contributing to an [open source project of the U.S. government](https://code.gov/)! If you're unsure about anything, just ask -- or submit the issue or pull request anyway. The worst that can happen is you'll be politely asked to change something. We appreciate all friendly contributions.

We encourage you to read this project's CONTRIBUTING-EXTERNAL policy (you are here), its [LICENSE](LICENSE.md), and its [README](README.md).

> :information_source: This project initiated in third quarter of 2023, and is just ramping up efforts to include code contributors as well as contributors from many other disciplines in many different capacities.

## How Can I Contribute?

There are a number of ways to contribute to this project.

### Report a Bug

If you think you have found a bug in the code or static site, [search our issues list](https://github.com/HHS/simpler-grants-gov/issues) on GitHub for any similar bugs. If you find a similar bug, please update that issue with your details.

If you do not find your bug in our issues list, file a bug report. When reporting the bug, please follow these guidelines:

- **Please use the [Bug Report](https://github.com/HHS/simpler-grants-gov/issues/new?assignees=octocat&labels=bug&projects=&template=bug_report.yml&title=%5BBug%5D%3A+) issue template** This is populated with information and questions that will help grants.gov developers resolve the issuethe right information
- **Use a clear and descriptive issue title** for the issue to identify the problem.
- **Describe the exact steps to reproduce the problem** in as much detail as possible. For example, start by explaining how you got to the page where you encountered the bug and what you were attempting to do when the bug occurred.
- **Describe the behavior you observed after following the steps** and point out what exactly is the problem with that behavior.
- **Explain which behavior you expected to see instead and why.**
- **Include screenshots and animated GIFs** if possible, which show you following the described steps and clearly demonstrate the problem.
- **If the problem wasn't triggered by a specific action**, describe what you were doing before the problem happened.

### Suggest an Enhancement

If you don't have specific language or code to submit but would like to suggest a change, request a feature, or have something addressed, you can open an issue in this repository.

Please open an issue of type [Feature request](https://github.com/HHS/simpler-grants-gov/issues/new?assignees=octocat&labels=enhancement&projects=&template=feature_request.yml&title=%5BFeature+Request%5D%3A+):

In this issue, please describe the use case for the feature you would like to see -, what you need, why you need it, and how it should work. Team members will respond to the Feature request as soon as possible. Often, Feature request suggestions undergo a collaborative discussion with the community to help refine the need for the feature and how it can be implemented.

### Non-Technical Contributions

#### Documentation

To contribute to documentation you find in this repository, feel free to use the GitHub user interface to submit a pull request for your changes. Find more information about using the GitHub user interface for PRs here.

### Contribute to community discussions

> 🚧 Tools and expanding avenues for community engagement are coming soon.

### Sharing your story

Sharing how you or your organization have used the Grants Equity project is an important way for us to raise awareness about the project and its impact. Please tell us your story by [sending us an email at `simpler-grants-gov@hhs.gov`](mailto:simpler-grants-gov@hhs.gov).

## Code Contributions

The following guidelines are for code contributions. Please see [DEVELOPMENT.md](./DEVELOPMENT.md) for more information about the software development lifecylce on the project.

### Getting Started

This project is monorepo with several apps. Please see the [api](./api/README.md) and [frontend](./frontend/README.md) READMEs for information on spinning up those projects locally. Also see the project [documentation](./documentation) for more info.

### Workflow and Branching

This project follows [trunk-based development](./DEVELOPMENT.md#branching-model), so all contributions are directed toward the `main` branch.

1.  Fork the project
1.  Check out the `main` branch
1.  Create a feature branch
1.  Write code and tests for your change
1.  From your branch, make a pull request against `hhs/simpler-grants-gov/main`
1.  Work with repo maintainers to get your change reviewed
1.  Wait for your change to be pulled into `hhs/simpler-grants-gov/main`
1.  Delete your feature branch

### Testing, Coding Style and Linters

Each application has its own testing and linters. Every commit is tested to adhere to tests and the linting guidelines. It is recommended to run tests and linters locally before committing.

### Issues

External contributors should use the _Bug Report_ or _Feature Request_ [issue templates](https://github.com/HHS/simpler-grants-gov/issues/new/choose).

### Pull Requests

Pull requests should follow the conventions in [DEVELOPMENT.md](./DEVELOPMENT.md) with the following changes:

1. Pull requests should be titled with `[Issue N] Description`. However if there is no issue, use `[External] Description` format.
1. External contributors can't merge their own PRs, so an internal team member will pull in after changes are satisfactory.

## Policies

### Open Source Policy

We adhere to the [HHS Open Source Policy](https://github.com/CMSGov/cms-open-source-policy). If you have any questions, just [shoot us an email](mailto:equityingrants@hhs.gov?subject=Question About Open Source Policy).

### Security and Responsible Disclosure Policy

The Department of Health and Human Services is committed to ensuring the security of the American public by protecting their information from
unwarranted disclosure. We want security researchers to feel comfortable reporting vulnerabilities they have discovered so we can fix them and keep our users safe. We developed our disclosure policy to reflect our values and uphold our sense of responsibility to security researchers who share their expertise with us in good faith.

_Submit a vulnerability:_ Unfortunately, we cannot accept secure submissions via email or via GitHub Issues. Please use our website to submit vulnerabilities at [https://hhs.responsibledisclosure.com](https://hhs.responsibledisclosure.com). HHS maintains an acknowledgements page to recognize your efforts on behalf of the American public, but you are also welcome to submit anonymously.

Review the HHS Disclosure Policy and websites in scope:
[https://www.hhs.gov/vulnerability-disclosure-policy/index.html](https://www.hhs.gov/vulnerability-disclosure-policy/index.html).

This policy describes _what systems and types of research_ are covered under this policy, _how to send_ us vulnerability reports, and _how long_ we ask security researchers to wait before publicly disclosing vulnerabilities.

If you have other cybersecurity related questions, please contact us at [csirc@hhs.gov](mailto:csirc@hhs.gov).

## Public domain

This project is in the public domain within the United States, and copyright and related rights in the work worldwide are waived through the [CC0 1.0 Universal public domain dedication](https://creativecommons.org/publicdomain/zero/1.0/).

All contributions to this project will be released under the CC0 dedication. By submitting a pull request or issue, you are agreeing to comply with this waiver of copyright interest.
