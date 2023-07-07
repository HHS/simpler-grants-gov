# Frontend Language

- **Status:** Draft <!-- REQUIRED -->
- **Last Modified:** 2023-07-06 <!-- REQUIRED -->
- **Related Issue:** [#96](https://github.com/HHS/grants-api/issues/96) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sammy Steiner <!-- REQUIRED -->

## Context and Problem Statement

The project will have a frontend that is used to support both static and dynamic content. The goal of this ADR is to select a language that we'll use to implement this frontend.

## Decision Drivers <!-- RECOMMENDED -->

- Active Maintenance: The language is actively maintained with patches and minor releases delivered on a regular basis
- Community of Users: The language has an active community of open source users and is commonly used for frontend development
- Usability: The language is relatively easy to learn for developers without prior experience and there are plenty of resources and training materials available
- Language Features: The language supports important features like concurrency, static type checking, immutable data types, etc. or there are well established libraries which provide these features
- Reusability: The language selected for the frontend can be also used to support other parts of the project (e.g. ETL & data analysis, API development)
- HHS and Nava familiarity with the language

## Options Considered

- JavaScript
- Typescript
- Python
- Java
- Go

## Decision Outcome <!-- REQUIRED -->

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences <!-- OPTIONAL -->

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences <!-- OPTIONAL -->

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options <!-- OPTIONAL -->

### JavaScript

JavaScript is a lightweight, interpreted programming language with first-class functions. While it's universally used for client side website functionality, with tools like npm and node, it is a powerful application language as well.

- **Pros**
  - Keeping the entire frontend in one language requires less context switching
  - Large communinity of users, with lots of updates, and rich functionality
  - HHS and Nava are very familiar
- **Cons**
  - Loosely typed


### TypeScript

TypeScript is a syntactic superset of JavaScript which adds static typing.

- **Pros**
  - Same as JavaScript
  - Strong typing
- **Cons**
  - More complex than JavaScript

### Python

Python is a high-level, dynamically typed general-purpose programming language. Its design philosophy emphasizes code readability but supports multiple programming paradigms. 

- **Pros**
  - Same language as backend reducing context switching
- **Cons**
  - Will still require javascript for client side functionality
  - Python on the front end is not as well supported as other languages


### Java

Java is widely used for building enterprise-scale web applications as it is one of the most stable languages on the market. Java’s advantages include platform independence, multi-threaded processing, automatic garbage collection, and security.

- **Pros**
  - Existing HHS website and tools are built with Java
  - Will still require javascript for client side functionality
- **Cons**
  - Commercial use requires expensive licenses and not as open source friendly
  - Compilation and abstraction by the Java Virtual Machine makes performance slower
  - Nava team is not as familiar with Java as they are with the other options

### Go

Go is an open source programming language supported by Google.

- **Pros**
  - ...
- **Cons**
  - Will still require javascript for client side functionality
  - Not a lot of frontend support
  - ...
<!--
## Links OPTIONAL 

- [{Link name}](link to external resource)
- ...
-->
