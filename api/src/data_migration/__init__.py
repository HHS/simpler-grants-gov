from src.data_migration.data_migration_blueprint import data_migration_blueprint

# import any of the other files so they get initialized and attached to the blueprint
import src.data_migration.copy_oracle_data  # noqa: F401 E402 isort:skip

__all__ = ["data_migration_blueprint"]
