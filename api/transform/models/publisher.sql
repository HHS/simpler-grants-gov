{{ config(materialized='table') }}

with source as (
    select * from {{ ref('stg_opportunity') }}
)
select
    publisher_user_id,
    publisher_profile_id
from source