# Backend API Type

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-19 <!-- REQUIRED -->
- **Related Issue:** [#186](https://github.com/HHS/grants-equity/issues/186) <!-- RECOMMENDED -->
- **Deciders:** Lucas Brown, Aaron Couch, Billy Daly, Sammy Steiner, Daphne Gold, Andy Cochran, Sarah Knopp <!-- REQUIRED -->

## Context and Problem Statement

The project will require a backend API. The goal of this ADR is to evaluate and select the API protocol our endpoints will adhere to.

## Decision Drivers <!-- RECOMMENDED -->

### Must Haves
- Well-Established Paradigm & Ease of Adoption: The API protocol needs to be well-established so that the consumer of the API is familiar with how to structure requests and process responses. The API should be simplistic, consistent, clear and backward compatibile
- Supports Common Uses Cases: The API needs to support our common use cases (e.g. querying a list of NOFOs that match certain search criteria), so that it "just works" out of the box without having to spend much time learning how to use it 
- Easily Maintained and Scalable: The API needs to be relatively easy to maintain and scale, so that we can prioritize developing important product features over managing basic infrastructure. We need a flexible protocol that can satisfy both current and future needs of the project.


## Options Considered

- REST
- RPC
- SOAP
- GraphQL

## Decision Outcome <!-- REQUIRED -->

Chosen protocol: REST, because this option is widely opted, is highly scalable and can meet the demands of a large and active user base, and is flexible.


## Pros and Cons of the Options <!-- OPTIONAL -->

### REST

REST (Representational State Transfer) is an architectural style for designing APIs. It uses HTTP verbs to represent different operations, such as GET to retrieve data, POST to create data, PUT to update data, and DELETE to delete data.

- **Pros**
  - Simple and easy to understand
  - Widely adopted
  - Supports multiple data formats (flexible)
  - Highly scalable
- **Cons**
  - Can be verbose
  - Not as efficient as some other protocols
  - Not as well-suited for complex data structures

### SOAP

SOAP (Simple Object Access Protocol) is a protocol for exchanging information between applications. It uses XML to represent data and SOAP messages.

- **Pros**
  - Well-defined and standardized
  - Supports complex data structures
  - Secure
- **Cons**
  - Can be complex to implement
  - Not as widely adopted as REST
  - Not as efficient as some other protocols

### RPC

RPC (Remote Procedure Call) is a style of programming where a client application calls a procedure on a remote server. 

- **Pros**
  - Efficient
  - Well-suited for complex data structures
  - Secure
- **Cons**
  - Not as widely adopted as REST or SOAP
  - Can be complex to implement
  - Not as flexible as REST

### GraphQL

GraphQL is a query language for APIs. It allows clients to request specific data from a server, rather than having to know what data is available.

- **Pros**
  - Efficient
  - Flexible
  - Easy to use
- **Cons**
  - Not as widely adopted as REST or SOAP
  - Can be complex to implement
  - Not as well-suited for complex data structures


## Links <!-- OPTIONAL -->

- [REST vs. SOAP vs. GraphQL vs. RPC](https://www.altexsoft.com/blog/soap-vs-rest-vs-graphql-vs-rpc/)
- [Architectural Styles for APIs: SOAP, REST and RPC](https://medium.com/api-university/architectural-styles-for-apis-soap-rest-and-rpc-9f040aa270fa)
- [Different Types of APIs – SOAP vs REST vs GraphQL](https://www.freecodecamp.org/news/rest-vs-graphql-apis/)
- [SOAP vs REST - Difference Between API Technologies](https://aws.amazon.com/compare/the-difference-between-soap-rest/)
