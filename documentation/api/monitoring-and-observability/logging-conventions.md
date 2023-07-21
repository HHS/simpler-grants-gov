# Logging Conventions

## Purpose

Logging is a valuable tool for engineering teams to support products in production. It enables debugging, real-time alerts, and real-time business metrics. This document is for engineers to have a set of guidelines and rationale for how to approach logging events in our system.

## Principles

### Make code observability a primary tool for debugging and reasoning about production code

When a user runs into an issue in production, logs offer one of the primary ways of understanding what happened. This is especially important for situations where we can’t or don’t know how to reproduce the issue. In general it is not feasible to attach a debugger to production systems, or to set breakpoints and inspect the state of the application in production, so logs offer a way to debug through “print statements”.

### Make it easy for on-call engineers to search for logs in the codebase

While it is important to use logs to reason about the code, it is often equally important to be able to understand what code is being run from the logs. This is especially true for on-call engineers who may encounter production issues that are in areas of the codebase that they are not directly familiar with. Thus it is important to make it easy to find the associated place in the code that triggered logs.

### Optimize for ease, flexibility, and speed of queries over DRY principles

Log querying systems are often limited in their querying abilities. Most log databases are not relational databases, and as such to enable effective querying of logs, we should think about how we design the structure of our log messages and metadata.

## Guidelines

### General

- **Minimize logic or dynamic behavior** – Logs are often used for troubleshooting, so minimize dynamic behavior in logs to reduce the chance that the logging system itself could be contributing to adding complexity to an issue.
- **Log all key points throughout the application** – Include logs for:
  - Important branches in business logic (so you can reason from the logs which branch the code took in production without the aid of a debugger)
  - Before and after actions that are important or actions that have a nontrivial chance of failing (e.g. external service calls, or calls to legacy systems)
- **Log both successes and failures** – Successes can be useful for debugging what steps were completed successfully to narrow down what failed. In addition, logging successes can be useful for powering real-time business metrics.

### Log event type

- **INFO** – Use INFO events to log something informational. This can be information that's useful for investigations, debugging, or tracking metrics. Note that events such as a user or client error (such as validation errors or 4XX bad request errors) should use INFO, since those are expected to occur as part of normal operation and do not necessarily indicate anything wrong with the system. Do not use ERROR or WARNING for user or client errors to avoid cluttering error logs.
- **ERROR** – Use ERROR events if the the system is failed to complete some business operation. This can happen if there is an unexpected exception or failed assertion. Error logs can be used to trigger an alert to on-call engineers to look into a potential issue.
- **WARNING** – Use WARNING to indicate that there *may* be something wrong with the system but that we have not yet detected any immediate impact on the system's ability to successfully complete the business operation. For example, you can warn on failed soft assumptions and soft constraints. Warning logs can be used to trigger notifications that engineers need to look into during business hours.

### Log messages

- **Standardized log messages** – Consistently formatted and worded log messages easier to read when viewing many logs at a time, which reduces the chance for human error when interpreting logs. It also makes it easier to write queries by enabling engineers to guess queries and allow New Relic autocomplete to show available log message options to filter by.
- **Statically defined log messages** – Avoid putting dynamic data in log messages. Static messages are easier to search for in the codebase. Static messages are also easier to query for those specific log events without needing to resort to RLIKE queries with regular expressions or LIKE queries.

### Attributes

- **Log primitives not objects** – Explicitly list which attributes you are logging to avoid unintentionally logging PII. This also makes it easier for engineers to know what attributes are available for querying, or for engineers to search for parts of the codebase that logs these attributes.
- **Structured metadata in custom attributes** – Put metadata in custom attributes (not in the log message) so that it can be used in queries more easily. This is especially helpful when the attributes are used in "group by" clauses to avoid needing to use more complicated queries.
  - **system identifiers** – Log all relevant system identifiers (uuids, foreign keys)
  - **correlation ids** – Log ids that can be shared between frontend events, backend logs, and ideally even sent to external services
  - **discrete or discretized attributes** – Log all useful non-PII discrete attributes (enums, flags) and discretized versions of continuous attributes (e.g. comment → has_comment, household → is_married, has_dependents)
- **Denormalized data** – Include relevant metadata from related entities. Including denormalized (i.e. redundant) data makes queries easier and faster, and removes the need to join or self-join between datasets, which is not always feasible.
- **Fully-qualified globally consistent attribute names** – Using consistent attribute names everywhere. Use fully qualified attribute names (e.g. application.application_id instead of application_id) to avoid naming conflicts.
