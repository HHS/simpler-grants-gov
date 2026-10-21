from datetime import date

import pytest

import tests.src.db.models.factories as factories
from src.task.notifications.opportunity_notification_content import OpportunityNotificationContent

FRONTEND_URL = "http://frontend.test"


@pytest.fixture(autouse=True)
def _factory_create(enable_factory_create):
    pass


def _build_content(
    summary_trait="is_posted_summary", competition_dates=None, **summary_fields
) -> OpportunityNotificationContent:
    opportunity = factories.OpportunityFactory.create(**{summary_trait: True})
    for field, value in summary_fields.items():
        setattr(opportunity.summary, field, value)
    opportunity.competitions = [
        factories.CompetitionFactory.build(
            opportunity=opportunity, opening_date=opening_date, closing_date=closing_date
        )
        for opening_date, closing_date in (competition_dates or [])
    ]
    return OpportunityNotificationContent(opportunity, FRONTEND_URL)


def test_agency_code_with_name():
    agency = factories.AgencyFactory.create(agency_code="DOD", agency_name="Department of Defense")
    opportunity = factories.OpportunityFactory.create(
        agency_code=agency.agency_code, agency_id=agency.agency_id
    )
    content = OpportunityNotificationContent(opportunity, FRONTEND_URL)
    assert content.agency_code_with_name == "DOD - Department of Defense"


def test_agency_code_with_name_without_agency():
    assert _build_content().agency_code_with_name == "Not specified"


def test_opportunity_details_page_url():
    content = _build_content()
    assert (
        content.opportunity_details_page_url
        == f"{FRONTEND_URL}/opportunity/{content.opportunity.opportunity_id}"
    )


@pytest.mark.parametrize(
    "summary_trait,expected",
    [("is_posted_summary", "Open"), ("is_forecasted_summary", "Forecasted")],
)
def test_status(summary_trait, expected):
    assert _build_content(summary_trait=summary_trait).status == expected


@pytest.mark.parametrize(
    "summary_trait,competition_dates,expected",
    [
        ("is_posted_summary", [], "To be announced"),
        ("is_forecasted_summary", [(date(2026, 1, 2), date(2026, 3, 4))], "To be announced"),
        ("is_posted_summary", [(date(2026, 1, 2), date(2026, 3, 4))], "01/02/2026–03/04/2026"),
        (
            "is_posted_summary",
            [(date(2026, 1, 2), None)],
            "Starts 01/02/2026 (no end date specified)",
        ),
        (
            "is_posted_summary",
            [(None, date(2026, 3, 4))],
            "Ends 03/04/2026 (no start date specified)",
        ),
        ("is_posted_summary", [(None, None)], "Not specified"),
        (
            "is_posted_summary",
            [(date(2026, 1, 2), date(2026, 3, 4)), (date(2026, 2, 1), date(2026, 4, 1))],
            "Multiple competitions (see opportunity details)",
        ),
    ],
)
def test_submission_period(summary_trait, competition_dates, expected):
    content = _build_content(summary_trait=summary_trait, competition_dates=competition_dates)
    assert content.submission_period == expected


@pytest.mark.parametrize(
    "award_floor,award_ceiling,expected",
    [
        (100, 9999, "$100–$9,999"),
        (0, 5000, "$0–$5,000"),
        (100, 100, "$100–$100"),
        (0, 0, "$0–$0"),
        (None, 5000, "$5,000 maximum (no minimum specified)"),
        (5000, None, "$5,000 minimum (no maximum specified)"),
        (None, None, "Not specified"),
    ],
)
def test_award_range(award_floor, award_ceiling, expected):
    content = _build_content(award_floor=award_floor, award_ceiling=award_ceiling)
    assert content.award_range == expected


@pytest.mark.parametrize("value,expected", [(5, "5"), (0, "0"), (None, "Not specified")])
def test_expected_number_of_awards(value, expected):
    assert _build_content(expected_number_of_awards=value).expected_number_of_awards == expected


@pytest.mark.parametrize("value,expected", [(True, "Yes"), (False, "No"), (None, "Not specified")])
def test_is_cost_sharing(value, expected):
    assert _build_content(is_cost_sharing=value).is_cost_sharing == expected
