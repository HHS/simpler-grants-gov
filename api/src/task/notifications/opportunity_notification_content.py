from src.constants.lookup_constants import OpportunityStatus
from src.db.models.opportunity_models import Opportunity
from src.util.string_utils import fmt_currency, fmt_date

NOT_SPECIFIED = "Not specified"

STATUS_DISPLAY = {
    OpportunityStatus.FORECASTED: "Forecasted",
    OpportunityStatus.POSTED: "Open",
}


class OpportunityNotificationContent:
    """OpportunityNotificationContent

    This class contains getters and helpers from the Opportunity model and related models.
    This class should be utilized in the context of human-readable notification content.

    String values in this class follow sentence casing conventions where suitable.
    """

    def __init__(self, opportunity: Opportunity, frontend_url: str) -> None:
        self.opportunity = opportunity
        self.frontend_url = frontend_url
        self.agency = self.opportunity.agency_record
        self.competitions = self.opportunity.competitions if self.opportunity.competitions else []
        self.is_multi_competition = len(self.competitions) > 1
        self.summary = None
        if self.opportunity.current_opportunity_summary is not None:
            self.summary = self.opportunity.current_opportunity_summary.opportunity_summary

    @property
    def agency_code_with_name(self) -> str:
        # Returns the agency name prefixed with agency_code
        # Ex: DOD - Department of Defense
        if self.agency:
            return f"{self.agency.agency_code} - {self.agency_name}"
        return NOT_SPECIFIED

    @property
    def agency_name(self) -> str | None:
        return self.agency.agency_name if self.agency else None

    @property
    def award_ceiling(self) -> int | None:
        if self.summary and self.summary.award_ceiling is not None:
            return self.summary.award_ceiling
        return None

    @property
    def award_floor(self) -> int | None:
        if self.summary and self.summary.award_floor is not None:
            return self.summary.award_floor
        return None

    @property
    def award_range(self) -> str:
        floor, ceiling = self.award_floor, self.award_ceiling
        if floor is not None and ceiling is not None:
            return f"{fmt_currency(floor)}–{fmt_currency(ceiling)}"
        if ceiling is not None:
            return f"{fmt_currency(ceiling)} maximum (no minimum specified)"
        if floor is not None:
            return f"{fmt_currency(floor)} minimum (no maximum specified)"
        return NOT_SPECIFIED

    @property
    def expected_number_of_awards(self) -> str:
        if self.summary and self.summary.expected_number_of_awards is not None:
            return str(self.summary.expected_number_of_awards)
        return NOT_SPECIFIED

    @property
    def is_cost_sharing(self) -> str:
        if self.summary and self.summary.is_cost_sharing is not None:
            return "Yes" if self.summary.is_cost_sharing else "No"
        return NOT_SPECIFIED

    @property
    def opportunity_details_page_url(self) -> str:
        return f"{self.frontend_url}/opportunity/{self.opportunity.opportunity_id}"

    @property
    def status(self) -> str:
        # Only forecasted and posted opportunities are expected, posted displays as Open
        if self.opportunity.opportunity_status is None:
            return NOT_SPECIFIED
        return STATUS_DISPLAY.get(
            self.opportunity.opportunity_status, self.opportunity.opportunity_status.capitalize()
        )

    @property
    def submission_period(self) -> str:
        if len(self.competitions) == 0 or (self.summary and self.summary.is_forecast):
            return "To be announced"
        if self.is_multi_competition:
            return "Multiple competitions (see opportunity details)"
        competition = self.competitions[0]
        open_date = competition.opening_date if competition.opening_date else None
        close_date = competition.closing_date if competition.closing_date else None
        if open_date is not None and close_date is not None:
            return f"{fmt_date(open_date)}–{fmt_date(close_date)}"
        if open_date is not None:
            return f"Starts {fmt_date(open_date)} (no end date specified)"
        if close_date is not None:
            return f"Ends {fmt_date(close_date)} (no start date specified)"
        return NOT_SPECIFIED

    @property
    def title(self) -> str | None:
        return self.opportunity.opportunity_title
