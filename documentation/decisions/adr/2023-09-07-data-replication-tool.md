# Data Replication Strategy & Tool

- **Status:** Active
- **Last Modified:** 2023-09-14
- **Related Issue:** [#322](https://github.com/HHS/grants-equity/issues/322)
- **Deciders:** Lucas Brown, Billy Daly, Sammy Steiner, Daphne Gold, Aaron Couch
- **Tags:** Hosting, Infrastructure, Database

## Context and Problem Statement

The Beta.Grants.Gov platform will need to consume live data and apply additional load to the database that the production database was not planned to support. Therefore, we will replicate the data for the Beta.Grants.Gov work so it will have a negligible impact on the database for replication related tasks and still provide up-to-date production data.

## Decision Drivers

- Data source and destination compatibility: rep tool should support the data sources used in the project (db, file systems) and is compatible with the target destination (db, warehouses, cloud storage).
- Data volume and throughput: tool can handle the volume and throughput requirements of the data replication process efficiently.
- Data transformation capabilities: replication tool can handle data transformation during the replication process, including data format conversions and schema changes.
- Real-time vs. batch replication: determine whether real-time data replication or if batch replication at scheduled intervals is sufficient.
- Latency and performance: consider the latency and performance to ensure timely data updates and minimal impact on system performance.
- Security and encryption: replication tool provides adequate security features, including data encryption and secure data transmission.
- Monitoring and alerting: to promptly identify and address replication issues.
- Ease of use and configuration: Evaluate the tool's user-friendliness and ease of configuration, as complex setup processes can lead to inefficiencies.
- Scalability: Determine if the replication tool can scale to accommodate future growth and increased data demands.
- Cost: Consider the licensing and operational costs
- Support and community: Assess availability of support options and the size and activity of the tool's user community.

## Options Considered

### Data Replication

- Use Production Database
- Use AWS DMS (Database Migration Service)
- Create new data pipelines from data sources
- Import/Export DB snapshots weekly

### Data Traffic

- AWS VPC Pairing
- AWS PrivateLink
- Network Gateway with VPN

## Decision Outcome - Data Replication

Chosen option: Use AWS DMS, because it is the only option that allows us to deliver within our period of performance and doesn't impact the production database's ability to perform its existing role.

Additionally, [AWS DMS and AWS VPC Pairing are FedRAMP compliant](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/).

### Positive Consequences

- This solution will allow us to not only replicate the data, but transform it as well. This will allow us to pilot schema changes very quickly without having to spend the time creating new data pipelines from the original data sources
- This approach allows us to only replicate what we need when we need it, reducing the cost of replication, and limiting our security exposure.
- If we implement DMS with the intention of adding additional tables, or even replicating the entire database, this will be an agile tool to support us until we're able to deprecate the Oracle database.

### Negative Consequences

- When we want to eventually move away from the expensive Oracle database and it's unoptimized schema, this replica will need to be deprecated as well

## Decision Outcome - Data Replication

### Positive Consequences

### Negative Consequences

## Security Implications

#### AWS DMS Service

The DMS service is a FedRAMP compliant service that sits in the target database's (beta team's) VPC, and is responsible for reading data from the source databases when there are changes and writing them to the target database. All traffic through DMS is [encrypted in transit and at rest](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Security.DataProtection.html). Additionally, DMS is FedRAMP compliant and in compliance with many other compliance programs, including: SOC, PCI, ISO, FedRAMP, DoD CC SRG, HIPAA BAA, MTCS, CS, K-ISMS, ENS High, OSPAR, and HITRUST CSF. You can read more [DMS Compliance information, including FedRAMP, on its dedicated page](https://docs.aws.amazon.com/dms/latest/userguide/dms-compliance.html).

Tools are of course only as secure as the way they are configured and used. For our purposes, we only require SELECT permissions for the DMS instance role on the source database, as described in this [aws guide on configuring OracleDB as a source database](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.Oracle.html).

Between the limited scope of the DMS instance user access to the MicroHealth database, and the extensive security testing and controls of DMS as a service, DMS seems like a secure solution to replicating the data in the beta AWS account.

#### VPC Peering

[VPC Peering is FedRAMP compliant](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/)


## Implementation Guide

After reviewing the AWS documentation on configuring DMS where the target and source database reside in different VPCs, the recommended approach is to use AWS DMS with VPC Peering to permit the necessary traffic. The following details the division of tasks between Nava and MicroHealth to set up the necessary services.

#### AWS DMS Service

##### Nava

##### MicroHealth


#### VPC Peering

##### Nava

##### MicroHealth


## Pros and Cons of the Options - Data Replication

### Use Production Database

Connect to the Microhealth lower environment replica database, that contains only fixture data, for the lower environment and connect to the production database for our production environment.

- **Pros**
  - No additional cost
  - Easiest to set up
- **Cons**
  - Additional load could degrade performance of critical grants.gov operations
  - Beta environment will have access to PII data that will require security hardening to be prioritized before launch
  - No data transformation possible

### Use AWS DMS

Create a new Postgres Database in the Beta lower and production environments and configure AWS DMS to replicate select tables from the MH lower environment database for the beta lower environment and the production database for the beta production environment. This solution requires MH configure VPC Peering to allow DMS traffic between our VPCs.

For this solution we will only replicate opportunities data at first to limit the cost of storage and restrict our environment to publicly accessible data. However, we will build it with the intention of making it easy to add tables to the replication, or even replicating the entire database when that becomes necessary.

- **Pros**
  - DMS is AWS's best practice tool for our use case
  - Negligible impact to source database, even with replicating ongoing changes
  - Replicating only public data reduces our security criticality
  - Ability to transform data is part of the DMS tool and well documented
- **Cons**
  - Additional Cost
  - Networking support and coordination required from MH

### Create new data pipelines from data sources

Create new data pipelines from the source of truth similar to the production database. Instead of copying the production schema, design a new database schema that incorporates all the lessons learned from running the current production database as well as designing the new schema for additional requirements that the current schema is not optimized or able to meet.

- **Pros**
  - No impact to production database
  - Facilitates moving off expensive Oracle database
  - Can optimize database schema for current and future requirements
- **Cons**
  - We do not have clear requirements for current and existing APIs to design the schema around and will have to work on that first
  - Very long time to deliver
  - Team is not currently staffed to support this work

  ### Import/Export DB snapshots weekly

MicroHealth will export a database snapshot on a weekly basis that we will use to update our database on a weekly basis. The exports will be done during times of low database usage so as to have negligible impact on production operations. However, the data will be up to seven days old.

- **Pros**
  - Negligible impact to production database
  - Simple to do manually and also to automate
- **Cons**
  - Data will be up to 7 days old

## Pros and Cons of the Options - Data Traffic

### AWS VPC Peering

Configure AWS VPC Peering on both the Nava and MicroHealth AWS VPCs to allow traffic between the two VPCs. For security, lock down the VPC Peering to only allow traffic between the DMS instance in the Nava account and the database instance or database load balancer in the Microhealth account. All traffic between VPCs using VPC Peering is encrypted. Additionally, the traffic between VPCs stays within the AWS Global Backbone and never makes its way to the public internet. Finally, AWS VPC Peering is a FedRAMP compliant AWS feature.

- **Pros**
  - Many layers of security: encryption in transit, stays within AWS, additional manual controls
  - AWS best practice for multi-VPC DMS configuration
  - FedRAMP compliant
- **Cons**
  - Requires configuration on both Nava and MicroHealth sides

### AWS PrivateLink

Connect

- **Pros**
  -
- **Cons**
  -

### Network Gateway with VPN

Connect

- **Pros**
  -
- **Cons**
  -

## Links

- [AWS DMS](https://aws.amazon.com/dms/)
- [AWS DMS Cross VPC Config](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.VPC.html#CHAP_ReplicationInstance.VPC.Configurations.ScenarioVPCPeer)
- [What is VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
- [List of FedRAMP compliant AWS services](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/)
