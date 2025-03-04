# Front-end Code Quality Tools

- **Status:** Active
- **Last Modified:** 2023-07-17 <!-- REQUIRED -->
- **Related Issue:** [#102](https://github.com/HHS/simpler-grants-gov/issues/102) <!-- RECOMMENDED -->
- **Deciders:** Aaron Couch, Daphne Gold, Sammy Steiner, Gina Carson, Lucas Brown, Billy Daly <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

Front-end code quality tools should facilitate and efficiently enforce linting, auto-formatting, type-checking and security concerns. They should be easily configurable to suit our specific use-cases, uniformly applying conventions while alleviating the need for individual intervention.

## Decision Drivers <!-- RECOMMENDED -->

- **Ease of use and configurability:** Code quality tools should be configurable to meet the specific needs of our project and enforce standards uniformly. Running the tool should be simple, and feedback should be easily implementable and understandable.
- **Speed:** Code quality tools should be able to run in an timely manner, ideally in a pre-commit hook.
- **Documentation and resources:** Code quality tools should have robust and helpful documentation, specifically around usage and configuration.
- **Lean:** Selection of code quality tools should cover all use-cases with little overlap for ease of use and to minimize mental surface area required to understand the system. As in, each tool should have a specific, meaningful purpose.
- **Enforces security:** Tooling should assist us in identifying security concerns and vulnerabilities.
- **Well-maintained:** We have a preference towards libraries that are widely adopted and have active maintainers.

## Options Considered

1. Use a curated collection of JavaScript libraries from Next.js template repository (described below)
2. Use a different or modified set of JavaScript libraries

### Dependency Management

**[npm](https://www.npmjs.com/):** Package manager for Node.js.

- npm is a robust package manager that is pre-bundled with Node, simplifying installation steps
- Maintained by Github/Microsoft

### Code Linting

**[ESLint](https://eslint.org/):** Statically analyzes your code to quickly find problems.

- Supported by a huge variety of editors and easy to integrate into CI/CD pipeline
- Very long-standing project, hugely popular, and well-supported tool

### Auto-formatting

**[Prettier](https://prettier.io/):** Enforces code style and consistency while reducing the need for manual formatting or nitpicking.

- Top pick in many JavaScript repositories as a well-maintained formatting tool

### Type Checking

**[TypeScript](https://www.typescriptlang.org/):** Strongly typed programming language that builds on JavaScript

- Converts to JavaScript, therefore works everywhere JavaScript is compatible
- Static-type checking built into language
- Identifies problems early at compile time
- Open source and maintained by Microsoft

### Dependency Checks

**[Renovate](https://docs.renovatebot.com/):** Automated dependency updates.

- Free and open source
- Can batch, schedule, auto-assign and auto merge updates
- Multi-language and supports Python as well

_Note: Do we need the Safety package for our Python code as well or is this sufficient?_

### License Checking[^*]

**[License Checker](https://www.npmjs.com/package/license-checker):** Very aptly named tool to check licenses for dependencies. Can fail on specified input, a semicolon separated list.

## Decision Outcome <!-- REQUIRED -->

Option #1 is preferred. The tooling chosen in the template repository suits our needs, with the addition of License Checker.

# Other Options

**Dependency Management:**

[Yarn](https://yarnpkg.com/): Functionally similar to npm, however, requiring more steps to integrate into a project.

**Type Checking:**

[Flow](https://flow.org/): Static type checker maintained by Facebook, added to project as a dependency. Uses a special type syntax that is removed from code at compile time.

[Immutible](https://immutable-js.com/): Provides a set of persistent, immutible data structures. Preferred to start with TypeScript and see if that suits our needs as it comes with immutible functionality out of the box.

**Dependency Checks:**

[Dependabot](https://github.com/dependabot): Can easily switch to from Renovate at any time.

[^*]: Addition to the existing curated collection
