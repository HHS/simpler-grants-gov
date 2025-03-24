# Overview
This document goes through in detail all the parts of the
transformation process we have for pulling data from the
existing grants.gov database into our system.

The process is an ELT (extract-load-transform) process and
broadly works like so:
* We query the Oracle DB using a foreign data wrapper to figure out inserts/updates/deletes
* We have a foreign data wrapper and staging table setup for each table we want to copy
* We copy over all records, and any that are missing we mark as deleted
* For each table, we have a separate transformation process for handling the conversion from the existing system to ours (very custom)

# Table Setup
For each table we want to copy, we create a table definition in SQLAlchemy
that is then used for both a "staging" table where we'll copy the data (unchanged)
and another table is used for a foreign data wrapper to Oracle - [oracle_fdw](https://github.com/laurenz/oracle_fdw).

Let us assume we want to copy the following Oracle table:
```sql
CREATE TABLE example(
    example_id NUMBER(6) NOT NULL,
    name     VARCHAR2(45) NOT NULL,
    email    VARCHAR2(30),
    created_date DATE NOT NULL,
    PRIMARY KEY(example_id)
);
```
We want to create an equivalent

## Type Mapping
The oracle_fdw handles most type conversions for us which means we don't
need to match the types as exactly as you might think. Here are a few general type
mappings you can follow:
* VARCHAR(x) -> TEXT
* CHAR(x) -> TEXT
* NUMBER(x) -> Generally Integer/BigInteger, if it is defined as "Number(x,y)" that means it's a floating point number and should not be an int
* DATE -> TIMESTAMP, the date type in Oracle stores time info as well, so can convert to timestamp

# Create Foreign Data Wrappers
TODO - talk about the script
