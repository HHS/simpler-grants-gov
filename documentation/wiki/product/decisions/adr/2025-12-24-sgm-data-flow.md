# Simpler Grants Management Data Flow

- **Status:** Active
- **Last Modified:** 2025-12-24
- **Related Issue:** #6980
- **Deciders:** Matt, Dani, Jay, Julius, Lucus
- **Tags:** sgm, data

## Context and Problem Statement

Given the different approach for modernization of GrantSolutions we need an ongoing interoperability with the existing system, not a strangler, rebuild and replace pattern. To allow for that we need to have strategies for accessing data across the existing and modernized system that were not already designed and built for the Simpler Grants.gov work. How will we allow for bi-directional, near real-time, data flow between GrantSolutions (GS) and Simpler Grants Management (SGM).

## Decision Drivers

- Optimize User Experience
  - User's should be able to move between systems as seamlessly as possible
  - Workflows or processes should move from system to system as needed without long delays or user intervention
- Minimize time data is not in sync
  - Hourly is too slow for some data, but may be fine for other data
- Minimize needless data duplication
  - Default to working with existing data live through an existing API
  - Only copy data into SGM when there is no other option
  - Allow for new fields to be stored in SGM initially, without reproducing the whole data model.

## Options Considered

We anticipate needing to support all of these options and as we learn more about the GS data model we will align specific data with each of these approaches.

- Bulk data copy on a scheduled basis
- Call GS APIs directly as needed (no additional data points tracked)
- Call GS APIs directly as needed, store additional data points in SGM (without duplicating existing data)
- Build new APIs that access the GS data live (no existing API) and potentially store new fields in SGM

As we better understand the existing data model and architecture and the functional needs to access data with different tolerances for stale data we will place each data flow within one of these options and develop it accordingly.

## Decision Outcome

For this ADR we are not picking a single option, but rather identifying everything we anticipate needing to support and detailing our plans for those options. Depending on functional requirements and the existing technical implementation we'll be selecting one of these

### Positive Consequences

- n/a

### Negative Consequences

- n/a

## Pros and Cons of the Options

### Bulk data copy on a scheduled basis

This is the approach we took on Simpler Grants.gov. Hourly, we Extract, Load, and Transform (ELT) all of the table data we need from Grants.gov's database into Simpler Grants.gov's database. Whenever possible we only pull records updated since the last run to minimize data volume and the associated load on the existing system. We do not currently send data back to Grants.gov's database but in the SGM work that would be a requirement as well. We would modify our existing processes to support bi-directional data transfer. We could also consider improving the existing code base to allow it to run more frequently without collision and add more filtering to avoid when we fetch rows that we didn't see their FK records and so we fail to create the records (we could just only process something if we've already seen the parent record this run).

- **Pros**
  - Simple
  - Reliability proven in Simpler Grants.gov
- **Cons**
  - Too slow for some features where users will expect to move directly from GS to SGM or back and see the changes they just made accounted for
  - Would require work to run more often, or write data back to GS from SGM

### Call GS APIs directly as needed (no additional data points tracked)

Where existing GS APIs exist we'll call those. We will have to figure out how API keys/permissions would work in this scenario. We may wrap these in our existing API, or just call them directly from the NextJS API "backend" server side routes. This will be the most streamlined way to build specific screens out that are able to be integrated into existing GS usage.

- **Pros**
  - Data is always fresh, exactly as if the user was still in GS
  - Data written back via existing APIs has all of the consistency and
- **Cons**
  - Still learning what data has existing APIs that will make this possible

### Call GS APIs directly as needed, store additional data points in SGM (without duplicating existing data)

We won't be able to always mutate the GS data model as quickly as we'd want to iterate on SGM. In those cases we would store new fields in the Simpler DB, with the identifier of the record in GS. This would allow the data from both systems to be pulled together either in the API layer or in the FE via 2 API calls depending on whether we're wrapping API calls to GS in the Simpler API.

- **Pros**
  - Provides flexibility to store new data without having to work that through on the SGM side
  - Prevents impacts on the GS side, including avoiding immediate coordination around changes to data model and data pipelines, data warehouse, etc.
- **Cons**
  - Data isn't accessible in GS
  - Will need to work to consolidate the data models and data later as follow up work as the systems fully merge.

### Build new APIs that access the GS data directly (no existing API) and potentially store new fields in SGM

If we need to access data in a timely fashion and that data has not been exposed in an existing GS API, those APIs will need to be created (either on the the SGM or GS side). From SGM this would mean real-time access to the DB or other data storage in GS to allow for the data freshness requirements.

- **Pros**
  - Similar to bulk data copies on a schedule, but gives us access to the live data
- **Cons**
  - This would be the most work and the hardest to coordinate around testing and promotion.
  - Potential for performance implications within GS

## Links

- \[{Link name}]\(link to external resource)
- ...
