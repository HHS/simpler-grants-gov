# Revisiting SOAP Proxy

- **Status:** Active
- **Last Modified:** 2025-05-09
- **Related Issue:** [#4993](https://github.com/HHS/simpler-grants-gov/issues/4993)
- **Deciders:** Lucas, Julius, Matt
- **Tags:** api, soap, s2s, applicant, grantor

## Context and Problem Statement

We had previously documented our [plan for supporting SOAP API consumers while Simpler is still running in parallel with the existing Grants.gov systems](2025-03-24-migrate-existing-api-consumers.md). The existing SOAP API utilizes TLS Client Authentication via a Client Certificate. We're unable to proxy traffic to the SOAP API at the application layer because client authentication requires both the Client Certificate and the Private Key for that certificate to be used in the TLS negotiation via a challenge and response cycle. We are able to gain access to the client certificate, as that is sent through the TLS layer to the server, but we cannot initiate an outgoing TLS connection with that certificate because we do not have access to the private key to complete the connection negotiation. This scenario differs from existing 3rd party applications which access the SOAP API as an existing user because those systems have access to both the certificate and private key.

## Decision Drivers

- Ease of migration for SOAP consumers
- Minimize impact of supporting the legacy system on new work/innovation
- Ease of support for technical team
- If consumers aren't required to implement both APIs concurrently for a period, data should appear unified behind a single API call for both SOAP and REST calls (for data that will exist in Simpler)
  - This avoids breaking existing workflows before they can move off SOAP
  - Supporting historical data directly in Simpler would require data migration to the Simpler system, but there will be periods when data is actively being generated in both systems, so migration isn't a good fit for ensuring all data is available from a single API call.

## Options Considered

1. [Implement an existing SOAP API skeleton key and an alternative way to pass the “real user” for each API request](#implement-an-existing-soap-api-skeleton-key-and-an-alternative-way-to-pass-the-real-user-for-each-api-request)
2. [Move the deployment target for proxy/router Client side exe/container](#move-the-deployment-target-for-proxyrouter-client-side-execontainer)
3. [Don't support SOAP](#dont-support-soap)
4. [Simpler SOAP facade where all data is returned from Simpler REST calls](#simpler-soap-facade-where-all-data-is-returned-from-simpler-rest-calls)
5. [Make the existing SOAP API the compatibility layer by writing Simpler data back to the existing database](#make-the-existing-soap-api-the-compatibility-layer-by-writing-simpler-data-back-to-the-existing-database)
6. [Move the proxy to a lower level so we can inject ourselves in the TLS negotiation and set up a co-negotiated channel that lets us proceed with proxying](#move-the-proxy-to-a-lower-level-so-we-can-inject-ourselves-in-the-tls-negotiation-and-set-up-a-co-negotiated-channel-that-lets-us-proceed-with-proxying)
7. [Allow SOAP callers to supply us with their private keys](#allow-soap-callers-to-supply-us-with-their-private-keys)
8. [Create parallel certificates for the Proxy/Router to use to represent every SOAP caller](#create-parallel-certificates-for-the-proxyrouter-to-use-to-represent-every-soap-caller)
9. [Sign our own certificates with Serial Numbers to match client's](#sign-our-own-certificates-with-serial-numbers-to-match-clients)

## Detailed Plans for Leading Options

- [Plan - Implement an existing SOAP API skeleton key and an alternative way to pass the “real user” for each API request](#plan---implement-an-existing-soap-api-skeleton-key-and-an-alternative-way-to-pass-the-real-user-for-each-api-request)
- [Plan - Simpler SOAP facade where all data is returned from Simpler REST calls](#plan---simpler-soap-facade-where-all-data-is-returned-from-simpler-rest-calls)
- [Plan - Allow SOAP callers to supply us with their private keys](#plan---allow-soap-callers-to-supply-us-with-their-private-keys)

## Decision Outcome

Given the [detailed plans](#detailed-plans-for-leading-options), the recommendation would be to unblock ongoing work but making a single [private key accessible to the Proxy/Router](#allow-soap-callers-to-supply-us-with-their-private-keys). This could be the Simpler Team's key until a partner agency is found that would be willing to provide their private key in exchange for early access to the Proxy/Router. This allows both the Proxy and Router aspects of the work to continue without interruption or delay. This would also prove out the next stage of that approach in case it becomes necessary in the future. This would limit the Proxy functionality to usage by a single caller, whoever's private key we have access to. But this would just be a short term way to allow for testing/integration to continue, while the work to establish a [skeleton key implementation in the SOAP API](#implement-an-existing-soap-api-skeleton-key-and-an-alternative-way-to-pass-the-real-user-for-each-api-request) is being completed. This hybrid approach differs some of the decision points between the two options to a later point when the cost/timeline of modifying the existing SOAP API are better understood. It could also let us launch a limited beta of the Proxy/Router with Agencies willing to provide their private keys, and then migrate to the skeleton key option for all Agencies once that's ready.

### Positive Consequences

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options

### Implement an existing SOAP API skeleton key and an alternative way to pass the “real user” for each API request

Since we have access to the client certificate (but not the private key) and the data in Grants.gov that maps the certificate to the permissions that apply to that caller, we can verify and pass through the identity of the calling API Consumer. However we can't pass through the client certificate authentication that the SOAP API was built to utilize. If the SOAP API was modified to allow a specific key (a skeleton key) to utilize a new header or other request argument that identified the original certificate presented and that certificate was used for permission decisions on that request, that would allow us to work around the issue we've encountered making SOAP requests on behalf of the original user. In this scenario, the Proxy/Router still has validated that the caller has the certificate and key that match, otherwise the TLS negotiation fails and we never get their incoming SOAP request. The Proxy/Router then negotiates a connection with the existing SOAP API using our skelton key and we pass the SOAP request through to the existing SOAP API along with a new header or request data point that indicates the actual certificate that was presented. The modified SOAP API validates the skeleton key and therefore checks the new data point to look up permissions based on that certificate the client had provided.

- **Pros**
  - Maintains the drop in replacement, no client change priority
  - Least change from what we were originally planning to build on the Simpler side
- **Cons**
  - Requires a potentially sizable change to the legacy API to support the alternate way of looking up permissions associated with the request

### Move the deployment target for proxy/router Client side exe/container

Instead of running our Proxy/Router on AWS Infrastructure we shift that code to execute in the client environment. The code to perform the parallel REST/SOAP calls can impersonate the client fully because it can have access to both the client certificate and private key when running more locally to the API consumer. We could package our proxy as an executable (for multiple platforms) and a Docker container (for ease of cloud or other virtual deployment). Because this codebase is now running in the API Consumer's environment, they can follow instructions to give it access to their existing Grants.gov certificate and private key, without introducing any new security concerns by Simpler possessing those private keys. However, building software to be run in another team's environment is a very different process than building for cloud deploys on your own infrastructure, particularly around support, releasing updates, and maintaining compatibility. We also anticipate this approach would involve a local IT/Engineering lift that some existing SOAP Consumers would struggle with. This solution suffers from the same opt-in issues as only callers who have set up the local proxy can benefit from the solution. It might also be complicated for multi-tenant environments who would need to support on instance of the software for each tenant in their SaaS solution.

- **Pros**
  - Keeps the security boundaries unaltered, we don't need access to caller's private key
- **Cons**
  - While we rapidly iterate and release new updates, the running copies of the software drift further out of date and we can't fix bugs or address issues easily without ongoing engagement and effort with API consumers.
  - Another opt-in solution, until an agency is running the local proxy they don't benefit from the solution.
  - Likely multi-tenancy issues for SaaS vendors.

### Don't support SOAP

Just focus on building out REST. Migrate specific data to Simpler when it's needed for the ongoing Simpler operation, but leave data and thereby SOAP consumers stranded on the existing API until that system is shut down. In the short term, this would mean that agencies would miss Simpler Applications until they implement the Simpler API.

- **Pros**
  - No extra work for Simpler, we don't have to move additional data, and we don't have to implement any SOAP translation.
- **Cons**
  - Creates two isolated islands of data, Agencies would miss Simpler Applications until they implement the Simpler API or manually pulled in those applications.
    - This could spin out to Agencies needing to be able to opt-out of Simpler Applications until they've implemented the REST API, which would severely impact the timeline for real Users using Simpler in Prod.

### Simpler SOAP facade where all data is returned from Simpler REST calls

Rather than being able to mix and route API traffic between two live APIs, the existing SOAP API and the new REST API, we instead provide a simpler SOAP translation facade on top of the REST API. This allows existing SOAP callers to continue to use their established SOAP implementation, but we back those requests entirely via the REST API. This would require, moving all existing data the SOAP API must continue to Simpler for data completeness from the single source. This would have the nice side effect that the data returned by the SOAP facade and REST calls would be identical.

- **Pros**
  - Responses from both APIs contain the same data, potentially making it easier to validate we're maintaining parity.
  - Less effort from the Simpler team to implement the SOAP piece.
- **Cons**
  - The SOAP facade only becomes useful when we've moved most if not all of the existing data into Simpler.
  - The REST representations of this data will need to change as Simpler features are built to replace the existing concepts.
  - THe Proxy/Router approach allows us to dead end certain data in the existing system, but still allow it to be returned to consumers because we're tying together both APIs, this would eliminate that option and require moving all data to Simpler.

### Make the existing SOAP API the compatibility layer by writing Simpler data back to the existing database

One of the initial drivers of the SOAP Proxy/Router work was to allow us to not have to consider writing Simpler data about Users, Opportunities, Applications, etc. into the existing database. This was due to level of effort, past experience with data flowing back into the existing system extending timelines for getting off the old system, and concerns about limiting the innovation possible on Simpler by requiring data model backwards compatibility. But given the issues discovered, we could just do that: Write data that originates in Simpler back to the existing database and treat the existing SOAP API as the single API that bridges both systems until consumers can migrate to the Simpler REST API.

- **Pros**
  - Allows the existing SOAP API to represent Simpler data, providing the desired single entry point for existing system and Simpler data
  - We don't have to continue building the SOAP Proxy/Router
- **Cons**
  - Putting Simpler data into the existing system will lengthen the time to get the final users off the existing system, requiring us to continue to support the existing database and API even after all users are no longer directly working in that system.
  - Simpler cannot make any data model changes that are not somehow backward compatible with the existing data storage schemas. (With the Proxy/Router layer in place we could address any incompatibilities at that layer, here we must keep 1:1 backward compatibility with the existing tables.)
  - Adds potentially significant work to feed data back into the existing System from Simpler.
  - Having additional systems writing data to the same database often leads to data inconsistencies that are hard to prevent, troubleshoot, and fix.

### Move the proxy to a lower level so we can inject ourselves in the TLS negotiation and set up a co-negotiated channel that lets us proceed with proxying

Our plan was to proxy requests at the Application layer, (Layer 7 in the [OSI Model](https://en.wikipedia.org/wiki/OSI_model)). However the mutual client authentication happens lower in the stack as part of [Transport Layer Security](https://en.wikipedia.org/wiki/Transport_Layer_Security) (TLS). TLS doesn't fit cleanly into the OSI Model despite its name, but it's generally classified as a Transport (Layer 4) or Session (Layer 5) concern. This means there's theoretically a shift in the proxy where if we ran more at the Transport/Session layer we could intercept the TLS negotiation process and facilitate secure connections from client to proxy and proxy to SOAP API without the private key for the certificate. If we wanted to seriously consider this approach we'd want to do more research to confirm if this setup is even feasible within TLS, as it's very close to an attack vector which may mean TLS contains active defenses against how this approach would work.

- **Pros**
  - Gets around the issues of needing the private key, allowing for proxying for all consumers and without modification to the underlying SOAP API
- **Cons**
  - Working deeper in the networking stack means we're responsible for a lot more state and security pieces that at the higher level we can take for granted.
  - Bugs and incompatibilities between network stacks would be much harder to code for and troubleshoot.
  - Likely requires implementing in a language we don't already use on the project.

### Allow SOAP callers to supply us with their private keys

Since TLS Client Authentication does make the Client Certificate available to the server, all we really need to make the TLS connection to the Grants.gov SOAP API server is the Private Key. In this scenario, the caller provides the Simpler Proxy/Router with the certificate serial number and private key, by uploading that data to Simpler. The SOAP Router/Proxy would use that stored private key to connect to the existing SOAP API whenever we saw that certificate being used by the original caller. This means the proxy will only work for existing SOAP API consumers after they've provided their private key to Simpler.

- **Pros**
  - Allows us to still provide the SOAP Proxy functionality
- **Cons**
  - Security implications of holding our API consumers' private keys.
  - Need a mechanism for these to be submitted and updated
  - Proxy will only work for consumers that have provided their key.
  - Adds additional complexity when rotating certificates (we'll have the old key, they'll be sending the new cert, or we'll have the new key but they'll be sending the old cert)

### Create parallel certificates for the Proxy/Router to use to represent every SOAP caller

For every existing S2S Certificate registered with the system, obtain and register a second certificate, and apply the same permissions. Simpler would have access to these certificates and private keys and could make S2S SOAP requests using the parallel certificates. Because the permissions mirror the original certificates we ensure data is restricted as it would have been for the original caller.

- **Pros**
  - Allows us to still provide the SOAP Proxy functionality
- **Cons**
  - Significant management overhead dealing with certificate acquisition, configuration, permissions, renewals, etc.
  - Any mis-linking of certificates or permissions causes Agencies or Applicants to get someone else's data from the API

### Sign our own certificates with Serial Numbers to match client's

Whenever we see an incoming certificate we've never seen before, create our own self-signed certificate with a matching Serial Number. Using that certificate will cause S2S SOAP to think we're the original caller, and we can initialize mTLS because we have the private key.

- **Pros**
  - Allows us to still provide the SOAP Proxy functionality
  - Avoids private key management/mis-linking of some other potential options
- **Cons**
  - Security implications of self signed certificates

## Detailed Plans

### Plan - Implement an existing SOAP API skeleton key and an alternative way to pass the “real user” for each API request

- **Consumer changes**
  - None
- **SOAP API changes**
  - Major change to establish a second parallel authentication/permissions model.
- **Simpler changes**
  - Minor change to always utilize the Simpler certificate and private key for the SOAP requests
  - Minor change to pass through the caller's certificate serial number or other identifier for the SOAP API permissions to use instead of the Simpler certificate

### Plan - Simpler SOAP facade where all data is returned from Simpler REST calls

- **Consumer changes**
  - None
- **SOAP API changes**
  - None
- **Simpler changes**
  - Places data migration completeness on the critical path of requirements to start offering the Proxy/Router, this is likely not a major change in the level of work, but a major change to the timeline and urgency of that work.
  - Data migrations that would have happened on a feature by feature basis over the duration of the project will need to be front loaded
  - As those features are then supported directly in Simpler later, we'll likely need to revisit/rework the data migrations and SOAP translations.

### Plan - Allow SOAP callers to supply us with their private keys

- **Consumer changes**
  - Before first use and when ever an existing certificate is expiring the consumer must upload the private key for their certificate to Simpler
- **SOAP API changes**
  - None
- **Simpler changes**
  - Moderate change for UI/BE to allow for authenticated users to upload the client certificate and private key that will be used on their behalf when making proxy calls to the existing SOAP API
  - Minor change to lookup and utilize the private key that's associated with the caller's client certificate

## Links

- \[{Link name}]\(link to external resource)
- ...
