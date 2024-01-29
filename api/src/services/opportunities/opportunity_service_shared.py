from datetime import datetime

from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.staging_topportunity_models import StagingTopportunity


def convert_staging_opp_to_regular(staging_opportunity: StagingTopportunity) -> Opportunity:
    # Using staging table directly from our opportunity endpoint is temporary
    # until we implement the data transformation layer, this converts
    # to what our API currently expects without requiring us to rewrite the Marshmallow/API layer

    is_draft = None
    if staging_opportunity.is_draft == "Y":
        is_draft = True
    elif staging_opportunity.is_draft == "N":
        is_draft = False

    opportunity_category = None
    if staging_opportunity.oppcategory:
        opportunity_category = OpportunityCategory(staging_opportunity.oppcategory)

    # convert the update/create dates to datetime at 00:00:00
    created_at, updated_at = None, None
    if staging_opportunity.created_date:
        created_at = datetime.combine(staging_opportunity.created_date, datetime.min.time())
    if staging_opportunity.last_upd_date:
        updated_at = datetime.combine(staging_opportunity.last_upd_date, datetime.min.time())

    return Opportunity(
        opportunity_id=staging_opportunity.opportunity_id,
        opportunity_number=staging_opportunity.oppnumber,
        opportunity_title=staging_opportunity.opptitle,
        agency=staging_opportunity.owningagency,
        category=opportunity_category,
        category_explanation=staging_opportunity.category_explanation,
        is_draft=is_draft,
        revision_number=staging_opportunity.revision_number,
        modified_comments=staging_opportunity.modified_comments,
        publisher_user_id=staging_opportunity.publisheruid,
        publisher_profile_id=staging_opportunity.publisher_profile_id,
        created_at=created_at,
        updated_at=updated_at,
    )
