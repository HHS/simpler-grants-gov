# Data Replication Strategy & Tool

- **Status:** Active
- **Last Modified:** 2023-09-14
- **Related Issue:** [#322](https://github.com/HHS/grants-equity/issues/322)
- **Deciders:** Lucas Brown, Billy Daly, Sammy Steiner, Daphne Gold, Aaron Couch
- **Tags:** Hosting, Infrastructure, Database

## Context and Problem Statement

The Beta.Grants.Gov platform will need to consume live grants data securely and without impacting grants.gov performance. However, the production database was not planned to support additional load to the database from the beta api. The beta work will also want to test schema changes to the database to facilitate new queries and lifecycle tracking that will not be possible in the production database. Additionally, the grants.gov database resides in another AWS account, which complicates access and security concerns.

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

## Decision Outcome - Data Traffic

Chosen option: Use AWS VPC Peering, because it is the most secure option for permitting traffic between two VPCs in AWS and is the AWS recommended tool for Multi-VPC DMS database replication. Aside from being FedRAMP compliant, and ensuring all traffic between VPCs is encrypted, it also keeps the traffic off the public internet which makes it harder for bad actors to capture that traffic.

In support of this decision, MicroHealth and Nava will need to work together to limit the traffic between VPCs to only the necessary services, over the necessary ports, using only the necessary protocols. This will need to be configured with security groups in both the MicroHealth and Nava AWS accounts.

### Positive Consequences
- If we require more services within the VPCs to talk with each other, we will already have a tool configured for that

### Negative Consequences
- This tool assumes MicroHealth and Nava will put security controls in place to limit the permitted traffic to only what's necessary, which will take some coordination between MicroHealth and Nava

## Preparing for Production

Currently the beta aws account is designated as a lower environment and therefore will only connect to the grants.gov lower environment. However, when we are ready, our plan is to create a second AWS account for our production environment which will then need to peer with the grants.gov production environment. Therefore, our strategy is to implement these tools and study the security impact in action to determine any security risk we need to address in production. It is also our assumption that the production environment will meet all HHS ITS security constraints and will be ATO'd, just like the grants.gov production environment. Nava will work collaboratively with MicroHealth to determine additional security measures that are necessary to ensure production environments and production data meet the necessary security standards.

At this point, we are only considering reading from the production database, however, for beta.grants.gov to reach feature parity with grants.gov we will need to write to the database as well. Several approaches to that will need to be considered. The goal is to eventually deprecate the oracle database and migrate to a postgres database with an improved schema to facilitate more robust opportunity querying and opportunity lifecycle tracking. There will be a time before that third database is created that both applications will need to write data that can be read by both applications. Option 1 is to have each application write to its own database and have DMS replicate the changes in two directions instead of just one. Option 2 is to have the beta api send post requests to the grants.gov database directly and have DMS replicate those changes to the beta database. Option 1 will require enhanced permissions for the DMS instance and option 2 will require db access for the beta api using the network connection decided on here. Another ADR will be written, in collaboration with MicroHealth before making that transition, with the benefit of our collective experience with DMS and VPC Peering security to determine the best course of action.

## Security Implications

#### AWS DMS Service

The DMS service is a FedRAMP compliant service that sits in the target database's (beta team's) VPC, and is responsible for reading data from the source databases when there are changes and writing them to the target database. All traffic through DMS is [encrypted in transit and at rest](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Security.DataProtection.html). In addition to FedRAMP compliance, DMS is in compliance with many other compliance programs demonstrating its high security standards, including: SOC, PCI, ISO, FedRAMP, DoD CC SRG, HIPAA BAA, MTCS, CS, K-ISMS, ENS High, OSPAR, and HITRUST CSF. You can read more [DMS Compliance information, including FedRAMP, on its dedicated page](https://docs.aws.amazon.com/dms/latest/userguide/dms-compliance.html).

Tools are of course only as secure as the way they are configured and used. For our purposes, since we are effectively looking to create a read-only replica of the database, we only require SELECT permissions for the DMS instance role on the source database, as described in this [aws guide on configuring OracleDB as a source database](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.Oracle.html).

Between the limited scope of the DMS instance user access to the MicroHealth database, and the extensive security testing and controls of DMS as a service, DMS seems like a secure solution to replicating the data from the grants.gov AWS account to the beta AWS account.

#### VPC Peering

When permitting network traffic between two VPCs in AWS, [AWS provides several solutions and guidance on others](https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/amazon-vpc-to-amazon-vpc-connectivity-options.html). Several of the options are discussed in the Pros and Cons section below, however VPC Peering seems to be the best fit for our use case and as secure or more secure than the other options. [VPC Peering is FedRAMP compliant](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/), keeps traffic off the public internet, encrypts traffic in transit, and provides tools to manually secure the connection between the VPCs even further. Some of the manual controls include restricting VPC Peering to a specific CIDR block, or subnet, and using security groups to limit traffic protocol, origin, and destination port. In practice, we can limit traffic through the VPC Peering connection, which is all encrypted and off the public internet, to come from only the beta DMS instance and go to only the grants.gov database subnet or load balancer, using a specific protocol, and targeting a specific port. All other traffic will be denied.

AWS PrivateLink is not FedRAMP compliant, does not encrypt traffic in transit, and is more expensive than VPC Peering.

AWS Transit Gateway has a similar security posture to VPC Peering as much of the underlying technology is the same, however, that solution is optimized for a hub and spoke VPC architecture and is overly complicated for two VPCs to connect to each other.

Non AWS solutions require traffic to leave the AWS network and traverse the public internet. While that traffic can be encrypted with a VPN, that is inherently less secure than keeping the traffic within the AWS boundary.

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
  - No additional cost for data storage
  - Easiest to set up
- **Cons**
  - Additional load and db connections could degrade performance of critical grants.gov operations
  - No data transformation possible
  - Significantly increases traffic between VPCs
  - beta application and availability will be dependant on grant.gov's database availability without necessary alarms or troubleshooting access

### Use AWS DMS

Create a new Postgres Database in the Beta lower and production environments and configure AWS DMS to replicate select tables from the MH lower environment database for the beta lower environment and the production database for the beta production environment. This solution requires MH configure VPC Peering to allow DMS traffic between our VPCs.

For this solution we will only replicate opportunities data at first to limit the cost of storage and restrict our environment to publicly accessible data. However, we will build it with the intention of making it easy to add tables to the replication, or even replicating the entire database when that becomes necessary.

- **Pros**
  - DMS is AWS's best practice tool for our use case
  - Negligible impact to source database, even with replicating ongoing changes
  - Replicating only public data reduces our security criticality
  - Ability to transform data is part of the DMS tool and well documented
  - Ensures that beta.grants.gov service remains available even if grants.gov has unexpected or planned downtime
  - Limits the cross VPC traffic to just DMS
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
  - Many layers of security: encryption in transit, traffic stays off public internet, additional manual controls
  - AWS best practice for multi-VPC DMS configuration
  - FedRAMP compliant
  - Free to operate
- **Cons**
  - Requires configuration on both Nava and MicroHealth sides
  - cost for bandwidth

### AWS PrivateLink

AWS PrivateLink provides private connectivity between virtual private clouds (VPCs), supported AWS services, and on-premises networks without exposing  traffic to the public internet. Using AWS PrivateLink a VPC can expose interface VPC endpoints, similar to APIs, for others to query. This is a one way connection through a VPC barrier, instead of the two way connection provided by VPC Peering. Additionally, other security tools can be leveraged to enhance security of AWS PrivateLink, like security groups and VPC endpoint policies, which is similar to VPC Peering. AWS PrivateLink is compatible with DMS across VPCs, however it is not FedRAMP compliant.

- **Pros**
  - One way connection
  - Traffic stays off the public internet
- **Cons**
  - Does not provide encryption
  - Anyone can connect
  - Not FedRAMP compliant
  - There is a cost to operate and cost for bandwidth

### AWS Transit Gateway

The AWS Transit service consolidates the AWS VPC routing configuration for a region with a hub-and-spoke architecture. This service uses the same technology as VPC Peering, but instead of connecting VPC directly, they connect through another service called a Transit Gateway. This solution is recommended if many VPCs need to connect to each other across regions as VPC Peering gets significantly more complicated when more than a few VPCs are involved.

- **Pros**
  - Similar to VPC Peering
- **Cons**
  - More complicated to implement than VPC Peering
  - More expensive than VPC Peering

## Links

- [AWS DMS](https://aws.amazon.com/dms/)
- [AWS DMS Cross VPC Config](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_ReplicationInstance.VPC.html#CHAP_ReplicationInstance.VPC.Configurations.ScenarioVPCPeer)
- [What is VPC Peering](https://docs.aws.amazon.com/vpc/latest/peering/what-is-vpc-peering.html)
- [List of FedRAMP compliant AWS services](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/)
- [AWS VPC to AWS VPC Connectivity Options](https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/amazon-vpc-to-amazon-vpc-connectivity-options.html)
