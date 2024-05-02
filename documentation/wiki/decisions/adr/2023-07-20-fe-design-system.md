# Use U.S. Web Design System for components and utility classes

- Status: Accepted
- Deciders: Loren Yu, Rocket Lee, Sawyer Hollenshead

## Context and Problem Statement

Projects should avoid reinventing the wheel where possible. A common place to do this is in the UI, by using a design system for frontend components and utility classes. This can help avoid inconsistencies in the UI, and can reduce barriers for new developers.

We want to use a design system that is:

- Section 508 compliant
- Open source
- Well maintained and documented
- Includes the typical components and design patterns needed for government websites

## Considered Options

- [U.S. Web Design System (USWDS)](https://designsystem.digital.gov/)
- [CMS Design System](https://design.cms.gov/)

## Decision Outcome

The template will provide U.S. Web Design System styling out of the box.

We will not follow their [install directions](https://designsystem.digital.gov/documentation/getting-started/developers), which suggests using Gulp as a task runner. Instead, to reduce the number of dependencies and configuration, we'll leverage Next.js's and Storybook's built-in Sass support. Copying the USWDS static assets into the project will be handled by a [`postinstall`](https://docs.npmjs.com/cli/v8/using-npm/scripts) script in `package.json`.

### Positive Consequences

- USWDS is the most popular design system for U.S. government websites and is maintained by GSA employees. It is the recommended way to meet the website standards detailed in the [21st Century Integrated Digital Experience Act](https://digital.gov/resources/21st-century-integrated-digital-experience-act/). [More key benefits can be read about here](https://designsystem.digital.gov/about/key-benefits/).
- [Project teams can theme the USWDS](https://www.navapbc.com/insights/us-web-design-system) if their project needs to match an existing brand.

### Negative Consequences

- Unlike the CMS Design System, USWDS doesn't provide React components. Project teams will need to create their own React components that output USWDS markup, or install a third-party library like [`react-uswds`](https://github.com/trussworks/react-uswds). In the future, [the template could include this library by default](https://github.com/navapbc/template-application-nextjs/issues/19).
- CMS projects may need to swap out USWDS for the CMS Design System, although the CMS Design System is based on USWDS, so this may not be necessary right away.

## Links

- [Previous research was done by Kalvin Wang and Shannon Alexander Navarro related to USWDS React libraries](https://docs.google.com/document/d/1KRWzH_wJUPKkFmBlxj6SM2yN3W7Or89Wa4TBVM3Ksog/edit)
