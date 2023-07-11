# Front-end Code Quality Tools

- **Status:** Proposed <!-- REQUIRED -->
- **Last Modified:** 2023-07-11 <!-- REQUIRED -->
- **Related Issue:** [#102](https://github.com/HHS/grants-api/issues/102) <!-- RECOMMENDED -->
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

1. Use a curated collection of Python libraries from Next.js template repository (described below)
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
- Static-type checking build into language
- Identifies problems early at compile time
- Open source and maintained by Microsoft

### Security

### License Checking

### Interface


## Decision Outcome <!-- REQUIRED -->

TBD.

# Other Options

**Dependency Management:**  
[Yarn](https://yarnpkg.com/): Functionally similar to npm, however, requiring more steps to integrate into a project.  

**Type Checking:**  
[Flow](https://flow.org/): Static type checker maintained by Facebook, added to project as a dependency. Uses a special type syntax that is removed from code at compile time.  