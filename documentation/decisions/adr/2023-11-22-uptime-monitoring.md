# Uptime Monitoring

- **Status:** Active
- **Last Modified:** 2023-11-22
- **Related Issue:** [#656](https://github.com/HHS/simpler-grants-gov/issues/656)
- **Deciders:** Lucas Brown, Billy Daly, Sammy Steiner, Daphne Gold, Aaron Couch
- **Tags:** Infrastructure, Notifications, Reliability

## Context and Problem Statement

We need a tool for external uptime monitoring of the website and API. We have [internal monitoring](https://github.com/HHS/simpler-grants-gov/blob/main/infra/modules/monitoring/main.tf) setup, but not external. This would be useful for cases in which a load balancer or CDN (if we adopt one) are not operating correctly, or there is a DNS issue with the site.

## Decision Drivers <!-- RECOMMENDED -->

- Ease of setup: This tool should be easy to configure and update as needed over time.
- Notifications: This tool must be able to notify the engineering team in the case of downtime.
- Cost: This tool should be as cost effective as possible.
- Process: This tool should fit into our existing processes and procedures for review and discussion.
- Dashboard (Optional): This tool should provide a dashboard for non engineers to see uptime metrics in real time.

## Options Considered

- AWS Cloudwatch Synthetic Canary
- Pingdom
- New Relic

## Decision Outcome <!-- REQUIRED -->

Chosen option: AWS Cloudwatch Synthetic Canary, because it satisfies the availability monitoring requirement without adding much overhead to our existing toolset. This service can be configured in terraform so we can document exactly what it does with code and review it via our normal code review and approval process. Canaries will also need to be configured to send SNS notifications to an email group for outages. Any additional queries that could be supported by a third party tool will need to be done in google analytics.

### Positive Consequences <!-- OPTIONAL -->

- We will have uptime monitoring for our site from the perspective of public users.
- We will be notified in the event of an outage or error with our DNS or networking configuration.

### Negative Consequences <!-- OPTIONAL -->

- We will not have a dashboard for people without aws access to review uptime.

## Pros and Cons of the Options <!-- OPTIONAL -->

### AWS Cloudwatch Synthetic Canary

Amazon CloudWatch Synthetics uses "canaries", configurable scripts that run on a schedule, to monitor endpoints and APIs to follow the same routes and perform the same actions as a user. Canaries scripts can be written in Node.js or Python to create Lambda functions in your account and work over both HTTP and HTTPS protocols. Canaries offer programmatic access to a headless Google Chrome Browser via Puppeteer or Selenium Webdriver. Canaries check the availability and latency of your endpoints and can store load time data and screenshots of the UI. They monitor your REST APIs, URLs, and website content, and they can check for unauthorized changes from phishing, code injection and cross-site scripting. Priced at $0.0012 per canary run.

- **Pros**
  - Uses tools of existing ecosystem
  - Configurable as infrastructure as code in terraform
  - FedRAMP compliant
- **Cons**
  - Dashboard only accessible within AWS

### Pingdom

Pingdom offers uptime monitoring from over 100+ locations worldwide, page speed analysis, and transaction monitoring ( test simple or highly complex transactions, such as: new user registrations, user login, search, shopping cart checkout, URL hijacking, etc.). Creating uptime checks and alerts is easy in the third party dashboard. Priced starting at 10$/month for 10 uptime check configurations. PCI, HIPAA, and EU data protection certified. 

- **Pros**
  - Quick and easy to configure
  - Standalone dashboard

- **Cons**
  - Additional tool/dashboard to keep track of
  - Outside existing codebase, build, review, deployment process
  - Not FedRAMP Compliant

### New Relic

New Relic is an observability platform that provides monitoring of infrastructure, application performance, and availability. With convenient automated configuration tools, including for node.js and python applications, as well as aws accounts, it is easy to get started with a sophisticated and holistic monitoring system. New Relic is FedRAMP certified. New Relic charges by data ingest ($0.30 or $0.50 per GB after the first 100GB) as well as for user licenses from $50/user/month to $658/user/month. 

- **Pros**
  - Easy to set up by having it scan the codebase or aws tenant
  - Easy to build, access, and share dashboards
  - Nava experience from other projects
  - FedRAMP compliant
- **Cons**
  - Complex tool that is redundant with some of our other tools
  - Outside existing codebase, build, review, deployment process

## Links <!-- OPTIONAL -->

- [{Link name}](link to external resource)
- ...
