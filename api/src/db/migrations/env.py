import logging
from typing import Any

import alembic.context as context
import sqlalchemy

import src.adapters.db as db
import src.logging
from src.constants.schema import Schemas
from src.db.models import metadata
from src.db.models.staging import metadata as staging_metadata

from src.adapters.db.type_decorators.postgres_type_decorators import LookupColumn  # isort:skip

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

logger = logging.getLogger("migrations")

# Initialize logging
with src.logging.init("migrations"):
    # add your model's MetaData object here
    # for 'autogenerate' support
    # from myapp import mymodel
    # target_metadata = mymodel.Base.metadata
    target_metadata = [metadata, staging_metadata]

    # other values from the config, defined by the needs of env.py,
    # can be acquired:
    # my_important_option = config.get_main_option("my_important_option")
    # ... etc.

    def include_object(
        object: sqlalchemy.schema.SchemaItem,
        name: str | None,
        type_: str,
        reflected: bool,
        compare_to: Any,
    ) -> bool:
        # We don't want alembic to try and drop its own table
        if name == "alembic_version":
            return False

        if type_ == "schema" and getattr(object, "schema", None) is not None:
            return False
        if type_ == "table" and name is not None and name.startswith("foreign_"):
            # We create foreign tables to an Oracle database, if we see those locally
            # just ignore them as they aren't something we want included in Alembic
            return False
        else:
            return True

    def render_item(type_: str, obj: Any, autogen_context: Any) -> Any:
        # Alembic tries to set the type of the column as LookupColumn
        # despite it being derived from the Integer column type,
        # so force it to be Integer during it's generation process
        if type_ == "type" and isinstance(obj, LookupColumn):
            return "sa.Integer()"

        # False means to use the default processing
        return False

    def run_migrations_online() -> None:
        """Run migrations in 'online' mode.

        In this scenario we need to create an Engine
        and associate a connection with the context.

        """

        db_client = db.PostgresDBClient()

        with db_client.get_connection() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                include_schemas=True,
                include_object=include_object,
                compare_type=True,
                render_item=render_item,
                version_table_schema=Schemas.API,
            )
            with context.begin_transaction():
                context.run_migrations()

    # No need to support running migrations in offline mode.
    # When running locally we have the local containerized database.
    # When running in the cloud we'll have the actual cloud database.
    run_migrations_online()
