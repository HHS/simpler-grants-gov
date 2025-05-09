# Revisiting SOAP Proxy

- **Status:** Active
- **Last Modified:** 2025-05-09
- **Related Issue:** [#4993](https://github.com/HHS/simpler-grants-gov/issues/4993)
- **Deciders:** Lucas, Julius, Matt
- **Tags:** api, soap, s2s, applicant, grantor

## Context and Problem Statement

The existing SOAP API utilizes TLS Client Authentication via a Client Certificate. We're unable to proxy traffic to the SOAP API at the application layer because client authentication requires both the Client Certificate and the Private Key for that certificate to be used in the TLS negotiation via a challenge and response cycle. We are able to gain access to the client certificate, as that is sent through the TLS layer to the server, but we cannot initiate an outgoing TLS connection with that certificate because we do not have access to the private key to complete the connection negotiation. This scenario differs from existing 3rd party applications which access the SOAP API as an existing user because those systems have access to both the certificate and private key.

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

{example | description | pointer to more information | ...}

- **Pros**
  - Good
- **Cons**
  - Bad, because {argument c}

### Allow SOAP callers to supply us with their private keys

{example | description | pointer to more information | ...}

- **Pros**
  - Good
- **Cons**
  - Bad, because {argument c}

### Create parallel certificates for the Proxy/Router to use to represent every SOAP caller

For every existing S2S Certificate registered with the system, obtain and register a second certificate, and apply the same permissions. Simpler would have access to these certificates and private keys and could make S2S SOAP requests using the parallel certificates. Because the permissions mirror the original certificates we ensure data is restricted as it would have been for the original caller.

- **Pros**
  - Allows us to still provide the SOAP Proxy functionality
- **Cons**
  - Significant management overhead dealing with certificate acquisition, configuration, permissions, renewals, etc.

## Links

- \[{Link name}]\(link to external resource)
- ...
