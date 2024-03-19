# Dashboard Data Storage

- **Status:** Active
- **Last Modified:** 2024-03-19
- **Related Issue:** [#{issue number}](https://github.com/HHS/simpler-grants-gov/issues/{issue number})
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

We will not be importing all of these types of data immediately. On the 0 - 6 month timeframe, we will only be importing the smaller datasets (thousands of records). By 2 - 5 years we will be importing all of these types of data, and our data size will be quite large (many millions of records). The desired solutions have different cost/performance characteristics in those time ranges, and we will need to evaluate those differences.

## Decision Drivers <!-- RECOMMENDED -->

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

Data is hosted in S3 at $0.023 per GB-month

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Redshift

AWS Redshift is a Postgres-based data warehouse that you can use to store large data sets. Redshift is optimized for OLAP queries, which makes it an ideal choice for analyzing business analytics data. 

Data is hosted in Redshift at $0.024 per GB-month, essentially the same price as S3.

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Postgres

Postgres, as hosted by AWS RDS, is a SQL database that you can use to store large data sets. Many of the characteristics that apply to Redshift apply to Postgres, with the caveat that Postgres is not built for business intelligence use cases.

Data is hosted in Postgres at $0.115 per GB-month, higher than S3 and Redshift.

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

### Snowflake

Snowflake is a data warehouse that is traditionally used to store big data for processing and analytics. Snowflake is a third-party data hosting platform, and does not have an AWS-native deployment solution. 

- **Pros**
  - Good, because {argument a}
  - Good, because {argument b}
  - ...
- **Cons**
  - Bad, because {argument c}
  - ...

## Decision Outcome

Chosen option: "{option 1}", because {justification. e.g., only option which meets a key decision driver | which satisfies x condition | ... }.
