# Back-end Production Server

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-2i <!-- REQUIRED -->
- **Related Issue:** [#245](https://github.com/HHS/simpler-grants-gov/issues/245) <!-- RECOMMENDED -->
- **Deciders:** Daphne Gold, Sammy Steiner, Billy Daly, Lucas Brown <!-- REQUIRED -->
- **Tags:** ADR <!-- OPTIONAL -->

## Context and Problem Statement

The Flask development server is not meant for production use and only intended for local development. It is not secure, stable, efficient, or scaled for a production environment. In addition to choosing a production server, this ADR will specify a high level implementation option.

## Decision Drivers <!-- RECOMMENDED -->

- **Scalable:** The chosen solution should be configurable to scale and a multi-worker, multi-threaded production-ready, WSGI wrapper.
- **Ease of use:** The production server should be relatively simple to set up and start.
- **Well-maintained:** We have a preference towards a production server that is widely adopted and have active maintainers.

## Options Considered

### Production Server

- Gunicorn
- Waitress

### Implementation

1. API entrypoint responsible for conditional logic determining dev vs prod environment and starting corresponding server
2. Dockerfile executable command for the prod server is overridden in the IaC [task definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html), API by default starts dev server
3. Dockerfile executable command for the dev server is overridden in `docker-compose.yml`, API by default starts prod server

Note: Gunicorn can be set up either using their unique [configuration file](https://docs.gunicorn.org/en/latest/configure.html) or in our code using separate app entry points for dev and prod. We want to make sure we are scaling the appropriate number of workers based on CPU.

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
  - Does not run on Windows without WSL 🧐

#### [Waitress](https://github.com/Pylons/waitress)

- **Pros**
  - Simple, lightweight
  - Can run on Windows as well as UNIX systems
  - No dependencies that aren't part of the standard Python library
  - Purely Python
- **Cons**
  - Runs on CPython and has "very acceptable performance"

### Implementation

#### #1 API entrypoint responsible for conditional logic determining dev vs prod environment and starting corresponding server

- **Pros**
  - This is how the Flask app is already configured (small lift to modify)
- **Cons**
  - Poor separation of concerns: apps remaining environment agnostic keeps them much simpler overall
  - Can lead to confusing environment conditional logic

#### #2 Dockerfile executable command for the prod server is overridden in the IaC [task definition](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/task_definition_parameters.html), API by default starts dev server

- **Pros**
  - Terraform handles our infrastructure and deployments, therefore conceptually makes sense to define Docker run commands in the task definition
- **Cons**
  - Ignores `docker-compose.yml` for local development as a tool we have at our disposal
  - Obscures prod server run command outside app ecosystem in IaC
  - Implementation could potentially use separate app entry points for dev and prod

#### #3 Dockerfile executable command for the dev server is overridden in `docker-compose.yml`, API by default starts prod server

- **Pros**
  - Local development is done via `docker-compose.yml` config, so it makes a ton of conceptual sense to pass a local Docker run command here
- **Cons**
  - Implementation could potentially use separate app entry points for dev and prod
