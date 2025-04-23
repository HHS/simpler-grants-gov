# Migrate Existing API Consumers

- **Status:** Active
- **Last Modified:** 2025-04-23
- **Related Issue:** [#4199](https://github.com/HHS/simpler-grants-gov/issues/4199)
- **Deciders:** Julius, Lucas
- **Tags:** api, soap, s2s, applicant, grantor

## Context and Problem Statement

We have a large existing S2S API client base split into two primary cohorts:

1. Other Federal Government Agencies - Grantors, USASpending, etc.
2. Applicants (data suggests this is primarily Universities, Hospital/Healthcare Groups, State/County/Local Governments)

The level of S2S utilization, size of the user community, and the major differences between SOAP and REST and the authentication methods for the existing and Simpler APIs, leads us to the finding that we will need a way to continuing supporting the SOAP dialect of these APIs for the foreseeable future. Given that many API consumers are other Federal Agency IT Systems, we're anticipating needing a long runway, once the Simpler API has feature parity, to allow agencies to budget, contract, develop, and deploy changes to their systems that will consume the Simpler API instead of the SOAP API.

Given that long timeline we have two options:

1. Accelerating the availability of a REST API
2. Decoupling support for a SOAP API from retirement of the existing system

Both of these options would allow SOAP API consumers more time to get through the migration process. The first option by giving them a REST API sooner, allowing for the process to start earlier. The second option allows for more time on the backend by allowing consumers to start later, supporting them on SOAP for longer.

Regardless of approach, we need to support complete data being accessible to existing SOAP consumers up-to and through their implementation of REST.

But the fundamental question is, how do we support existing SOAP consumers long enough that they can migrate to the Simpler REST APIs?

## Decision Drivers

- Ease of migration for SOAP consumers
- Minimize impact of supporting the legacy system on new work/innovation
- Ease of support for technical team
- If consumers aren't required to implement both APIs concurrently for a period, data must appear unified behind a single API call for both SOAP and REST calls (for data that will exist in Simpler)
  - This avoids breaking existing workflows before they can move off SOAP, and supports consumers moving to REST while still needing historical data.
  - Supporting historical data directly in Simpler would require data migration to the Simpler system, but there will be periods when data is actively being generated in both systems, so migration isn't a good fit for ensuring all data is available from a single API call.

## Options Considered

- REST wrapper around existing grants.gov SOAP API
- SOAP wrapper around Simpler REST API
- Only support existing SOAP API
- Do nothing to help SOAP consumers

## Decision Outcome

Chosen option: "SOAP wrapper around Simpler REST API," because it provides the best support for existing SOAP consumers without limiting new REST API and other system design of Simpler.

### Positive Consequences

- Best experience for existing API consumers, particularly Agencies that need to retrieve applications from Grants.gov and will need time to migrate to the Simpler REST API
- Best support for our rolling, iterative migration of functionality from existing Grants.gov to Simpler.
- Allows the Simpler work to actively take over for Grants.gov, even if SOAP consumers haven't adopted Simpler yet, and allows the existing systems to be depreciated and shutdown even if SOAP is still being consumed.
- Provides the largest flexibility for Simpler innovation and improvement while providing a backward compatible way for existing SOAP consumers to continue interacting with Grants.gov

### Negative Consequences

- Increases scope of work, but only compared to doing nothing and forcing API consumers to take on all effort of a rolling, parallel API cut over and ultimate retirement of SOAP.

## Pros and Cons of the Options

### REST wrapper around existing grants.gov SOAP API

Create an initial REST API that cobbles together new Simpler work where it exists, and falls back to the SOAP API to "complete" the REST API and allow for consumers to start migrating. Overtime the fall backs go away and the entire API is supported natively in Simpler.

- **Pros**

  - Fastest path to a "complete" REST API allowing migration to begin sooner.

- **Cons**

  - Would require defining our entire REST API schema up-front and/or require a second migration later for consumers.
  - Limits new work. Everything in the REST API must be compatible with the SOAP API because that's what it is under the hood.
  - SOAP API requires Client Certificates for authentication which would complicate wrapping that with our standard API key approach.

### SOAP Wrapper around Simpler REST API

Create a SOAP API facade that initially just proxies calls through the the existing SOAP API. As functionality is built into Simpler, the proxy is enhanced into a router that can decide if an incoming SOAP request should be handled:

1. just by the existing SOAP API
2. just by Simpler's REST API
3. by both APIs, either to evaluate the responses and chose which to send to th caller, or to combine the responses into a single SOAP response that represents the data in both systems

This layer between the caller and the APIs allows Simpler data and functionality to incrementally replace existing Grants.gov's without the S2S API consumers having to make changes or implement the REST API.

- **Pros**

  - Gives us more time to finish the REST API, without impacting ability of SOAP API consumers to pull data that does start to be represented in Simpler.
  - Smooths the transition for SOAP API Consumers, giving them more time to move to REST once it's complete, without any gaps in data/functionality.
  - Introduces an option to shutdown the existing system before all SOAP consumers have migrated
  - Allows incremental adoption of features in Simpler without data gaps or requiring Agencies to partially adopt the Simpler REST API.
  - Keeps the Simpler REST API from being restricted or limited to only things the existing SOAP API already does.

- **Cons**

  - Additional scope/surface area for us to support

### Only support existing SOAP API

Modernize under the hood but continue to support the existing SOAP API schemas/footprint as our Simpler API.

- **Pros**
  - Consumers don't have to change anything to pick up new API integration
- **Cons**
  - Severely limits modernization/innovation efforts.
  - Removes avenues to adjust workflow or process deficiencies given we need to support the existing way things work.

### Do nothing to help SOAP consumers

Let the SOAP API languish while more and more data and API functionality shifts to the REST API until the point that new data will only appear in the REST API and the SOAP API will be a dead end.

- **Pros**
  - No extra technical work
- **Cons**
  - Consumers control which API they pull data from but not which API gets applications so this would lead to confusion and the potential of data being lost/missed.
  - Before REST work is complete the REST API has a degraded experience, requiring parallel implementations of REST/SOAP.
  - After REST work is complete the SOAP API has a degraded experience, giving a very short runway for cutting over from SOAP to REST.

## Links

- [S2S SOAP API Documentation](https://www.grants.gov/system-to-system)
- [Simpler REST API Documentation](https://api.simpler.grants.gov/docs)
