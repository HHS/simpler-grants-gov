# Logging and Monitoring Platform

- **Status:** Active
- **Last Modified:** 2024-03-04
- **Related Issue:** [#630](https://github.com/HHS/simpler-grants-gov/issues/630)
- **Deciders:** Lucas and/or Billy

## Context and Problem Statement

We want to decide on our long-term logging and monitoring platform. The platform should meet a wide variety of needs, and be highly usable when meeting those needs.

## Decision Drivers

- Platform UX: we want a platform that is easy to use and learn, for a variety of roles in the organization
- Capabilities: we want a platform that satisfies a variety of production operations needs
- Cost: we want a cost-effective platform
- (...?)

## Options

- Cloudwatch
- Sentry
- Datadog
- New Relic
- Splunk
- Grafana

### Cloudwatch

Cloudwatch is a built-in monitoring platform that comes for free with AWS. As such, it wins on the "cost-effectiveness" decision driver. Unfortunately, Cloudwatch is only an ideal solution if you are significantly cost-constrained. As a free platform, and as a part of AWS's massive product offering, there isn't much motivation to keep Cloudwatch's feature set competitive with the market. Cloudwatch gets the worst score in the realm of usability, it is challenging to find what you need in Cloudwatch, which makes it an inefficient production operations platform. By contrast, Cloudwatch's generous free tier, and the fact that it's active in AWS by default, make it a good security and compliance platform. The recommendation for Cloudwatch is to use it exclusively for security and compliance purposes - and leverage its cost-effectiveness to invest in another platform that will be more effective at actual production operations.

- **Decision Status**: Not Recommended
- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

Links:
- the first 3 social links for "Cloudwatch UX" are about how bad it is [1](https://news.ycombinator.com/item?id=18584679), [2](https://www.reddit.com/r/aws/comments/nmsapj/this_cloudwatch_ui_sucks/), [3](https://news.ycombinator.com/item?id=18550722)
- [Pricing](https://aws.amazon.com/cloudwatch/pricing/)

### Sentry

Sentry is a frontend-focused APM (application performance monitoring) platform that has not (yet) expanded to become a logging and metrics platform. It is specifically focused on frontend exception and error handling, as well as performance. As simpler.grants.gov is an API-driven platform, Sentry is a non-ideal choice for our first production operations platform. That said, Sentry fulfills its role very effectively, and with fantastic UX. So Sentry might be a good platform to consider if we decide down the line that we need additional monitoring coverage on the frontend. Sentry is a fairly popular product but is not yet listed by [FedRAMP](https://marketplace.fedramp.gov/products).

- **Decision Status**: Not Recommended (at this time)
- **Pros**
  - Great UX
- **Cons**
  - not a fully featured platform
 
### Datadog

Datadog is a fully featured platform with support for logging, metrics dashboards, and APM. Several members of our team have prior experience with Datadog. Datadog excels in the market, is listed on [FedRAMP](https://marketplace.fedramp.gov/products), and would be an excellent choice of platform. It has fantastic UX, for both backend and frontend applications. The only "flaw" is that, at a high level, Datadog's product offering is hard to distinguish from New Relic's. The bulk of this paragraph is copied into the New Relic description, to emphasize that point.

One large advantage of Datadog is that it was built around its metrics and dashboard capabilities, and was built for API-driven applications. As such, Datadog has best-in-class dashboard functionality. This gives it a slight leg-up relative to New Relic. Datadog additionally can make dashboards public, which is a functionality that we may want to leverage to expose our API status (4XX / 5XX rate, etc) to the general public.

Grants.gov used Datadog in the past and then decided to move to Cloudwatch, due to cost.

- **Decision Status**: Top Choice
- **Pros**
  - well-known to our team
  - fully featured platform (logs, metrics, APM)
  - strong metrics product
  - best for API-driven applications
- **Cons**
  - likely more expensive than its closest competitor
 
Links:
- [Pricing](https://www.datadoghq.com/pricing/)

### New Relic

New Relic is a fully featured platform with support for logging, metrics dashboards, and APM. Several members of our team have prior experience with New Relic. New Relic excels in the market, is listed on [FedRAMP](https://marketplace.fedramp.gov/products), and would be an excellent choice of platform. It has fantastic UX, for both backend and frontend applications. The only "flaw" is that, at a high level, New Relic's product offering is hard to distinguish from Datadog's. The bulk of this paragraph is copied into the Datadog description, to emphasize that point.

New Relic has a free tier, and their pricing is less complex than Datadog's.

New Relic was built around its APM capability, so it will have better capabilities for debugging performance issues and hunting down esoteric production bugs.

- **Decision Status**: Top Choice
- **Pros**
  - well-known to our team
  - fully featured platform (logs, metrics, APM)
  - free tier, simpler pricing than the closest competitor
  - strong APM product

Links:
- [Pricing](https://newrelic.com/pricing)
 
### Splunk

Splunk is a fully featured platform with support for logging, metrics dashboards, and APM. At least one member of our current team has used Splunk, and would not recommend it. Splunk is listed on [FedRAMP](https://marketplace.fedramp.gov/products), and would likely be a good choice of platform. There are some notable high-level differences between Splunk and [New Relic or Datadog]. Splunk is a fully featured platform yes, but at its core, it's an enterprise data-driven platform. Splunk is best at helping understand data flow in large and complex applications. Simpler.grants.gov is not a data-driven platform and is not looking to reach an "enterprise application" scale. Therefore, Splunk's core product offering would likely be slightly mismatched for our needs, despite being outwardly very similar to [New Relic or Datadog].

- **Decision Status**: Viable Option
- **Pros**
  - fully featured platform (logs, metrics, APM)
- **Cons**
  - platform features not designed for our use case

### Grafana

Grafana is a fully open-source metrics platform that comes with other services that handle functionalities like logging and APM. Deploying the full suite of Grafana Labs tooling can provide you with a FOSS platform that is feature-competitive with all the other closed-source platforms on this ADR. The open-source nature comes with high costs to both UX and deployment, though. The UX of Grafana is somewhere halfway between Cloudwatch and Datadog. Grafana has managed options, but ultimately it's a platform built for self-hosting. As such, Grafana as a platform works best for companies that have an infrastructure team that can perform an on-call rotation to support it. At the time of writing, Simpler.grants.gov has no on-call rotation, which is a strong point against our use of a platform like Grafana.

- **Decision Status**: Not Recommended (at this time)
- **Pros**
  - open source
- **Cons**
  - high maintenance and training burden
  - mediocre UX

## Decision Status

Having collected all this information, it is the opinion of the author that both New Relic and Datadog would be strong choices. New Relic is the safer option due to its less complex pricing scheme. Datadog is more likely to have niche features that we find incredibly valuable (like public dashboards). We should move forward from here with a New Relic trial, and consider an additional Datadog trial if New Relic turns out non-ideal in some way.
