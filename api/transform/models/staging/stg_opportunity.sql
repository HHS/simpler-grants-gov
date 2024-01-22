with source as (
    select * from {{ source('app', 'opportunity') }}
),

select
    opportunity_id,
    opportunity_number,
    opportunity_title,
    agency,
    category,
    created_at,
    updated_at,
    category_explanation,
    modified_comments,
    publisher_user_id,
    publisher_profile_id,
    revision_number as revision_id,
    REGEXP_MATCHES(category_explanation,'[0-9]+') as order_id
from source