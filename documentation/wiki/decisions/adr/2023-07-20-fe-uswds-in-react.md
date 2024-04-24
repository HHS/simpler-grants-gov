# U.S. Web Design System in React

- Status: Accepted
- Deciders: @sawyerh, @aligg, @lorenyu, @rocketnova
- Date: 2022-12-05

Technical Story: #19

## Context and Problem Statement

- The U.S. Web Design System (USWDS) only provides HTML and CSS for its components. It includes a small bit of vanilla JS to add interactivity to some components like the date picker.
- It's common for projects to write their own React components to output the USWDS HTML, to reduce the amount of boilerplate needed to use the USWDS components.
- [Previous research by Kalvin and Shannon](https://docs.google.com/document/d/1KRWzH_wJUPKkFmBlxj6SM2yN3W7Or89Wa4TBVM3Ksog/edit) discovered that Nava engineers and designers universally agreed that being able to use a React USWDS component library when starting new projects would be valuable.

## Considered Options

- Use the existing open source [`react-uswds` library](https://github.com/trussworks/react-uswds)
- Create our own React USWDS component library
- Leave the responsibility to each project team

## Decision Outcome

Add [`react-uswds`](https://github.com/trussworks/react-uswds) as a template dependency, making it available to all teams who use the template. The primary reasons are to avoid reinventing the wheel and because it's overall a well-built and maintained library.

## Pros and Cons of the Options

### Use the existing open source [`react-uswds` library](https://github.com/trussworks/react-uswds)

`react-uswds` is maintained by Truss, another vendor in this space. [A Storybook for it can be found here](https://trussworks.github.io/react-uswds/). Truss also maintains a [USWDS Figma library](https://www.figma.com/community/file/836611771720754351) for designers.

#### Pros

- Includes React components for all USWDS components and patterns.
- Fairly well maintained.
- Intentionally does not include any non-USWDS components.
- Supports USWDS v3 (latest version)
- This was the recommended approach coming out of [Kalvin and Shannon's research](https://docs.google.com/document/d/1KRWzH_wJUPKkFmBlxj6SM2yN3W7Or89Wa4TBVM3Ksog/edit).

#### Cons

- They [pin the `@uswds/uswds` dependency version](https://github.com/trussworks/react-uswds/blob/a0558b69ec5b99903cfa8edddf2d8b058f5e296c/package.json#L52) to a specific version, which means that a project cannot use a newer version of USWDS until `react-uswds` updates it on their end. In practice, this could mean that a project may have delayed access to new component styles or CSS bug fixes that USWDS releases.
- Not necessarily a con, but just to call it out: We've only done a lightweight review of their technical implementation and hygiene — there's testing and linting, no reported a11y issues are open in GitHub or reported in Storybook, but we haven't done a comprehensive review of their code or a full accessibility audit. We're operating on trust in Truss's technical expertise, and an assumption that the outputted HTML markup is close to identical to what USWDS provides, so any a11y issues would likely be on USWDS's end.

### Create our own React USWDS component library

Nava could create our own React USWDS component library, similar to `react-uswds`.

#### Pros

- We'd have full control over the technical approach and wouldn't have a dependency on another vendor to incorporate changes or release new versions.

#### Cons

- Requires more time and effort than using an existing library. We'd have to build and maintain the library.
- Reinventing the wheel. We can always fork `react-uswds` if it no longer meets our needs.

### Leave the responsibility to each project team

This is the current approach. Each project team is responsible for creating their own React components for the USWDS components they need.

#### Pros

- No additional work required from the Platform team.

#### Cons

- Each project team has to spend time and effort building the components or making technical decisions related to how they'll integrate USWDS. Teams then have to write their own tests and fix their own bugs for these components. Overall a potential poor use of time and effort.

## Links

- [Decision to use the USWDS](./0003-design-system.md)
- [Kalvin and Shannon's research](https://docs.google.com/document/d/1KRWzH_wJUPKkFmBlxj6SM2yN3W7Or89Wa4TBVM3Ksog/edit)
  - [Evaluation of `react-uswds`](https://docs.google.com/document/d/1T3eG4oRofDE_NkfL7-xEqS39ORlrXlI8bFYcjGaYoWs/edit)
