import logging

from src.db.models.agency_models import Agency
from src.db.models.user_models import User

logger = logging.getLogger(__name__)


def get_user_agencies(user: User) -> list[Agency]:
    """Get agencies for a user using the SQLAlchemy relationship."""
    return [agency_user.agency for agency_user in user.agency_users]
