from src.task.task_blueprint import task_blueprint

# import any of the other files so they get initialized and attached to the blueprint
import src.task.opportunities.set_current_opportunities_task  # noqa: F401 E402 isort:skip
import src.task.notifications.generate_notifications  # noqa: F401 E402 isort:skip
import src.task.opportunities.export_opportunity_data_task  # noqa: F401 E402 isort:skip
import src.task.analytics.create_analytics_db_csvs  # noqa: F401 E402 isort:skip

__all__ = ["task_blueprint"]
