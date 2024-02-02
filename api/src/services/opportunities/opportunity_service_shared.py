from datetime import datetime

from src.constants.lookup_constants import OpportunityCategory
from src.db.models.opportunity_models import Opportunity
from src.db.models.transfer.topportunity_models import TransferTopportunity


def convert_transfer_opp_to_regular(transfer_opportunity: TransferTopportunity) -> Opportunity:
    # Using transfer table directly from our opportunity endpoint is temporary
    # until we implement the data transformation layer, this converts
    # to what our API currently expects without requiring us to rewrite the Marshmallow/API layer

    is_draft = None
    if transfer_opportunity.is_draft == "Y":
        is_draft = True
    elif transfer_opportunity.is_draft == "N":
        is_draft = False

    opportunity_category = None
    if transfer_opportunity.oppcategory:
        opportunity_category = OpportunityCategory(transfer_opportunity.oppcategory)

    # convert the update/create dates to datetime at 00:00:00
    created_at, updated_at = None, None
    if transfer_opportunity.created_date:
        created_at = datetime.combine(transfer_opportunity.created_date, datetime.min.time())
    if transfer_opportunity.last_upd_date:
        updated_at = datetime.combine(transfer_opportunity.last_upd_date, datetime.min.time())

    return Opportunity(
        opportunity_id=transfer_opportunity.opportunity_id,
        opportunity_number=transfer_opportunity.oppnumber,
        opportunity_title=transfer_opportunity.opptitle,
        agency=transfer_opportunity.owningagency,
        category=opportunity_category,
        category_explanation=transfer_opportunity.category_explanation,
        is_draft=is_draft,
        revision_number=transfer_opportunity.revision_number,
        modified_comments=transfer_opportunity.modified_comments,
        publisher_user_id=transfer_opportunity.publisheruid,
        publisher_profile_id=transfer_opportunity.publisher_profile_id,
        created_at=created_at,
        updated_at=updated_at,
    )
