# Search Engine: OpenSearch

- **Status:** Active <!-- REQUIRED -->
- **Last Modified:** 2024-10-03 <!-- REQUIRED -->
- **Related Issue:** [#2200](https://github.com/HHS/simpler-grants-gov/issues/2200) <!-- RECOMMENDED -->
- **Deciders:** Michael Chouinard, Kai Siren, Aaron Couch <!-- REQUIRED -->
- **Tags:** search, api, backend, infra, opensearch, elastic, database <!-- OPTIONAL -->

## Context and Problem Statement

Simpler needs to surface Grant Opportunities to Grant Seekers to ensure that they're able to discover grants that could support their communities. This begins with a powerful and performant search page with strong filtering and sorting capabilities, but also includes the ability to do recommendation and other second-order matching/similarity functionality that goes beyond search. We want to select a search backend that will support rapid development, and long term features and success.

## Decision Drivers <!-- RECOMMENDED -->

- Better Search relevance for grant seakers
- Ease of data ingestion/querying of data via the API
- Operational ease/performance
- Project mandate to lean in to Open Source

## Options Considered

- Roll our own search engine in [PostgreSQL]()
- [Elastic Search](https://www.elastic.co/)
- [OpenSearch](https://opensearch.org/)

## Decision Outcome <!-- REQUIRED -->

Chosen option: "OpenSearch" because:

- Rolling our own doesn't make sense so that eliminates PostgreSQL
- Elastic had licensing issues/controversy that they've since walked back but has lost the trust of the Open Source community
- OpenSearch largely tracks Elastic, but has a dedicated community and is direcly committed to avoiding situations like Elastic experienced.

### Positive Consequences <!-- OPTIONAL -->

- Using a dedicated search product provides a ton of functionality and features out of the box
- An isolated search engine allows us to scale/tune independently of the operational database.
- The "search queries" have documented syntax, an existing testing/troubleshooting environment, and can share expertise across Nava teams.

### Negative Consequences <!-- OPTIONAL -->

- Additional infra/spend compared to utilizing an existing product we're already hosting

## Pros and Cons of the Options <!-- OPTIONAL -->

### PostgreSQL

Utilize some PostgreSQL supported SQL syntax to do searches as SQL SELECT queries <!-- OPTIONAL -->

- **Pros**
  - No additional infra/cost
  - Infra already exists
  - Very quick, but very bad, MVP implementation
  - Works with existing data we're already tracking, no data sync needed
- **Cons**
  - Not a well used/documented portion of the product functionality
  - Potential for issues scaling since it would require scaling the entire DB
  - Harder to support new search features, onboard new developers, etc.
  - Slow queries

#### Elastic Search

Stand up Elastic Search, pump Opportunity data in, use search DSL to power search <!-- OPTIONAL -->

- **Pros**
  - Managed AWS service
  - Scales up/down independently of DB load
  - Purpose built for exact use case
  - Fast queries
  - Developed/Supported by a commercial entity
- **Cons**
  - Additional infra/cost
  - Recent licensing/open source feud/issues hurt the product's standing in the developer/customer realms
  - Data from DB must be kept up-to-date in the search engine

### OpenSearch

Stand up OpenSearch, pump Opportunity data in, use search DSL to power search <!-- OPTIONAL -->

- **Pros**
  - Managed AWS service
  - Scales up/down independently of DB load
  - Purpose built for exact use case
  - Fast queries
  - Actively developed/supported by the Open Source Community
  - Open Source/Licensing in good standing
- **Cons**
  - Additional infra/cost
  - Data from DB must be kept up-to-date in the search engine
  - Features/improvements may lag Elastic Search a bit since it's not commercially funded
