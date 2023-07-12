# Front-end Framework

- **Status:** Draft <!-- REQUIRED -->
- **Last Modified:** 2023-07-11 <!-- REQUIRED -->
- **Related Issue:** [#97](https://github.com/HHS/grants-api/issues/97) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sammy Steiner <!-- REQUIRED -->

## Context and Problem Statement

The project will need a web framework to build and manage the frontend. The goal of this ADR is to evaluate and select a frontend web framework.

## Decision Drivers <!-- RECOMMENDED -->

### Must Haves
- Active Maintenance: The web framework is actively maintained with patches and minor releases delivered on a regular basis
- Community of Users: The web framework has an active community of open source users and the framework is commonly used for frontend development
- Usability: The framework is relatively easy to learn for developers without prior experience and there are plenty of resources and training materials available
- Static Site Generation: The framework can generate static pages (HTML/CSS + JavaScript) at build time that can be cached in a CDN for faster loading
- Server-Side Rendering: The framework can render some pages server-side with every request to get up-to-date information when the page loads
- Client-side Rendering: The framework also supports rendering or modifying content client-side based on user interaction with the page (e.g. filtering, searching, etc.)

### Nice to Have
- AuthN/AuthZ: The framework supports Authentication & Authorization routing natively or there are established extensions that provide this functionality
- Internationalization (i18n): The framework supports localized routing for different languages natively or there are established extensions that provide this functionality
- Middleware: The framework supports other types of middleware (i.e. functions or scripts that execute before a routing request is complete)

## Options Considered

- Create React App
- Next.js
- Vue.js or Nuxt.js
- Svelte or Sveltekit

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### Create React App

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Next.js

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Vue.js or Nuxt.js

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Svelte or Sveltekit

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

## Links <!-- OPTIONAL -->

- [{Link name}](link to external resource)
- ...
