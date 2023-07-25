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

Because of this, options #2 and #3, local development will always bypass `main()` and directly start the app. This is because `main()` will be configured for the production server implementation.

## Decision Outcome <!-- REQUIRED -->

### Production Server

Chosen option: Gunicorn, because it is the industry standard, well-supported and documented.

### Implementation

Chosen option: #3 Dockerfile executable command for the dev server is overridden in `docker-compose.yml`, API by default starts prod server. This is because it makes the most sense in our current development ecosystem and abstracts away the concept of environment in the API layer.

## Pros and Cons of the Options <!-- OPTIONAL -->

### Production Server
#### [Gunicorn](https://gunicorn.org/)

- **Pros**
  - Widely used, industry standard Python server
  - Excellent ability to manage workers
  - Simple and light on resources, written in C
  - Highly compatible with most Python tooling
- **Cons**
  - Does not run on Windows 🧐

#### [Waitress](https://github.com/Pylons/waitress)

- **Pros**
  - Simple, lightweight
  - Can run on Windows as well as UNIX systems
  - No dependencies that aren't part of the standard Python library
  - Purely Python
- **Cons**
  - Runs on CPython and has "very acceptable performance"

### Implementation
#### #1

- **Pros**
  - This is how the Flask app is already configured (small lift to modify)
- **Cons**
  - Poor separation of concerns: apps remaining environment agnostic keeps them much simpler overall
  - Can lead to confusing environment conditional logic

#### #2

- **Pros**
  - Terraform handles our infrastructure and deployments, therefore conceptually makes sense to define Docker run commands in the task definition
- **Cons**
  - Ignores `docker-compose.yml` for local development as a tool we have at our disposal
  - Obscures prod server run command outside app ecosystem in IaC
  - Requires separate entrypoint to application for development mode

#### #3

- **Pros**
  - Local development is done via `docker-compose.yml` config, so it makes a ton of conceptual sense to pass a local Docker run command here
- **Cons**
  - Requires separate entrypoint to application for development mode
