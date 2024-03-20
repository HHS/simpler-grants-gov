# Dashboard Data Storage

- **Status:** Active
- **Last Modified:** 2024-03-19
- **Related Issue:** [#1506](https://github.com/HHS/simpler-grants-gov/issues/1506)
- **Deciders:** Aaron Couch, Billy Daly

## Context and Problem Statement

We want to determine the data storage solution for our upcoming business intelligence dashboard project.

This data storage solution will be our canonical source of truth for many types of imported data. These data types will range from thousands of records a month (ex. sprint data), up to potentially millions of records of records (ex. Google Analytics) once this project reaches maturity. The chosen solution should be easy to use, cost-effective, and performant for all of our in-scope data types. The types of data we will be importing include:

- Google Analytics
- Grants program data, eg.
  - Grants opportunities from the database
  - Grant applications from S3
- USA spending data CSVs
- Communication platform stats, eg.
  - Slack stats
  - Google Group stats
  - GitHub stats
- API application metrics
- API infrastructure metrics from Cloudwatch

We will not be importing all of these types of data immediately. On the 0 - 6 month timeframe, we will only likely only be  importing the smaller datasets (thousands of records), with the exception of the infrastructure metrics. By 2 - 5 years we will be importing all of these types of data, and our data size will be quite large (many millions of records). The desired solutions have different cost/performance characteristics in those time ranges, and we will need to evaluate those differences.

That said, with respect to data size, there is still a large outstanding question. For those sources of data, do we want to ingest point level data (e.g. individual page views, clicks, and API calls) or do we want to do some level of aggregation before loading it into our data warehouse. Choosing to pre-aggregate the data would decrease the total size of our data across every time range.

## Decision Drivers

- cost
- ease of use
- performance

All of these options should be evaluated for 0 - 6 months, 6 months - 2 years, 2 years - 5 years

## Options Considered

- S3
- Redshift
- Postgres
- Snowflake

## Pros and Cons of the Options

### S3

AWS S3 is a file storage system, traditionally used to store data in the form of individual documents. S3 is best for storing data types formatted as individual documents, or data types where all of the relevant data can be stored within a single file. Due to that, S3 becomes non-ideal for anything in the millions of records, particularly when those records are split up across multiple files. S3 is best in a business intelligence context when used with small datasets, such as our GitHub data. Large data sets require a query layer to be integrated into S3, a query layer like AWS Athena or AWS Redshift. For large enough data sizes, performance starts to become the key issue with S3.

[Data is hosted in S3 at $0.023 per GB-month](https://aws.amazon.com/s3/pricing/).

At 0 - 6 months, S3 is a reasonable choice due to our small data sizes. Past that point, performance issues with large data sizes make S3 a non-ideal choice.

At 2 - 5 years, S3's performance issues require the introduction of another query / compute layer like AWS Athena or AWS Redshift.

### Redshift

AWS Redshift is a Postgres-based data warehouse that you can use to store large data sets. This ADR assumes we are going to be using Redshift Serverless, rather than statically provisioned Redshift. We assume that serverless technologies will work in this case because this is a data warehouse backed by an ELT process, so it's data is not being accessed most of the time. Redshift is optimized for OLAP queries, which makes it an ideal choice for analyzing business analytics data. To query CSV data in Redshift, you must first upload it to S3 and then into Redshift, which makes Redshift feel like a "query layer" for S3.

[Data is hosted in Redshift at $0.024 per GB-month](https://aws.amazon.com/redshift/pricing/), essentially the same price as S3.

At 0 - 6 months, Redshift loses to S3 due to S3 being vastly easier to set up and configure.

At 6 months - 2 years, Redshift starts to beat S3 as the initial setup cost has already been paid, and Redshift will start to show performance advantages relative to S3.

At 2 - 5 years, performance bottle-necks with S3 mean that Redshift easily wins any comparison.

### Postgres

Postgres, as hosted by AWS RDS, is a SQL database that you can use to store large data sets. Many of the characteristics that apply to Redshift apply to Postgres, with the caveat that Postgres is not built for business intelligence use cases. We have an existing Postgres database, but we would not want to re-use it for our data analytics purposes.

[Data is hosted in Postgres at $0.115 per GB-month](https://aws.amazon.com/rds/postgresql/pricing/), higher than S3 and Redshift.

In every time range, Postgres loses to Redshift due to Postgres being an OLTP database built for real-time data processing. In the 2 - 5 year range, Postgres also loses due to its high GB-month hosting cost.

### Snowflake

Snowflake is a data warehouse that is traditionally used to store big data for processing and analytics. Snowflake is a third-party data hosting platform and does not have an AWS-native deployment solution. Deploying Snowflake would require us to either self-host the database or build the infrastructure to connect our systems with an externally managed service. Similarly to Redshift, Snowflake is an OLAP optimized data warehouse, that is well-designed for business analytics queries.

At 0 - 6 months, Snowflake loses to Redshift due to Redshift being vastly easier to set up and configure.

At 6 months - 2 years, Snowflake and Redshift are essentially identical solutions.

At 2 - 5 years, Snowflake may start to show cost and performance advantages relative to Redshift. Hard evidence to back this up is hard to come by, though.

## Decision Outcome

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.
