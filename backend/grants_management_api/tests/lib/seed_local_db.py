import logging
import uuid

import click
import grants_shared.logs
from grants_shared.adapters import db
from grants_shared.adapters.db import PostgresDBClient
from grants_shared.util.local import error_if_not_local

import tests.db.models.factories as f
from src.db.resource_automation.resource_automation import setup_resource_automation
from tests.lib.seed_data_utils import UserBuilder

logger = logging.getLogger(__name__)


@click.command()
def seed_local_db() -> None:
    with grants_shared.logs.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        setup_resource_automation()

        with db_client.get_session() as db_session:
            f._db_session = db_session
            run_seed_logic(db_session)


def run_seed_logic(db_session: db.Session) -> None:
    create_users(db_session)

    create_teams()

    # Commit anything remaining that wasn't made with factories
    db_session.commit()


def create_users(db_session: db.Session) -> None:
    logger.info("Creating users")

    # Create a few basic users with JWT auth setup
    UserBuilder(
        user_id=uuid.UUID("700135e1-ae1c-4ae5-a953-bc298f98ab7e"),
        db_session=db_session,
        scenario_name="Basic JWT User",
    ).with_oauth_login("basic_jwt_user").with_jwt_auth().build()

    UserBuilder(
        user_id=uuid.UUID("78cf92a5-3114-4e56-891c-04bfaf25c74f"),
        db_session=db_session,
        scenario_name="Another JWT User",
    ).with_oauth_login("another_jwt_user").with_jwt_auth().build()


def create_teams() -> None:
    teams = f.TeamFactory.create_batch(size=10)

    for team in teams:
        logger.info(
            "Created team",
            extra={
                "team_id": team.team_id,
                "team_name": team.team_name,
                "subagency_id": team.subagency_id,
                "subagency_name": team.subagency.subagency_name,
                "department_id": team.subagency.department_id,
                "department_name": team.subagency.department.department_name,
            },
        )
