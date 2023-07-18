# Front-end Testing & Coverage

- **Status:** Proposed <!-- REQUIRED -->
- **Last Modified:** 2023-07-17 <!-- REQUIRED -->
- **Related Issue:** [183](https://github.com/HHS/grants-equity/issues/183) <!-- RECOMMENDED -->
- **Deciders:** Sammy Steiner, Lucas Brown, Billy Daly <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

Testing is essential in maintaining a stable and healthy codebase and an important part of the developer workflow.

## Decision Drivers <!-- RECOMMENDED -->

- **Robust:** Chosen testing frameworks should have features that offer diverse ways of verifying front-end codebase functionality, reducing the need for intensive manual testing
- **Well-maintained:** Accessible tooling is well-maintained by owners and keeps up with current ecosystems in which it will be integrated.
- **Ease of use:** Achieving high coverage should be attainable. ICs should be able to onboard with the tooling and execute in a reasonable time frame to maintain that coverage.
- **Fast:** Running tests shouldn't take ages.

## Options Considered

### Unit Testing
- Jest
- Mocha

### Visual & Interactive
- Storybook

### End-to-End/Functional Testing
- Cypress

## Decision Outcome <!-- REQUIRED -->

Chosen option: Jest, because it is integrated into the Next.js template application, well-maintained, and lightweight. Importantly, documentation is thorough and helpful information for troubleshooting can be easily accessed.

Chosen option: Storybook, because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

Recommended future consideration: Cypress, because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### [Jest](https://jestjs.io/)

- **Pro**
  - Lightweight, well-supported and documented testing solution
  - Compatible with TypeScript, Node, React
  - Snapshot capabilities to track UI changes
  - Code coverage reporting that can be integrated into [Github Actions](https://github.com/marketplace/actions/jest-coverage-report)
  - Already integrated in Next.js front-end template
  - Built-in mocking & auto-mocking
- **Cons**
  - Reports that snapshot capabilities are not for complicated UIs
  - Auto-mocking reduces performance

### [Mocha](https://mochajs.org/)

- **Pro**
  - Has integration and end-to-end testing capabilities
  - More robust in functionality, offering a wider array of capabilities and helpers
  - Test coverage reporting
  - Well-documented and widely used in Node.js ecosystems
- **Cons**
  - Not as lightweight as alternative, requiring integrating several other libraries
  - Does not support snapshot testing
  - Slower than Jest

### [Storybook](https://storybook.js.org)

- **Pro**

- **Cons**
