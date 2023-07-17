# API Framework and Libraries

- **Status:** Accepted <!-- REQUIRED -->
- **Last Modified:** 2023-07-07 <!-- REQUIRED -->
- **Related Issue:** [#28](https://github.com/HHS/grants-equity/issues/28) <!-- RECOMMENDED -->
- **Deciders:** Lucas brown, Aaron Couch, Billy Daly, Sammy Steiner, Daphne Gold, Gina Carson, Sumi Thaiveettil, Eshter Oke <!-- REQUIRED -->

## Context and Problem Statement

This ADR is to decide what python framework to use for the back-end API of grants.gov. Python was chosen as the language for the back-end API in [ADR #3](https://github.com/HHS/grants-equity/blob/main/documentation/decisions/adr/0003-api-language.md).

## Decision Drivers <!-- RECOMMENDED -->

- Is this framework well established with a broad community of developers
- Does it have good documentation for developers to get up to speed quickly
- Does this language have a track record for reliability and continued support
- How familiar is Nava and HHS with the framework
- How effectively can the chosen framework support the back-end needs of grants.gov

## Options Considered

- Flask 
- Flask + Connexion
- Flask + APIFlask
- FastAPI
- Django

## Decision Outcome <!-- REQUIRED -->

Chosen option: Flask + APIFlask, because it is well established with a broad community of developers and provides good tooling to move quickly. It has great documentation to help folks contribute quickly. Additionally the Nava Flask template recently adopted it, so we can leverage the template to get going quickly with a well engineered solution.

### Positive Consequences <!-- OPTIONAL -->
- Leverages the Nava open source template
- OpenAPI specs can be auto generated from models in code

### Negative Consequences <!-- OPTIONAL -->
- Code first paradigm, we should auto generate api documentation in the CI/CD pipeline to ensure it stays up to date with the code
- This is a relatively new library, so we should ensure code modularity in case we need to swap it out in the future

## Pros and Cons of the Options <!-- OPTIONAL -->


### Flask

Flask is a simple, but extensible, micro web framework for python created in 2010 that is easy to learn and build with. While it is capable on its own, it relies on other libraries to add core functionality. It was written to be pythonic, meaning it leverages python's unique features and follows python's principles of being readable and maintainable. Flask depends on the Werkzeug WSGI toolkit, the Jinja template engine, and the Click CLI toolkit.

- **Pros**
  - Shallow learning curve, great documentation, and pythonic style makes it easy for contributors to support
  - Flexible and scalable microframework means it can adjust as the needs of the project changes
  - Designed for back-end API services
- **Cons**
  - Tech stack can get complicated over time with various libraries
  - Lack of standardization means more decision making and good code quality is very important
  - Async operation takes additional planning and work


### Flask + Connexion

This deserves its own option because it fundamentally changes the way that we would develop with python and flask. With connexion, you first write your API contract, using the Swagger/OpenAPI standard. Then, the endpoints you defined will be mapped to your python view functions, ensuring that your python code does what your API contract says it does. This makes it rather unique in the landscape of python web frameworks, as most other tools start from your code instead of the other way around.

- **Pros**
  - Same as Flask
  - API first means all teams can work with a single contract, instead of having multiple sources of truth
  - Documentation in OpenAPI or Swagger means it's easier to understand and integrate with other tools
- **Cons**
  - Same as Flask


### Flask + APIFlask

This deserves its own option because it adds a lot of support to Flask for a more traditional code first api approach, in contrast to connexion. APIFlask is a lightweight Python web API framework based on Flask and marshmallow-code projects. It's easy to use, highly customizable, ORM/ODM-agnostic, and 100% compatible with the Flask ecosystem. The Nava Flask template repo has recently replaced connexion with apiflask, documented in [connexion replacement decision record](https://github.com/navapbc/template-application-flask/blob/main/docs/decisions/0001-connexion-replacement.md).

- **Pros**
  - Same as Flask
  - Simplifies boilerplate code necessary for a Flask API by pulling the best features of many libraries
  - Very well documented
- **Cons**
  - Same as Flask
  - Relatively young project


### FastApi

FastAPI is a modern, fast (high-performance), web framework created in 2018 for building APIs with python 3.7+ based on standard python type hints. This  implementation-first library is designed as a performant and intuitive alternative to existing python API frameworks. 

- **Pros**
  - Designed for speed and can perform asynchronous operations natively (if needed)
  - Can generate OpenAPI or Swagger documentation from the code
- **Cons**
  - FastAPI maintenance and updates can be sporadic and have long spans between them, maintained by a single person
  - Documentation for more advanced cases is lacking
  - As the newest of the frameworks, it has the smallest community of support
  - Can have memory management issues
  

### Django

Django is a full stack python web framework created in 2005 that follows the model–template–views (MTV) architectural pattern. It is maintained by the Django Software Foundation (DSF), an independent organization established in the US as a 501(c)(3) non-profit. Django is well documented and includes everything you may need in a full stack application already installed.

- **Pro**
  - Maintained by an independent 501(c)(3) non-profit organization
  - Longest running and most popular python framework in consideration
- **Cons**
  - Monolithic style, steep learning curve, and large codebase make it difficult for collaborators
  - Assumes both front end and back end are included in the monolith application


## Links <!-- OPTIONAL -\->

- [Nava flask template repository](https://github.com/navapbc/template-application-flask)
- [Nava decision to switch from Connexion to APIFlask](https://github.com/navapbc/template-application-flask/blob/main/docs/decisions/0001-connexion-replacement.md)
