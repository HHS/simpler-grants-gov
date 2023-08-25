# DB Choices

- **Status:** Active
- **Last Modified:** 2023-07-05
- **Related Issue:** [#27](https://github.com/HHS/grants-equity/issues/104)
- **Deciders:** Lucas Brown, Aaron Couch, Gina Carson, Andy Cochran

## Context and Problem Statement

This ADR is to formalize a series of architectural decisions about how data is stored, including the type of database we will use and the platform we'll use host it. This ADR will contain the evaluation and selection of the type of the database, the database management system (DBMS), and database hosting service.

## Decision Drivers <!-- RECOMMENDED -->
Type of Database:

- Nature of the NOFO and grant data that we're storing
- Volume of data and performance considerations


DBMS Selection:

- Hosting options
- Expected access patterns (i.e. heavy read or write transactions)
- Ease of creating mock data
- Trusted libraries that support interfacing with this database in the language we've chosen for our API
- An open source version of this DBMS is available for self hosting or running locally


Database Hosting Service:

- FedRAMP compliant deployment option
- Ease of use and support
- Cost considerations related to hosting the database, in terms of direct operating costs as well as team resources
- Advanced service offerings such as read replicas and automatic backups


## Decision Outcome <!-- REQUIRED -->


### Type of Database <!-- OPTIONAL -->

The target type of database selected for Grants.gov is a relational database management system. This was evaluated and selected based on several factors including the relational nature of the NOFO and grant data that we're storing as well as the ACID compliance and flexibility that a relational database can offer.


### Database Management System <!-- OPTIONAL -->

The RDBMS selected for Grants.gov is PostgreSQL. This is due to a variety of factors, including:
- Resource familiarity with PostgreSQL as a database system
- Improved performance for high-frequency write operations and complex queries as opposed to MySQL
- PostgreSQL support of most advanced database features such as materialized views
- PostgreSQL trusted Python libraries (API language of choice)
- PostgreSQL is open source, in alignment with the Grants.gov strategy

### Database Hosting Service <!-- OPTIONAL -->

The database hosting service selected is Amazon RDS. This is due to several factors:
- FedRAMP compliant deployment
- Reduction of many tasks and IT labor savings when compared to EC2 or on-premise including backups, server patching, automatic backups, scaling, etc.



## Links

- [Comparison of MySQL and PostgreSQL](https://aws.amazon.com/compare/the-difference-between-mysql-vs-postgresql/#:~:text=Summary%20of%20differences%3A%20PostgreSQL%20vs%20MySQL,-Category&text=MySQL%20is%20a%20purely%20relational%20database%20management%20system.,object%2Drelational%20database%20management%20system.&text=MySQL%20has%20limited%20support%20of,views%2C%20triggers%2C%20and%20procedures.)
- [What is Amazon RDS?](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Welcome.html)
