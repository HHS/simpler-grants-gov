---
description: User guide for contributing code to our GitHub.
---

# GitHub - Code

GitHub is our primary platform for collaborative software development within the Simpler Grants community. This guide will help you get started and make the most out of your code contribution experience.

{% hint style="info" %}
**Looking for Work?**

Our development team curates "help wanted" issues for open source developers like you to help out with on [GitHub](https://github.com/HHS/simpler-grants-gov/labels/help%20wanted).
{% endhint %}

## Contribution Guidelines

### A. Code style and standards

* Follow the established code style and standards.&#x20;
* Use clear and description variable names, comments and documentation where necessary.

### B. Testing

* Write tests for your code changes to ensure they function as expected
* Run exiting tests and ensure they pass before submitting your pull request

### C. Documentation

* Update any relevant documentation in the README files to reflect changes

## Getting Started

### 1. Create a Fork

Create a new fork of the simpler grants.gov repository for your changes. Fork names should conform to the simpler grants naming convention

```
<github username>/<GitHub Issue #>-simple-ticket-description
```

For example

```
btabaska/1234-updating-api-with-new-header
```

Next, create a feature branch using the following command, replacing feature-branch-name with a name that follows our branch naming schema

```
git checkout -b feature-branch-name
```

### 2. Clone the repository&#x20;

Clone the forked repository to your local machine using the following command:&#x20;

```
git clone https://github.com/<your-github-username>/<repository-name>.git
```

Instruction on setting up the local development environment can be found in the README of the repository.&#x20;

API Development Instructions [API Development Instructions](https://chatgpt.com/c/66fad4c4-0df8-8004-8d1d-2def20e6e3da)

Front End Development Instructions [Front End Development Instructions](https://chatgpt.com/c/66fad4c4-0df8-8004-8d1d-2def20e6e3da)

### 3. Make & Commit changes

Make your desired changes to the codebase using your preferred editor. Once you're done, stage and commit your changes:

```
git add . 
git commit -m "Brief Description of changes"
```

### 4. Push Changes

* Push your changes to your forked repository on GitHub using the following command:

```
git push origin feature-branch-name
```

### 5. Run code quality checks to verify changes

Frontend:

On the frontend of the project we enforce formatting, linting, typescript checks and unit testing before a code change can be accepted.&#x20;

To run frontend tests:

{% code overflow="wrap" %}
```
// run linting to check that lint rules are being met
npm run lint
// run formatting to ensure that document formatting is correct. This will attempt to auto-fix simple issues with formatting
npm run format
// run type checks to ensure that typescript rule requirements are being met
npm run ts:check
// run unit tests to validate that defined component tests are not failing
npm run test 
```
{% endcode %}

API

In the API of the project we enforce formatting, linting and unit tests. These all must pass before code changes can  be accepted.

To run API tests:

{% code overflow="wrap" %}
```
// run linting to check that lint rules are being met
make lint
// run formatting to ensure that document formatting is correct. This will attempt to auto-fix simple issues with formatting
make format
// run unit tests to validate that defined unit tests are not failing
make test
```
{% endcode %}

### 6. Create a Pull Request

a. Navigate to your forked repository on GitHub

b. Click on the Pull Request button

c. Fill out the pull request form

d. Validate that GitHub automated integration testing is not failing. If it is go back and make changes to your code until all tests are passing again.

e. Submit the pull request for review by other developers within the community

\
Example pull request form:

```
## Summary
Fixes #(ISSUE)

### Time to review: ___x mins___
## Changes proposed
> // Update with a short description of what you changed

## Context for reviewers
> // Provide context for the PR reviewer
```

### 7. Review process

#### a. Assign reviewers

* Assign reviewers to your pull request who are knowledgeable about the project and can provide valuable feedback

#### b. Feedback and iteration

* Address any feedback or comments from reviewers promptly
* Make necessary changes and iterate on your code until it meets the projects standard to be accepted
* Once your pull request has been approved it will be merged into the main branch and deployed as necessary.

## Change log

Major updates to the content of this page will be added here.

<table><thead><tr><th>Date</th><th width="246">Update</th><th>Notes</th></tr></thead><tbody><tr><td>2/12/2024</td><td>Initial Content</td><td>Updated with Initial content</td></tr><tr><td>10/3/2024</td><td>Updated content</td><td>Updated content for hackathon</td></tr><tr><td></td><td></td><td></td></tr></tbody></table>
