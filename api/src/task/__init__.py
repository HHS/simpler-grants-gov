from src.task.task_blueprint import task_blueprint

# import any of the other files so they get initialized and attached to the blueprint
import src.task.opportunities.set_current_opportunities_task  # ruff: ignore[unused-import] isort:skip
import src.task.opportunities.export_opportunity_data_task  # ruff: ignore[unused-import] isort:skip
import src.task.analytics.create_analytics_db_csvs  # ruff: ignore[unused-import] isort:skip
import src.task.notifications.email_notification  # ruff: ignore[unused-import] isort:skip
import src.task.sam_extracts.sam_extract_cli  # ruff: ignore[unused-import] isort:skip
import src.task.apply.create_application_submission_task  # ruff: ignore[unused-import] isort:skip
import src.task.generate_internal_token  # ruff: ignore[unused-import] isort:skip
import src.task.forms.update_form_instruction_task  # ruff: ignore[unused-import] isort:skip
import src.task.certificates.setup_cert_user_task  # ruff: ignore[unused-import] isort:skip
import src.task.forms.lock_form_version_task  # ruff: ignore[unused-import] isort:skip
import src.task.opportunities.build_automatic_opportunities  # ruff: ignore[unused-import] isort:skip
import src.cli.xml_generation_cli  # ruff: ignore[unused-import] isort:skip
import src.task.agencies.setup_lower_env_agencies  # ruff: ignore[unused-import] isort:skip
import src.task.xsd_drift.check_xsd_drift_task  # ruff: ignore[unused-import] isort:skip

__all__ = ["task_blueprint"]
