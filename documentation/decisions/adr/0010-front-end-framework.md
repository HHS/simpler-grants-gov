# Front-end Framework

- **Status:** Draft <!-- REQUIRED -->
- **Last Modified:** 2023-07-13 <!-- REQUIRED -->
- **Related Issue:** [#97](https://github.com/HHS/grants-api/issues/97) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sammy Steiner, Daphne Gold <!-- REQUIRED -->

## Context and Problem Statement

The project will need a web framework to build and manage the frontend. The goal of this ADR is to evaluate and select a frontend web framework.

## Decision Drivers <!-- RECOMMENDED -->

### Must Haves
- Active Maintenance: The web framework is actively maintained with patches and minor releases delivered on a regular basis
- Community of Users: The web framework has an active community of open source users and the framework is commonly used for frontend development
- Usability: The framework is relatively easy to learn for developers without prior experience in the particular framework, and there are plenty of resources and training materials available
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

Chosen option: Next.js, because this option meets all our technical requirements, has a large community of support, is easy to learn with good documentation, and is well understood by Nava.

### Positive Consequences <!-- OPTIONAL -->

- We can use the Nava Next.js template to get started quickly

### Negative Consequences <!-- OPTIONAL -->

- We'll need to modularize our code so that if Next.js ever loses support, we can swap it out

## Pros and Cons of the Options <!-- OPTIONAL -->

### Create React App

Create React App is a lightweight, client side, single page application framework for React, maintained by Facebook. While it is one of the most widely adopted react frameworks, it seems like Facebook has either stopped or will stop supporting it in the near future, as it has been [removed as a suggested framework from the react website](https://github.com/reactjs/react.dev/pull/5487).

- **Pros**
  - One of the earliest react frameworks
  - Widely used and understood
- **Cons**
  - Either has or will stop receiving support
  - No longer recommended by react

### Next.js

Next.js is a popular full stack framework for static and server‑rendered applications built with React and can [prerender pages it determines are static automagically](https://nextjs.org/docs/pages/building-your-application/rendering/automatic-static-optimization) alongside server rendered routes to improve performance. It includes styling and routing solutions out of the box, is optimized for performance and SEO, and provides great developer documentation and support. Next.js is maintained by Vercel, a PaaS for frontend hosting company.

- **Pros**
  - Popular framework with dedicated support
  - Supports static site generation, server side rendering, and client side rendering
  - Easy to learn and use with good documentation
- **Cons**
  - Very opinionated framework, especially with routing which can reduce flexibility

### Vue.js or Nuxt.js

Vue.js is an open-source, JavaScript framework for building progressive user interfaces that also supports server side rendering. It was created by Evan You in 2014 and has grown in popularity, thanks to its reactive data binding and component-based architecture. Nuxt.js provides a set of conventions and tools for building Vue.js applications, including automatic code splitting, prefetching, and caching.

- **Pros**
  - Static site generation is easy out of the box
  - Code splitting helps reduce package sizes and makes caching easier
- **Cons**
  - Small community of support
  - Scalability 

### Svelte or Sveltekit

Svelte is a JavaScript, front-end compiler that turns declarative and easy to understand JavaScript code into highly efficient JavaScript code optimized for the browser. In contrast to the React framework, SvelteKit, uses a "compiler-first" approach to add server side rendering capabilities to Svelte, eliminating the need for a virtual DOM, improving performance, and reducing bundle size. 

- **Pros**
  - Fast, performant, and very scalable
  - Not opinionated and very flexible
- **Cons**
  - Relatively new framework, with fewer resources and plugins than React
  - Steeper learning curve, since many JavaScript developers are used to React
  - Small community
  - Limited documentation

## Links <!-- OPTIONAL -->

- [React removing create react app from its recommendations](https://github.com/reactjs/react.dev/pull/5487)
