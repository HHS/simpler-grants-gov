#
# Create many applications for a local user, so that pagination on the
# workspace application list (/workspace/applications) can be tested manually
# without starting dozens of applications by hand.
#
# Run it (after `make db-seed-local`) with:
#   make seed-user-applications
#   make seed-user-applications args="--user one_org_user --count 60"
#
# The user is looked up by their mock OAuth login, the same logins offered by
# the local mock OAuth server (ex. "no_org_user").

import logging

import click
from sqlalchemy import select

import src.adapters.db as db
import src.logs
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.constants.lookup_constants import ApplicationStatus
from src.db.models.competition_models import Application
from src.db.models.user_models import LinkExternalUser, User
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

DEFAULT_OAUTH_LOGIN = "no_org_user"


def get_user(db_session: db.Session, oauth_login: str) -> User:
    user = db_session.execute(
        select(User)
        .join(LinkExternalUser, LinkExternalUser.user_id == User.user_id)
        .where(LinkExternalUser.external_user_id == oauth_login)
    ).scalar_one_or_none()

    if user is None:
        raise click.ClickException(
            f"No user found with OAuth login '{oauth_login}', "
            "run 'make db-seed-local' or login as that user first"
        )
    return user


def create_user_applications(db_session: db.Session, user: User, count: int) -> list[Application]:
    """Create `count` applications owned by `user`, alternating draft and submitted"""
    applications = []
    for i in range(count):
        status = ApplicationStatus.IN_PROGRESS if i % 2 == 0 else ApplicationStatus.SUBMITTED
        application = factories.ApplicationFactory.create(
            application_status=status,
            application_name=f"Pagination test application {i + 1}",
        )
        factories.ApplicationUserFactory.create(
            user=user, application=application, as_owner=True
        )
        applications.append(application)

    logger.info(
        f"Created {count} applications for user", extra={"user_id": user.user_id}
    )
    return applications


@click.command()
@click.option(
    "--user",
    "-u",
    "oauth_login",
    default=DEFAULT_OAUTH_LOGIN,
    help="Mock OAuth login of the user who will own the applications",
)
@click.option(
    "--count",
    "-n",
    default=60,
    type=click.IntRange(min=1),
    help="Number of applications to create (25 are shown per page)",
)
def seed_user_applications(oauth_login: str, count: int) -> None:
    with src.logs.init("seed_user_applications"):
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session
            user = get_user(db_session, oauth_login)
            create_user_applications(db_session, user, count)
            db_session.commit()


if __name__ == "__main__":
    seed_user_applications()
