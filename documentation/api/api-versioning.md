# Overview

This document will detail how we handle versioning our API right now, as well a long-term idea that we will want to circle back to.

## Why versioning?

While many changes we plan to make to our API should be backwards-compatible, there will be times when we have to make
changes that would break our clients from calling our API (eg. making a field required that was previously optional).

By having versioned endpoints, we can give our clients time to update their calls until the old version of the endpoint can be fully deprecated.

# Current Implementation

Endpoints are versioned in their routes. For example, if our `GET` opportunity endpoint is `GET /v1/opportunities/:opportunityId` and
we made a change that was not backwards compatible (let's say we change the authentication approach), then we'd make an entirely
new endpoint called `GET /v2/opportunities/:opportunityId`. The `v1` endpoint would still exist, and most of the logic would likely be shared
between the implementations, but they would be two entirely separate endpoints as far as API routing is concerned.

While we are in the early phases of developing the API, prior to having any significant users of the API, we won't worry about
maintaining the backwards compatability. We won't start adding new versions of the API until we would begin impacting production
systems of our users.

# Long-term idea using headers

An alternative approach we could take in the future is to instead put the versioning in a header parameter (like the `content-type` field) similar to [Stripe](https://stripe.com/blog/api-versioning).

However, that approach has a few complexities due to the libraries we use for defining schemas and endpoints:

* [webargs](https://webargs.readthedocs.io/en/latest/index.html) - a generic framework for parsing HTTP requests, and can serialize/deserialize using Marshmallow schemas.
* [apispec](https://apispec.readthedocs.io/en/latest/) - a tool that can generate OpenAPI specifications from Marshmallow schemas.
* [APIFlask](https://apiflask.com/) is the framework we use that connects Flask, webargs, and apispec together for us.

When we construct a route, we specify the input & output Marshmallow schemas, which APIFlask passes to webargs & apispec. The OpenAPI specification is generated entirely at app start-up, and
is a static file (we also generate the [file statically](https://github.com/HHS/simpler-grants-gov/blob/main/api/openapi.generated.yml) in our repo using the same underlying code).
For webargs, it registers the schemas with the routes, and when the internal routing of a request is going on, it will use the registered schema to do validation.

Webargs does seem to have support for choosing the schema for an endpoint during request handling, as the "schema" can be either a schema or a `callable` object that
takes in the request and returns a `Schema` object. That request object contains the header, so a callable could be used to choose the right schema for a users given request.

However, the `input` and `output` methods for APIFlask do not take in multiple Schema or a callable, and would need to be rewritten.

## Rough Ideas
Modify the [input](https://apiflask.com/api/blueprint/#apiflask.scaffold.APIScaffold.input) method in APIFlask to be capable of taking in a callable. We could
either override the method, or look into making the change in APIFlask itself which is open source.

When this method calls webargs' [use_args](https://webargs.readthedocs.io/en/latest/api.html#webargs.core.Parser.use_args) method, instead pass in a callable
that returns a `Schema` based on the header.

We also need to further investigate the apispec setup to verify we can actually generate an OpenAPI specification that works with this approach.
OpenAPI does have support for switching the `content-type` on the UI, we would need to specify each separate version of a schema as `application/json+<whatever_version>`.
Currently, APIFlask defaults the body `content-type` to `application/json`.

Other miscellaneous problems to solve:
* How would we manage multiple schemas for a single endpoint?
* If we want to version something other than the body (header, query param, form), would this approach work?

