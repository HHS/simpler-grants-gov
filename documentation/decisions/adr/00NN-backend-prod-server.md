# Back-end Production Server

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-24 <!-- REQUIRED -->
- **Related Issue:** [#245](https://github.com/HHS/grants-equity/issues/245) <!-- RECOMMENDED -->
- **Deciders:** Daphne Gold, Sammy Steiner, Billy Daly, Lucas Brown <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

The Flask development server is not meant for production use and only intended for local development. It is not secure, stable, efficient, or scaled for a production environment. In addition to choosing a production server, this ADR will specify a high level implementation option.

## Decision Drivers <!-- RECOMMENDED -->
- **Scalable:** The chosen solution should be configurable to scale and a multi-worker, multi-threaded production-ready WSGI wrapper.
- **Ease of use:** The production server should be relatively simple to set up and start.
- **Well-maintained:** We have a preference towards a production server that is widely adopted and have active maintainers.

## Options Considered

### Production Server
- Gunicorn
- Waitress

### Implementation
1. API `main()` responsible for determining dev vs prod environment and starting server
2. Dockerfile executable command for the prod server overridden in [task definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html), API by default starts dev server
3. Dockerfile executable command for the dev server is overridden in `docker-compose.yml`, API by default starts prod server

Note: In all instances above it is preferable that the production server configuration live in code, rather than as a command directly in the Dockerfile. The reasoning is that this gives us a chance to scale our workers and threads appropriately using information like CPU count.

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### {option 1}

{example | description | pointer to more information | ...} <!-- OPTIONAL -->

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### {option 2}

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
