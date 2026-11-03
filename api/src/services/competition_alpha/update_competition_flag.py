import logging
import uuid

import src.adapters.db as db
from src.api.route_utils import raise_flask_error
from src.auth.endpoint_access_util import verify_access
from src.constants.lookup_constants import Privilege
from src.db.models.competition_models import Competition
from src.db.models.user_models import User
from src.services.competition_alpha.get_competition import get_competition

logger = logging.getLogger(__name__)


def update_competition_flag(
    db_session: db.Session, competition_id: uuid.UUID, is_simpler_grants_enabled: bool, user: User
) -> Competition:
    verify_access(user, {Privilege.MANAGE_COMPETITION}, None)

    competition = get_competition(db_session, competition_id)

    if not competition:
        raise_flask_error(404, f"Competition with ID {competition_id} not found.")

    # Apply the change
    competition.is_simpler_grants_enabled = is_simpler_grants_enabled

    logger.info(
        "Updated is_simpler_grants_enabled for competition",
        extra={"is_simpler_grants_enabled": is_simpler_grants_enabled},
    )

    return competition
