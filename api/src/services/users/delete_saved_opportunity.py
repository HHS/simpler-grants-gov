from uuid import UUID

from sqlalchemy import delete

from src.adapters import db
from src.api.route_utils import raise_flask_error
from src.db.models.user_models import UserSavedOpportunity


def delete_saved_opportunity(db_session: db.Session, user_id: UUID, opportunity_id: int) -> None:
    result = db_session.execute(
        delete(UserSavedOpportunity).where(
            UserSavedOpportunity.user_id == user_id,
            UserSavedOpportunity.opportunity_id == opportunity_id,
        )
    )

    if result.rowcount == 0:
        raise_flask_error(404, "Saved opportunity not found")
