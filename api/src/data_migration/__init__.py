from src.data_migration.data_migration_blueprint import data_migration_blueprint

from . import command  # noqa: F401

# import any of the other files so they get initialized and attached to the blueprint
import src.data_migration.setup_foreign_tables  # noqa: F401 isort:skip

__all__ = ["data_migration_blueprint"]
