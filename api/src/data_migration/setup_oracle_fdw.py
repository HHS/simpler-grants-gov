# Ignore flake8 error for surrounding text in quotes with an f-string
# flake8: noqa B907
import logging

from pydantic import Field
from sqlalchemy import text

import src.adapters.db as db
import src.adapters.db.flask_db as flask_db
from src.data_migration.data_migration_blueprint import data_migration_blueprint
from src.util.env_config import PydanticBaseEnvConfig


class ForeignDataWrapperConfig(PydanticBaseEnvConfig):
    oracle_db_server: str = Field(alias="ORACLE_DB_SERVER")
    oracle_user: str = Field(alias="ORACLE_USER")
    oracle_password: str = Field(alias="ORACLE_PASSWORD")


logger = logging.getLogger(__name__)


@data_migration_blueprint.cli.command(
    "setup-oracle-fdw", help="Setup script for initializing the Oracle foreign data wrapper (FDW)"
)
@flask_db.with_db_session()
def setup_oracle_fdw(db_session: db.Session) -> None:
    logger.info("Setting up Oracle foreign data wrapper")

    config = ForeignDataWrapperConfig()

    with db_session.begin():
        db_session.scalar(text("create extension oracle_fdw"))

        db_session.scalar(
            text(
                f"CREATE SERVER oracle FOREIGN DATA WRAPPER oracle_fdw OPTIONS (dbserver '{config.oracle_db_server}');"
            )
        )

        db_session.scalar(
            text(
                f"CREATE USER MAPPING FOR dmslink SERVER oracle OPTIONS (user '{config.oracle_user}', password '{config.oracle_password}');"
            )
        )

    logger.info("Succesfully setup Oracle foreign data wrapper")
