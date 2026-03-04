from src.api.route_utils import raise_flask_error
from src.db.models.opportunity_models import Opportunity


def validate_opportunity_is_draft(opportunity: Opportunity) -> None:
    """Raise a 422 error if the opportunity is not a draft.

    Only draft opportunities can be modified. This check is shared across
    all update endpoints to ensure consistent enforcement.
    """
    if not opportunity.is_draft:
        raise_flask_error(422, message="Only draft opportunities can be updated")
