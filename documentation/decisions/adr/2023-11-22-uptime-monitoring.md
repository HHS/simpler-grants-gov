# Uptime Monitoring

- **Status:** Active
- **Last Modified:** 2023-11-22
- **Related Issue:** [#656](https://github.com/HHS/simpler-grants-gov/issues/656)
- **Deciders:** Lucas Brown, Billy Daly, Sammy Steiner, Daphne Gold, Aaron Couch
- **Tags:** Infrastructure, Notifications, Reliability

## Context and Problem Statement

We need a tool for external uptime monitoring of the website and API. We have [internal monitoring](https://github.com/HHS/simpler-grants-gov/blob/main/infra/modules/monitoring/main.tf) setup, but not external. This would be useful for cases in which a load balancer or CDN (if we adopt one) are not operating correctly, or their is a DNS issue with the site.

## Decision Drivers <!-- RECOMMENDED -->

- {driver 1, e.g., a constraint, priority, condition, etc.}
- {driver 2, e.g., a constraint, priority, condition, etc.}
- ...

## Options Considered

- {option 1}
- {option 2}
- ...

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
