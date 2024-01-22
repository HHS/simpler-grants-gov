{{ config(materialized='table') }}

with source as (
    select * from {{ ref('stg_opportunity') }}
)
select
    opportunity_id,
    opportunity_number,
    opportunity_title
from source