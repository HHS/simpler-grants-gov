# DBT Test for Transforms

This shows a basic setup with manipulating the opportunity table. It shows just basic examples, but this could be used for complex transforms as the data model expands.

To test:

* Run `make db-seed-local`
* Run `docker compose exec grants-dbt dbt run`

## What this does

* Creates `stg_opportunity` table which shows basic renaming which is a typical function for [staging in dbt](https://docs.getdbt.com/best-practices/how-we-structure/2-staging). This might not be necessary with our limited use-case, but would be appropriate if we are building final tables off of initial models.
* Creates `prod_opp_table` and `publisher` table which would be the final hypothetical version of transforms to prod tables.
