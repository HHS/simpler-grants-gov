# Simpler needs to store and lifecycle documents associated with Opportunities, which we will do via AWS S3 buckets

- **Status:** Active<!-- REQUIRED -->
- **Last Modified:** 2024-10-18 <!-- REQUIRED -->
- **Related Issue:** [#2277](https://github.com/HHS/simpler-grants-gov/issues/2277) <!-- RECOMMENDED -->
- **Deciders:** Matt Dragon, Aaron Couch, Kai Siren, Michael Chouinard, Lucas Brown<!-- REQUIRED -->
- **Tags:** nofo, document, attachment, s3, storage <!-- OPTIONAL -->

## Context and Problem Statement

Opportunities include supporting documents that help define the opportunity, provide more instructions about applying, or otherwise supplement the Opportunity Listing. These documents represent individual files, sometimes within a folder/directory hierarchy that are provided to the Grant Seekers as a single Zip download currently. Among these files is one very special file, the Notice of Funding Opportunity (NOFO) that every Opportunity must publish.

## Decision Drivers <!-- RECOMMENDED -->

- Use the AWS and Nava platforms whenever feasible
- Minimize cost per file (there will be a large number of files, but most will be rarely, if ever, accessed once the Opportunity closes)
- Ease of processing - Use the best tools, with already supported libraries as they're intended
- Follow best practices

## Options Considered

- [AWS Simple Storage Service (S3)](#aws-simple-storage-service-s3-buckets) bucket(s)
- [Store files in PostgreSQL](#store-files-in-postgresql)
- [Other off-the-shelf or homegrown storage solution](#other-off-the-shelf-or-homegrown-storage-solution)

## Decision Outcome <!-- REQUIRED -->

Chosen option: "AWS S3", because it represents the lowest Total Cost of Ownership (TCO) and industry best practices, including baked in support for access control for files, backups, etc. We will use 2 buckets, one for Published Opportunities, and one for DRAFT Opportunities. When an Opportunity is Published we'll ensure that the associated documents are copied to the Published bucket, making them accessible to the general public. Prior to publishing the documents will be accounted for in S3, so that the file storage is consistent throughout the lifecycle, but only the Publishing Service will have access to the files, ensuring they are not released to the public before the Opportunity and they can be revoked from public view if the Opportunity is accidentally Published.

### Positive Consequences <!-- OPTIONAL -->

- Cost can be managed in trade off with performance profile of requests for files
- Directly integrates with the AWS Content Delivery Network(CDN), CloudFront
- Existing tooling/API allows for manipulation of files from the Publishing System and manually if needed.
- S3 API is standard mimicked/supported by other cloud storage providers if we ever wanted to move these files elsewhere.

### Negative Consequences <!-- OPTIONAL -->

- Requires it's own management if we wanted to sync the files to another environment
- Disconnects the lifecycle from data in the DB, so any archiving/deleting of files doesn't happen automatically

## Pros and Cons of the Options <!-- OPTIONAL -->

### AWS Simple Storage Service (S3) bucket(s)

Utilize the AWS S3 Service to store/host files. This problem is precisely what S3 was built to solve. It provides strong tooling, monitoring, logging, all built and ready to use. We can architect in such a way that files get scanned before being placed in the final bucket, and get very fine grained support for file versioning, backups, lifecycle, etc. <!-- OPTIONAL -->

- **Pros**
  - Cost can be managed in trade off with performance
  - Integrates with AWS Content Delivery Network(CDN), CloudFront
  - Existing tooling/API
  - S3 API is standard mimicked/supported by other cloud storage providers if we ever wanted to move these files elsewhere.
  - Built in support for auto-expiring links (which we want at least in the near term until we come up with more of a final structure/naming strategy)
- **Cons**
  - Another separate resource to manage if we're trying to sync/simulate Prod with other environments

### Store files in PostgreSQL

The existing system stores the contents of the files in the Oracle DB. This is also possible in PostgreSQL <!-- OPTIONAL -->

- **Pros**
  - Single data source to backup, move between environments, etc.
  - Simplified architecture as all communication is just with the DB server
  - Files and DB records share the same lifecycle so full end-to-end delete/clean up is easier
- **Cons**
  - Bloats the DB with file storage which likely will rapidly outpace proper DB row storage
  - Makes the DB a bigger performance bottleneck as it's now handling both app data and file storage/serving responsibilities
  - Difficult if not impossible to virus/malware scan files stored in this way
  - Makes backups more costly and difficult to move around due to increased size

### Other off-the-shelf or homegrown storage solution

Implement an existing off-the-shelf file storage server or build our own<!-- OPTIONAL -->

- **Pros**
  - If we built our own it would be a custom fit, do exactly what we needed and nothing more
  - Off-the-Shelf might be cheaper
- **Cons**
  - Off-the-Shelf
    - We own everything, storage redundancy, security, patching/upgrades, Ops
    - Additional vendor contract, security assessment, relationship to manage
    - Data leaves our AWS VPC Secure Environment
  - Roll our own
    - This isn't the core value of the system that justifies building our own

## Links <!-- OPTIONAL -->

- [AWS Simple Storage Service (S3)](https://aws.amazon.com/s3/)
- Alternatives
  - [Ceph](https://ceph.io/en/)
  - [Backblaze B2](https://www.backblaze.com/cloud-storage)
  - [Wasabi Hot Cloud Storage](https://wasabi.com/cloud-object-storage)
  - [List of Alternatives](https://medium.com/@paulgoll/aws-s3-alternatives-in-2024-3918651f77d9)
