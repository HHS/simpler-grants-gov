#
# Set up local data for the all new opportunities email notification.
#
# Subscribes local users to the notification and creates opportunities
# that the next run of the new-opportunity-notification task will pick up.
#
# Run it with:
#   make seed-new-opportunity-notification
#
# See documentation/api/tasks/notifications/all-new-opportunities-email.md

import logging

import click
from sqlalchemy import select

import src.adapters.db as db
import src.logs
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.constants.lookup_constants import NotificationType
from src.db.models.agency_models import Agency
from src.db.models.opportunity_models import Opportunity
from src.db.models.user_models import LinkExternalUser, User
from src.services.users.user_notification_preferences import (
    update_or_create_user_notification_preference,
)
from src.util.local import error_if_not_local

logger = logging.getLogger(__name__)

DEFAULT_OAUTH_LOGIN = "no_org_user"


def subscribe_users(db_session: db.Session, oauth_logins: list[str]) -> list[User]:
    """Opt the users with the given mock OAuth logins in to the all new opportunities email"""
    users = []
    for oauth_login in oauth_logins:
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

        update_or_create_user_notification_preference(
            db_session, user, NotificationType.ALL_NEW_OPPORTUNITIES, is_enabled=True
        )
        logger.info(
            "Subscribed user to the all new opportunities email",
            extra={"oauth_login": oauth_login, "email": user.email},
        )
        users.append(user)

    return users


def create_new_opportunities(db_session: db.Session, count: int) -> list[Opportunity]:
    """Create opportunities that first became visible now, alternating posted and forecasted

    To be included in the email, an opportunity must be searchable, forecasted or posted,
    belong to a non-test agency, and have its first forecasted or posted version created
    since the last successful run of the task.
    """
    agency = _get_or_create_agency(db_session)

    opportunities = []
    for i in range(count):
        is_posted = i % 2 == 0
        opportunity = factories.OpportunityFactory.create(
            agency_code=agency.agency_code,
            agency_id=agency.agency_id,
            is_posted_summary=is_posted,
            is_forecasted_summary=not is_posted,
        )
        factories.OpportunityVersionFactory.create(opportunity=opportunity)
        opportunities.append(opportunity)

    logger.info(
        f"Created {count} new opportunities for the all new opportunities email",
        extra={"agency_code": agency.agency_code},
    )
    return opportunities


def _get_or_create_agency(db_session: db.Session) -> Agency:
    agency = db_session.execute(
        select(Agency).where(Agency.is_test_agency.is_(False)).order_by(Agency.agency_code).limit(1)
    ).scalar_one_or_none()

    if agency is None:
        agency = factories.AgencyFactory.create()

    return agency


@click.command()
@click.option(
    "--user",
    "-u",
    "oauth_logins",
    default=[DEFAULT_OAUTH_LOGIN],
    multiple=True,
    help="Mock OAuth login of a user to subscribe, can be passed multiple times",
)
@click.option(
    "--opportunity-count",
    "-n",
    default=3,
    type=click.IntRange(min=0),
    help="Number of new opportunities to create, pass 0 to only subscribe users",
)
def seed_new_opportunity_notification(oauth_logins: list[str], opportunity_count: int) -> None:
    with src.logs.init("seed_new_opportunity_notification"):
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session
            subscribe_users(db_session, oauth_logins)
            create_new_opportunities(db_session, opportunity_count)
            db_session.commit()


if __name__ == "__main__":
    seed_new_opportunity_notification()
