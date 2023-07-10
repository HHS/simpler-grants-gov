# Front-end Language

- **Status:** Proposed <!-- REQUIRED -->
- **Last Modified:** 2023-07-10 <!-- REQUIRED -->
- **Related Issue:** [#96](https://github.com/HHS/grants-api/issues/96) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sammy Steiner <!-- REQUIRED -->

## Context and Problem Statement

The goal of this ADR is to select a language that we'll use to implement the front end for beta.grants.gov. The front end will only support static content at first, but will grow to include the new search, supported by the API and eventually the entire grants.gov functionality. Therefore, while a simple solution might work in the short term, it will quickly become insufficient to meet our needs.

## Decision Drivers <!-- RECOMMENDED -->

- Active Maintenance: The language is actively maintained with patches and minor releases delivered on a regular basis
- Community of Users: The language has an active community of open source users and is commonly used for front-end development
- Usability: The language is relatively easy to learn for developers without prior experience and there are plenty of resources and training materials available
- Language Features: The language supports important features like concurrency, static type checking, immutable data types, etc. or there are well established libraries which provide these features
- Reusability: The language selected for the front end can be also used to support other parts of the project (e.g. ETL & data analysis, API development)
- HHS and Nava familiarity with the language

## Options Considered

- JavaScript
- Typescript
- Python
- Java
- Go

## Decision Outcome <!-- REQUIRED -->

Chosen option: Typescript, because it is the ideal language for front-end applications because some form of JavaScript is required for client side functionality anyway. This allows us to reduce the amount of context switching between langauges. Additionally, with node and npm TypeScript and JavaScript are fully featured platforms for building and running applications. We chose TypeScript over JavaScript because of the value that strong typing provides with promomting code quality and developer support. 

### Positive Consequences <!-- OPTIONAL -->

- Getting to stay in Javascript for the entire front end means less energy spent context switching
- Strong typing helps with code quality and guidance to developers, but is only helpful if it is used properly

### Negative Consequences <!-- OPTIONAL -->

- Code should be written in such a way that if TypeScript loses longer supported, we can easily pare it down to regular javascript

## Pros and Cons of the Options <!-- OPTIONAL -->

### JavaScript

JavaScript is a lightweight, interpreted programming language with first-class functions. While it's universally used for client side website functionality, with tools like npm and node, it is a powerful application language as well.

- **Pros**
  - Keeping the entire front end in one language requires less context switching
  - Large communinity of users, with lots of updates, and rich functionality
  - HHS and Nava are very familiar with the language and its frameworks
- **Cons**
  - Loosely typed


### TypeScript

TypeScript is a syntactic superset of JavaScript which adds static typing and is transpiled down to regular javascript when building the application. While TypeScript is a relatively new "language" it's gaining popularity quickly as it's more of a enhancement to javascript than just another new language. 

- **Pros**
  - Same as JavaScript
  - Strong typing
- **Cons**
  - More complex than JavaScript

### Python

Python is a high-level, dynamically typed general-purpose programming language. Its design philosophy emphasizes code readability but supports multiple programming paradigms. 

- **Pros**
  - Same language as back end reducing context switching
- **Cons**
  - Will still require javascript for client side functionality
  - Python is not as well supported for front-end tasks as it is for back-end tasks


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
  - Rapidly gaining popularity
- **Cons**
  - Will still require javascript for client side functionality
  - Not a lot of front-end support

<!--
## Links OPTIONAL 

- [{Link name}](link to external resource)
- ...
-->
