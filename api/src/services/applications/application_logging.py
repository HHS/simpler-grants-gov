from uuid import UUID

from src.db.models.competition_models import Application
from src.logging.flask_logger import add_extra_data_to_current_request_logs


def add_application_metadata_to_logs(application: Application) -> None:
    """Add application metadata to the current request logs for New Relic dashboards."""

    extra_data: dict[str, str | int | float | bool | UUID | None] = {
        "organization_id": application.organization_id,
        "competition_id": application.competition_id,
        "opportunity_id": application.competition.opportunity_id,
        "agency_code": application.competition.opportunity.agency_code,
    }
    add_extra_data_to_current_request_logs(extra_data)
