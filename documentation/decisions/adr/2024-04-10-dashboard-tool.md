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

## Solution Options

The possible solution space here is quite large, but we have narrowed it down to 5 to options total, only 2 of which are evaluated in this ADR. The 5 options we evaluated are:

- AWS QuickSight - evaluated below
- Metabase - evaluated below
- Tableau
- Redash
- Apache Superset

### AWS QuickSight

> AWS QuickSight is a cloud-based Business Intelligence (BI) service provided by Amazon Web Services (AWS). It enables users to easily create and share interactive dashboards and visualizations from various data sources, including AWS services, databases, and third-party applications. QuickSight offers features such as ad-hoc analysis, machine learning-powered insights, and seamless integration with AWS services like Amazon Redshift, Amazon RDS, and Amazon S3. It provides users with the ability to explore data through drag-and-drop interfaces, create custom visualizations, and perform advanced analytics without requiring extensive technical expertise. With pay-as-you-go pricing and scalability, QuickSight offers an accessible and cost-effective solution for organizations looking to harness the power of BI in the cloud.

### Metabase

> Metabase is an open-source Business Intelligence (BI) tool that enables users to easily query, visualize, and share insights from their data. It offers a user-friendly interface that allows users to create and customize dashboards and visualizations without the need for advanced technical skills. Metabase supports various data sources, including SQL databases like MySQL, PostgreSQL, and MongoDB, as well as cloud services like Google BigQuery and Amazon Redshift. With features such as SQL querying, interactive dashboards, and natural language querying, Metabase empowers users to explore and understand their data in a flexible and intuitive way. Additionally, being open-source, Metabase allows for community contributions and customization, making it a popular choice for organizations seeking a cost-effective and customizable BI solution.

### QuickSight and Metabase compared

## Decision
