# Data Replication Strategy & Tool

- **Status:** Draft
- **Last Modified:** 2023-09-15
- **Related Issue:** [#322](https://github.com/HHS/grants-equity/issues/322)
- **Deciders:** Lucas Brown, Billy Daly, Sammy Steiner, Daphne Gold, Aaron Couch
- **Tags:** Hosting, Infrastructure, Database

## Context and Problem Statement

The Beta.Grants.Gov platform will need to consume live grants data securely and without impacting grants.gov performance. However, the production database was not planned to support additional load to the database from the beta api. The beta work will also want to test schema changes to the database to facilitate new queries and lifecycle tracking that will not be possible in the production database.

Additionally, the grants.gov database resides in another AWS account, which complicates access and security concerns. Any solution in production will need to comply with HHS security policies, be included on a security impact assessment (SIA), use tools and controls in or added to the System Security Plan (SSP), and not jeopardize the security of the environment with Approval to Operate (ATO).

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

## Security Implications

#### AWS DMS Service

The DMS service is a FedRAMP compliant service that sits in the target database's (beta team's) VPC, and is responsible for reading data from the source databases when there are changes and writing them to the target database. All traffic through DMS is [encrypted in transit and at rest](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Security.DataProtection.html). In addition to FedRAMP compliance, DMS is in compliance with many other compliance programs demonstrating its high security standards, including: SOC, PCI, ISO, FedRAMP, DoD CC SRG, HIPAA BAA, MTCS, CS, K-ISMS, ENS High, OSPAR, and HITRUST CSF. You can read more [DMS Compliance information, including FedRAMP, on its dedicated page](https://docs.aws.amazon.com/dms/latest/userguide/dms-compliance.html).

Tools are of course only as secure as the way they are configured and used. For our purposes, since we are effectively looking to create a read-only replica of the database, we only require SELECT permissions for the DMS instance role on the source database, as described in this [aws guide on configuring OracleDB as a source database](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.Oracle.html).

Between the limited scope of the DMS instance user access to the MicroHealth database, and the extensive security testing and controls of DMS as a service, DMS seems like a secure solution to replicating the data from the grants.gov AWS account to the beta AWS account.

#### VPC Peering

When permitting network traffic between two VPCs in AWS, [AWS provides several solutions and guidance on others](https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/amazon-vpc-to-amazon-vpc-connectivity-options.html). Several of the options are discussed in the Pros and Cons section below, however VPC Peering seems to be the best fit for our use case and as secure or more secure than the other options. [VPC Peering is FedRAMP compliant](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/), keeps traffic off the public internet, encrypts traffic in transit, and provides tools to manually secure the connection between the VPCs even further. Some of the manual controls include restricting VPC Peering to a specific CIDR block, or subnet, and using security groups to limit traffic protocol, origin, and destination port. In practice, we can limit traffic through the VPC Peering connection, which is all encrypted and off the public internet, to come from only the beta DMS instance and go to only the grants.gov database subnet or load balancer, using a specific protocol, and targeting a specific port. All other traffic will be denied.

AWS PrivateLink is not FedRAMP compliant. Notice it is not included on the [List of FedRAMP compliant AWS services](https://aws.amazon.com/compliance/services-in-scope/FedRAMP/), however it is included on the [List of Canadian Center for Cyber Security compliant services](https://aws.amazon.com/compliance/services-in-scope/CCCS/), which shows its exclusion from the FedRAMP list isn't an oversight. Additionally, AWS PrivateLink does not encrypt traffic in transit as stated explicitly under the Security and Filtering section of [AWS PrivateLink FAQ](https://aws.amazon.com/privatelink/faqs/#Security_and_filtering). AWS PrivateLink is more expensive than VPC Peering, assuming the VPCs are in the same AZ, which is our plan, [data transfer is free with VPC Peering](https://aws.amazon.com/about-aws/whats-new/2021/05/amazon-vpc-announces-pricing-change-for-vpc-peering/), but AWS PrivateLink has a [service fee and data transfer bandwidth fee](https://aws.amazon.com/privatelink/pricing/).

AWS Transit Gateway has a similar security posture to VPC Peering as [the underlying technology is the same](https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/transit-gateway.html#:~:text=It%20uses%20the%20same%20underlying%20infrastructure%20as%20VPC%20peering), however, that solution is optimized for a hub and spoke VPC architecture with thousands of connected VPCs and is overly complicated for two VPCs to connect to each other.

Non AWS solutions require traffic to leave the AWS network and [traverse the public internet via internet gateways](https://docs.aws.amazon.com/whitepapers/latest/aws-vpc-connectivity-options/software-vpn-1.html). While that traffic can be encrypted with a VPN, that is inherently less secure than keeping the traffic within the AWS boundary.

## Implementation Guide

After reviewing the AWS documentation on configuring DMS where the target and source database reside in different VPCs, the recommended approach is to use AWS DMS with VPC Peering to permit the necessary traffic. The following details the division of tasks between Nava and MicroHealth to set up the necessary services.

VPC Peering must be configured before DMS can complete, however in order to limit VPC Peering traffic to only DMS, the DMS instance and subnet must be created with its CIDR block and IP address to share with MicroHealth for updating their route tables.

#### VPC Peering

##### Nava
- Confirm there are no overlapping IPv4 or IPv6 CIDR blocks
  - if there are overlapping CIDR blocks create a new VPC with non overlapping CIDR blocks and migrate resources
- Info to share with MicroHealth
  - DMS security group ID
  - DMS instance subnet CIDR block
  - DMS instance IP address
- [Create vpc peering connection](https://docs.aws.amazon.com/vpc/latest/peering/create-vpc-peering-connection.html)
- [Update your security groups to reference peer security groups](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-security-groups.html)
- - [Update route tables for peering connection to the db subnet](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-routing.html) or to a [specific IP address](https://docs.aws.amazon.com/vpc/latest/peering/peering-configurations-partial-access.html)


##### MicroHealth
- Confirm there are no overlapping IPv4 or IPv6 CIDR blocks
- Share information with Nava:
  - Region information for the VPC
  - AZ info for the DB
  - Account ID
  - VPC ID
  - Database or new data replication security group ID
- [Accept VPC Peering connection request](https://docs.aws.amazon.com/vpc/latest/peering/accept-vpc-peering-connection.html)
- [Update route tables for peering connection to the db subnet](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-routing.html)
- [Update route tables for peering connection to the db subnet](https://docs.aws.amazon.com/vpc/latest/peering/vpc-peering-routing.html) or to a [specific IP address](https://docs.aws.amazon.com/vpc/latest/peering/peering-configurations-partial-access.html)


#### AWS DMS Service

##### Nava
- Create a user with AWS Identity and Access Management (IAM) credentials that allows you to launch Amazon RDS and AWS Database Migration Service (AWS DMS) instances in your AWS Region.
- Size your target PostgreSQL database host based on the current db host load profile.
- Create the schemas in the target database
- Create the AWS DMS user to connect to your target database, and substitute our own username and password:
  - ```
    CREATE USER <postgresql_dms_user> WITH PASSWORD '<password>';
    ALTER USER <postgresql_dms_user> WITH SUPERUSER;
    ```
- Create a user for AWS SCT.
  - ```
    CREATE USER <postgresql_sct_user> WITH PASSWORD '<password>';
    GRANT CONNECT ON DATABASE database_name TO <postgresql_sct_user>;
    GRANT USAGE ON SCHEMA schema_name TO <postgresql_sct_user>;
    GRANT SELECT ON ALL TABLES IN SCHEMA schema_name TO <postgresql_sct_user>;
    GRANT ALL ON ALL SEQUENCES IN SCHEMA schema_name TO <postgresql_sct_user>;
    ```
- [Convert the Oracle Schema to PostgreSQL](https://docs.aws.amazon.com/dms/latest/sbs/chap-rdsoracle2postgresql.steps.convertschema.html)
- [Create an AWS DMS Replication Instance](https://docs.aws.amazon.com/dms/latest/sbs/chap-rdsoracle2postgresql.steps.createreplicationinstance.html) using terraform
- [Create AWS DMS Source and Target Endpoints](https://docs.aws.amazon.com/dms/latest/sbs/chap-rdsoracle2postgresql.steps.createsourcetargetendpoints.html)
- [Create and Run Your AWS DMS Migration Task](https://docs.aws.amazon.com/dms/latest/sbs/chap-rdsoracle2postgresql.steps.createmigrationtask.html)

##### MicroHealth
- Communicate the load profile of the current source Oracle database host. Consider CPU, memory, and IOPS.
- ensure that ARCHIVELOG MODE is on to provide information to LogMiner. AWS DMS uses LogMiner to read information from the archive logs so that AWS DMS can capture changes.
  - Retaining archive logs for 24 hours is usually sufficient
- supplemental logging to be enabled on your source database
- identification key logging be enabled
  - You can set this option at the database or table level
- Create or configure a database account to be used by AWS DMS
  - [Instructions Guide](https://docs.aws.amazon.com/dms/latest/userguide/CHAP_Source.Oracle.html)
  - AWS DMS requires the following privileges (note, there is one create for session, the rest are select)
  - ```
    GRANT CREATE SESSION TO <db_user>;
    GRANT SELECT ANY TRANSACTION TO <db_user>;
    GRANT SELECT ON V_$ARCHIVED_LOG TO <db_user>;
    GRANT SELECT ON V_$LOG TO <db_user>;
    GRANT SELECT ON V_$LOGFILE TO <db_user>;
    GRANT SELECT ON V_$LOGMNR_LOGS TO <db_user>;
    GRANT SELECT ON V_$LOGMNR_CONTENTS TO <db_user>;
    GRANT SELECT ON V_$DATABASE TO <db_user>;
    GRANT SELECT ON V_$THREAD TO <db_user>;
    GRANT SELECT ON V_$PARAMETER TO <db_user>;
    GRANT SELECT ON V_$NLS_PARAMETERS TO <db_user>;
    GRANT SELECT ON V_$TIMEZONE_NAMES TO <db_user>;
    GRANT SELECT ON V_$TRANSACTION TO <db_user>;
    GRANT SELECT ON V_$CONTAINERS TO <db_user>;
    GRANT SELECT ON ALL_INDEXES TO <db_user>;
    GRANT SELECT ON ALL_OBJECTS TO <db_user>;
    GRANT SELECT ON ALL_TABLES TO <db_user>;
    GRANT SELECT ON ALL_USERS TO <db_user>;
    GRANT SELECT ON ALL_CATALOG TO <db_user>;
    GRANT SELECT ON ALL_CONSTRAINTS TO <db_user>;
    GRANT SELECT ON ALL_CONS_COLUMNS TO <db_user>;
    GRANT SELECT ON ALL_TAB_COLS TO <db_user>;
    GRANT SELECT ON ALL_IND_COLUMNS TO <db_user>;
    GRANT SELECT ON ALL_ENCRYPTED_COLUMNS TO <db_user>;
    GRANT SELECT ON ALL_LOG_GROUPS TO <db_user>;
    GRANT SELECT ON ALL_TAB_PARTITIONS TO <db_user>;
    GRANT SELECT ON SYS.DBA_REGISTRY TO <db_user>;
    GRANT SELECT ON SYS.OBJ$ TO <db_user>;
    GRANT SELECT ON DBA_TABLESPACES TO <db_user>;
    GRANT SELECT ON DBA_OBJECTS TO <db_user>; -– Required if the Oracle version is earlier than 11.2.0.3.
    GRANT SELECT ON SYS.ENC$ TO <db_user>; -– Required if transparent data encryption (TDE) is enabled. For more information on using Oracle TDE with AWS DMS, see Supported encryption methods for
                        using Oracle as a source for AWS DMS.
    GRANT SELECT ON GV_$TRANSACTION TO <db_user>; -– Required if the source database is Oracle RAC in AWS DMS versions 3.4.6 and higher.
    GRANT SELECT ON V_$DATAGUARD_STATS TO <db_user>; -- Required if the source database is Oracle Data Guard and Oracle Standby is used in the latest release of DMS version 3.4.6, version 3.4.7, and higher.
    GRANT EXECUTE on DBMS_LOGMNR to <db_user>;
    GRANT SELECT on V_$LOGMNR_LOGS to <db_user>;
    GRANT SELECT on V_$LOGMNR_CONTENTS to <db_user>;
    GRANT LOGMINING to <db_user>; -– Required only if the Oracle version is 12c or higher.
    ```
- Add the exposeViews=true extra connection attribute to your source endpoint
- Provide the username and password for the DMS db account to Nava

- Run the following command in RDS to ensure that logs are retained: `exec rdsadmin.rdsadmin_util.set_configuration('archivelog retention hours',24);`
- Run the following db command: `ALTER DATABASE ADD SUPPLEMENTAL LOG DATA;`
- Run the following command in RDS: `exec rdsadmin.rdsadmin_util.alter_supplemental_logging('ADD');`
- Run the following db command: `ALTER DATABASE ADD SUPPLEMENTAL LOG DATA (PRIMARY KEY) COLUMNS;`
- Run the following command in RDS: `exec rdsadmin.rdsadmin_util.alter_supplemental_logging('ADD','PRIMARY KEY');`
- Create a user for AWS SCT:
  - ```
    CREATE USER <oracle_sct_user> IDENTIFIED BY password;
    GRANT CONNECT TO <oracle_sct_user>;
    GRANT SELECT_CATALOG_ROLE TO <oracle_sct_user>;
    GRANT SELECT ANY DICTIONARY TO <oracle_sct_user>;
    ```

## Preparing for Production

Currently the beta AWS account is designated as a lower environment and therefore will only connect to the grants.gov lower environment. However, when we are ready, our plan is to create a second AWS account for our production environment which will then need to peer with the grants.gov production environment. Therefore, our strategy is to implement these tools and study the security impact in action to determine any security risk we need to address in production. It is also our assumption that the production environment will meet all HHS ITS security constraints, just like the grants.gov production environment. Nava will work collaboratively with MicroHealth to determine additional security measures that are necessary to ensure production environments and production data meet the necessary security standards.

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
- [Multi-VPC Network Infrastructure Whitepaper](https://docs.aws.amazon.com/whitepapers/latest/building-scalable-secure-multi-vpc-network-infrastructure/welcome.html)
