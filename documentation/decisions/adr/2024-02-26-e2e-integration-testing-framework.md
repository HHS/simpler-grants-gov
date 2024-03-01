# E2E / Integration Testing Framework

- **Status:** Accepted
- **Last Modified:** 2024-02-26
- **Related Issue:** [#1337](https://github.com/HHS/simpler-grants-gov/issues/1337)
- **Deciders:** Billy Daly, Ryan Lewis
- **Tags:** e2e, integration, testing

## Context and Problem Statement

An end-to-end (E2E) testing framework can be used to programmatically test specific flows against the entire application. The goal of E2E testing is to simulate scenarios users will encounter in as close to a production-like environment as possible. This ADR is meant to to evaluate E2E frameworks based on the factors outlined below.

## Decision Drivers

- **Speed:** Tests should be able to be run efficiently regardless of where they will be run (e.g. as part of a continuous integration workflow or during local development).
- **Developer experience:** The E2E framework should provide robust documentation and resources, including thorough configuration instructions and debugging tooling to easily identify how tests are failing or are potentially flakey.
- **Well-maintained:** The E2E framework is well-maintained by owners and keeps up with current ecosystems in which it will be integrated.
- **Ease of use**: Individual contributors should be able to quickly and effectively write new tests to verify functionality for specific user flows.

## Considered Options

* [Cypress](https://www.cypress.io/)
* [Playwright](https://playwright.dev/)

## Decision Outcome

Playwright's modern syntax, variety of tracing tools, and speed makes for an ideal developer experience, which increases in the case that a developer's IDE of choice is VS Code. It also supports a variety of browsers and platforms and efficiently spins up new browser contexts for each test. Cypress has considerable documentation and an extensive commmunity, which more than makes up for how it handles async/sync code. If there isn't a specific need that warrants E2E tests be run in browser or adversion to a Microsoft-backed open-source project, then the performance gains that Playwright offers is reason enough to choose it as the E2E framework.

## Pros and Cons of the Options

### Cypress

#### Pros
- Runs in browser, which means test code is evaluated with JavaScript as opposed to Node or another server-side language and there's native access to whatever portion of the application is being tested
- Extensive support for reusability, including creating shortcuts to recreating specific application states
- Plenty of examples and tutorials to refer to as this framework has been in existence for many years

#### Cons
- Runs in browser, which means interacting with a DB or other backend service requires extra work. For instance, methods would need to be exposed in order to seed a DB.
- Cypress handles chains of commands such that mixing async and sync code is difficult to read and understand without familiarity of its syntax (e.g. promise chaining as opposed to a more readable async/await approach)
- Limited iFrame, multiple tabs, and hover support
- Testing on Safari browsers is experimental and relies on Playwright

### Playwright

#### Pros
- Tests are run in parallel by default and benchmark speeds outpace Cypress
- Can run tests in headless, headed, or UI mode depending on use case and on Windows, Linux, and macOS with support for Chromium, WebKit and Firefox
- Supports native mobile emulation of Google Chrome for Android and Mobile Safari
- Backed by Microsoft and has a powerful VS Code extension to debug tests within the IDE
- Uses async/await syntax and locator methods return elements

#### Cons
- Many of the debugging and ease-of-use functionality leverages VS Code, which means developers who prefer another IDE might be less effective at debugging tests

## Links

- [Next.js Testing Overivew](https://nextjs.org/docs/app/building-your-application/testing)
- [Cypress vs Selenium vs Playwright vs Puppeteer speed comparison](https://www.checklyhq.com/blog/cypress-vs-selenium-vs-playwright-vs-puppeteer-speed-comparison/)
- [Playwright vs. Cypress](https://www.qawolf.com/blog/why-qa-wolf-chose-playwright-over-cypress)
