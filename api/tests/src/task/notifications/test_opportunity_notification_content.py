from datetime import date

import pytest

import tests.src.db.models.factories as factories
from src.task.notifications.opportunity_notification_content import OpportunityNotificationContent

FRONTEND_URL = "http://frontend.test"
UTM_TAG = "?utm_source=notification&utm_medium=email&utm_campaign=new_opportunity"


@pytest.fixture(autouse=True)
def _factory_create(enable_factory_create):
    pass


def _build_content(
    summary_trait="is_posted_summary", **summary_fields
) -> OpportunityNotificationContent:
    opportunity = factories.OpportunityFactory.create(**{summary_trait: True})
    for field, value in summary_fields.items():
        setattr(opportunity.summary, field, value)
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
        content.opportunity_details_page_url()
        == f"{FRONTEND_URL}/opportunity/{content.opportunity.opportunity_id}"
    )


def test_opportunity_details_page_url_with_utm_tag():
    content = _build_content()
    assert (
        content.opportunity_details_page_url(UTM_TAG)
        == f"{FRONTEND_URL}/opportunity/{content.opportunity.opportunity_id}{UTM_TAG}"
    )


@pytest.mark.parametrize(
    "summary_trait,expected",
    [("is_posted_summary", "Open"), ("is_forecasted_summary", "Forecasted")],
)
def test_status(summary_trait, expected):
    assert _build_content(summary_trait=summary_trait).status == expected


@pytest.mark.parametrize(
    "summary_trait,summary_fields,expected",
    [
        (
            "is_posted_summary",
            {"post_date": date(2026, 1, 2), "close_date": date(2026, 3, 4)},
            "01/02/2026–03/04/2026",
        ),
        (
            "is_posted_summary",
            {"post_date": date(2026, 1, 2), "close_date": None},
            "Starts 01/02/2026 (no end date specified)",
        ),
        (
            "is_posted_summary",
            {"post_date": None, "close_date": date(2026, 3, 4)},
            "Ends 03/04/2026 (no start date specified)",
        ),
        ("is_posted_summary", {"post_date": None, "close_date": None}, "Not specified"),
        (
            "is_forecasted_summary",
            {"forecasted_post_date": date(2026, 1, 2), "forecasted_close_date": date(2026, 3, 4)},
            "01/02/2026–03/04/2026",
        ),
        (
            "is_forecasted_summary",
            {"forecasted_post_date": date(2026, 1, 2), "forecasted_close_date": None},
            "Starts 01/02/2026 (no end date specified)",
        ),
        (
            "is_forecasted_summary",
            {"forecasted_post_date": None, "forecasted_close_date": date(2026, 3, 4)},
            "Ends 03/04/2026 (no start date specified)",
        ),
        (
            "is_forecasted_summary",
            {"forecasted_post_date": None, "forecasted_close_date": None},
            "To be announced",
        ),
        # A forecast reads only the forecasted dates, even when the posted ones are set
        (
            "is_forecasted_summary",
            {
                "forecasted_post_date": None,
                "forecasted_close_date": None,
                "post_date": date(2026, 1, 2),
                "close_date": date(2026, 3, 4),
            },
            "To be announced",
        ),
    ],
)
def test_submission_period(summary_trait, summary_fields, expected):
    content = _build_content(summary_trait=summary_trait, **summary_fields)
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


@pytest.mark.parametrize(
    "value,expected",
    [("Research grant", "Research grant"), ("", "Not specified"), (None, "Not specified")],
)
def test_title(value, expected):
    opportunity = factories.OpportunityFactory.create(
        is_posted_summary=True, opportunity_title=value
    )
    content = OpportunityNotificationContent(opportunity, FRONTEND_URL)
    assert content.title == expected
