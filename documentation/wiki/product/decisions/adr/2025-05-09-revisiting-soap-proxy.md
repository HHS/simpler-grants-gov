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

- Implement an existing SOAP API skeleton key and an alternative way to pass the “real user” for each API request
- Move the deployment target for proxy/router Client side exe/container
- Don't support SOAP
- Simpler SOAP facade where all data is returned from Simpler REST calls
- Make the existing SOAP API the compatibility layer by writing Simpler data back to the existing database
- Allow SOAP callers to supply us with their private keys
- Create parallel certificates for the Proxy/Router to use to represent every SOAP caller

## Decision Outcome

Chosen option: "{option X}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.

### Positive Consequences

- {e.g., improved performance on quality metric, new capability enabled, ...}
- ...

### Negative Consequences

- {e.g., decreased performance on quality metric, risk, follow-up decisions required, ...}
- ...

## Pros and Cons of the Options

### Implement an existing SOAP API skeleton key and an alternative way to pass the “real user” for each API request

{example | description | pointer to more information | ...}

- **Pros**
  - Good
- **Cons**
  - Bad, because {argument c}

### Move the deployment target for proxy/router Client side exe/container

{example | description | pointer to more information | ...}
to perform the parallel REST/SOAP calls because it can have access to both the client certificate and private key locally to the API consumer

- **Pros**
  - Good
- **Cons**
  - Bad, because {argument c}

### Don't support SOAP

{example | description | pointer to more information | ...}

- **Pros**
  - Good
- **Cons**
  - Bad, because {argument c}

### Simpler SOAP facade where all data is returned from Simpler REST calls

{example | description | pointer to more information | ...}
move all existing data to Simpler for data completeness

- **Pros**
  - Good
- **Cons**
  - Bad, because {argument c}

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

### Allow SOAP callers to supply us with their private keys

Since TLS Client Authentication does make the Client Certificate available to the server, all we really need to make the TLS connection to the Grants.gov SOAP API server is the Private Key. If the caller provided the Simpler Proxy/Router with the certificate serial number and private key, we could use that stored private key to connect to the existing SOAP API whenever we saw that certificate being used.

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

## Links

- \[{Link name}]\(link to external resource)
- ...
