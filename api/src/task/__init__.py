from src.task.task_blueprint import task_blueprint

# import any of the other files so they get initialized and attached to the blueprint
import src.task.opportunities.set_current_opportunities_task  # noqa: F401 isort:skip
import src.task.opportunities.export_opportunity_data_task  # noqa: F401 isort:skip
import src.task.analytics.create_analytics_db_csvs  # noqa: F401 isort:skip
import src.task.notifications.email_notification  # noqa: F401 isort:skip
import src.task.sam_extracts.sam_extract_cli  # noqa: F401 isort:skip
import src.task.apply.create_application_submission_task  # noqa: F401 isort:skip
import src.task.generate_internal_token  # noqa: F401 isort:skip
import src.task.forms.update_form_task  # noqa: F401 isort:skip
import src.task.certificates.setup_cert_user_task  # noqa: F401 isort:skip
import src.task.forms.list_forms_task  # noqa: F401 isort:skip
import src.task.opportunities.generate_opportunity_sql  # noqa: F401 isort:skip
import src.cli.xml_generation_cli  # noqa: F401 isort:skip

__all__ = ["task_blueprint"]
