# Dashboard Data Storage

- **Status:** Active
- **Last Modified:** 2024-04-10
- **Related Issue:** [#1507](https://github.com/HHS/simpler-grants-gov/issues/1507)
- **Deciders:** Aaron Couch, Billy Daly

## Context and Problem Statement

We are looking to implement a BI (Business Intelligence) tool for Simpler. The BI tool will be the centerpiece of our "Delivery Dashboard" work.
A BI tool is software designed to analyze, process, and visualize large volumes of data to help organizations make informed decisions. These tools gather data from various sources, including databases, spreadsheets, and cloud services, and transform it into actionable insights through reports, dashboards, and interactive visualizations. BI tools often include features such as data querying, data mining, statistical analysis, and predictive modeling to uncover trends, patterns, and correlations within the data.

Adopting a BI tool will be instrumental in optimizing decision-making processes and enhancing our delivery practices. BI tools enable agencies to analyze vast amounts of data efficiently, helping to identify trends, patterns, and areas for improvement. By harnessing the power of BI, we can improve resource allocation, monitor program effectiveness, and ensure transparency and accountability in our operations. Furthermore, BI tools facilitate evidence-based decision making by providing us with timely and accurate insights into our needs and trends. Leveraging BI will empower Simpler to better serve citizens, drive efficiencies, and achieve our project goals.

## Desired Solution

We will evaluate the BI tool based on the following capabilities and attributes:

- Ability to share public dashboards
- Ability to show private dashboards to selected users
- Ability to connect to common data sources (S3, Redshift, Postgres)
- Allows technical users to create ad hoc queries to create graphs
- Easy-to-use UI for non-coders
- Replicable for users outside of the project
- Cost of ownership
- Ease of deployment
- Account configuration

## Solution Options

The possible solution space here is quite large, but we have narrowed it down to 5 to options total, only 2 of which are evaluated in this ADR. Only 2 options were thoroughly evaluated in the interest of time. The 5 total options we evaluated are listed below.

- AWS QuickSight - evaluated below
- Metabase - evaluated below
- Tableau
- Redash
- Apache Superset

### AWS QuickSight

> AWS QuickSight is a cloud-based Business Intelligence (BI) service provided by Amazon Web Services (AWS). It enables users to easily create and share interactive dashboards and visualizations from various data sources, including AWS services, databases, and third-party applications. QuickSight offers features such as ad-hoc analysis, machine learning-powered insights, and seamless integration with AWS services like Amazon Redshift, Amazon RDS, and Amazon S3. It provides users with the ability to explore data through drag-and-drop interfaces, create custom visualizations, and perform advanced analytics without requiring extensive technical expertise. With pay-as-you-go pricing and scalability, QuickSight offers an accessible and cost-effective solution for organizations looking to harness the power of BI in the cloud.

Here's how QuickSight evaluates against our criteria:

- ✅ Ability to share public dashboards - [AWS QuickSight supports public dashboards](https://docs.aws.amazon.com/quicksight/latest/user/embedded-analytics-1-click-public.html)
- ✅ Ability to show private dashboards to selected users - [AWS QuickSight supports access controlled dashboards](https://docs.aws.amazon.com/quicksight/latest/user/sharing-a-dashboard.html)
- ✅ Ability to connect to common data sources (S3, Redshift, Postgres) - [AWS QuickSight supports common data sources](https://docs.aws.amazon.com/quicksight/latest/user/supported-data-sources.html)
- ✅ Allows technical users to create ad hoc queries to create graphs - [AWS QuickSight supports creating a variety of visual types](https://docs.aws.amazon.com/quicksight/latest/user/working-with-visual-types.html)
- ✅ Easy-to-use UI for non-coders - Subjectively, the AWS QuickSight UI was found to be easy to use.
- ❌ Replicable for users outside of the project - AWS QuickSight is not open source, so its results can only replicated by having access to our AWS account
- Cost of ownership - A rough estimate puts AWS QuickSight at about ~$300/month for our quantity of users. [Pricing page.](https://aws.amazon.com/quicksight/pricing/)
- ✅✅ Ease of deployment - [AWS QuickSight can be deploy via Terraform](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/quicksight_account_subscription). The entire deployment would be AWS managed, we do not need to manage the deployment in any way.
- ✅ Account configuration - [AWS QuickSight users must be deployed via Terraform or the AWS console. These users require an associated IAM user to be created.](https://registry.terraform.io/providers/hashicorp/aws/latest/docs/resources/quicksight_user) These users can also be configured with AWS SSO and MFA.

### Metabase

> Metabase is an open-source Business Intelligence (BI) tool that enables users to easily query, visualize, and share insights from their data. It offers a user-friendly interface that allows users to create and customize dashboards and visualizations without the need for advanced technical skills. Metabase supports various data sources, including SQL databases like MySQL, PostgreSQL, and MongoDB, as well as cloud services like Google BigQuery and Amazon Redshift. With features such as SQL querying, interactive dashboards, and natural language querying, Metabase empowers users to explore and understand their data in a flexible and intuitive way. Additionally, being open-source, Metabase allows for community contributions and customization, making it a popular choice for organizations seeking a cost-effective and customizable BI solution.

Here's how Metabase evaluates against our criteria:

- ✅ Ability to share public dashboards - [Metabase supports public dashboards](https://www.metabase.com/docs/latest/questions/sharing/public-links)
- ✅ Ability to show private dashboards to selected users - [Metabase supports access controlled dashboards](https://www.metabase.com/learn/administration/guide-to-sharing-data)
- ✅ Ability to connect to common data sources (S3, Redshift, Postgres) - [Metabase supports common data sources](https://www.metabase.com/data_sources/)
- ✅ Allows technical users to create ad hoc queries to create graphs - [Metabase supports creating a variety of visual types](https://www.metabase.com/learn/visualization/)
- ✅ Easy-to-use UI for non-coders - Subjectively, the Metabase UI was found to be easy to use.
- ✅ Replicable for users outside of the project - Metabase is open-source and could be replicated by people outside the project by giving them access to a copy of our analytics database.
- Cost of ownership - The cost of running Metabase is the cost of running an appropriately sized AWS Fargate task 24/7. That cost works out to about ~$100/month.
- ✅ Ease of deployment - [Metabase provides an official docker image that we can run on AWS ECS](https://www.metabase.com/docs/latest/installation-and-operation/running-metabase-on-docker). This ECS service would be managed by us, so we would be responsible for managing upgrades to the service.
- ❌❌ Account configuration - [Metabase uses Google SSO as its secure account configuration option](https://www.metabase.com/docs/latest/people-and-groups/google-and-ldap). But doing so requires that everyone who needs a login be given a login inside a specific, single, Google workspace. That means that, for example, everyone would need a @navapbc.com email, or some new domain that we create just for this purpose. That setup works fine for organizations that use a single Google Workspace instance as their source of truth, and does not work when you have multiple subcontracting organizations with their own Google workspace instances. That unfortunately means that it does not fit our setup.

### QuickSight and Metabase compared

We are unfortunately blocked from using Metabase due to our security and account configuration requirements. That leaves AWS QuickSight as the remaining viable in-scope option.

## Decision

This ADR supports AWS QuickSight as our chosen BI tool.

## Links

- [Best BI tools for startups: How to choose a BI tool
](https://www.airops.com/blog/best-bi-tools-for-startups-how-to-choose-a-bi-tool)
- [Metabase vs QuickSight Comparison](https://www.restack.io/docs/metabase-knowledge-metabase-vs-quicksight-comparison)
- [Amazon Quicksight vs Metabase](https://stackshare.io/stackups/amazon-quicksight-vs-metabase)
