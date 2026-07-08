import uuid
from copy import deepcopy

import pytest
from freezegun import freeze_time
from sqlalchemy import select

from src.db.models.opportunity_models import Opportunity
from src.form_schema.forms import (
    BudgetNarrativeAttachment_v1_2,
    ProjectAbstractSummary_v2_0,
    ProjectNarrativeAttachment_v1_2,
    SF424_v4_0,
    SF424a_v1_0,
    SF424b_v1_1,
    SFLLL_v2_0,
)
from src.task.opportunities.build_automatic_opportunities import BuildAutomaticOpportunitiesTask

# These are forms that we use in the build logic
# that we need to make sure exist for the purposes of testing
FORMS_USED = [
    ProjectAbstractSummary_v2_0,
    BudgetNarrativeAttachment_v1_2,
    SF424_v4_0,
    SF424a_v1_0,
    ProjectNarrativeAttachment_v1_2,
    SF424b_v1_1,
    SFLLL_v2_0,
]


@pytest.fixture
def forms(monkeypatch):
    # Build the subset of forms this test cares about (no instruction IDs needed).
    # We don't use all registry forms to avoid this test iterating over 20+ forms.
    forms_to_use = []
    for form in FORMS_USED:
        # deep copy to not change the global form definition
        # when we null-out the instruction ID to avoid setting up
        # things we won't need in this test
        f = deepcopy(form)
        f.form_instruction_id = None
        forms_to_use.append(f)

    # Patch the task so it only sees the forms defined above.
    monkeypatch.setattr(
        "src.task.opportunities.build_automatic_opportunities.get_active_forms",
        lambda: forms_to_use,
    )
    return forms_to_use


def test_build_automatic_opportunities(enable_factory_create, db_session, forms):
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    # Grab the opportunities created from the task itself
    opportunities = task.opportunities
    assert len(opportunities) == 37

    # Figure out the forms we added to each opportunity
    opp_form_ids_for_opps = set()
    for opportunity in opportunities:
        opp_form_ids = frozenset(c.form_id for c in opportunity.competitions[0].competition_forms)
        opp_form_ids_for_opps.add(opp_form_ids)

    # Each form should have gotten its own opportunity
    all_form_ids = set()
    for form in forms:
        assert {form.form_id} in opp_form_ids_for_opps
        all_form_ids.add(form.form_id)

    # There should also be one opportunity with every form
    assert all_form_ids in opp_form_ids_for_opps

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 37
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 0

    # If we rerun the task, all opportunities should be skipped (including ALL-forms)
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert len(task.opportunities) == 0

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 0
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 37


def test_opportunity_ids_are_consistent_across_runs(enable_factory_create, db_session, forms):
    """Test that opportunities with hard-coded IDs maintain the same IDs across runs"""
    # First run - create all opportunities
    with freeze_time("2026-02-03 12:00:00"):
        task1 = BuildAutomaticOpportunitiesTask(db_session)
        task1.run()

    # Collect opportunity IDs from first run
    first_run_ids = {}
    for opp in task1.opportunities:
        first_run_ids[opp.opportunity_number] = opp.opportunity_id

    # Second run - should skip existing opportunities

    with freeze_time("2026-02-04 12:00:00"):
        task2 = BuildAutomaticOpportunitiesTask(db_session)
        task2.run()

    # Manually query all opportunities from database to verify IDs
    all_opportunities = db_session.scalars(select(Opportunity)).all()

    # Build a mapping of opportunity_number to opportunity_id from database
    db_ids = {}
    for opp in all_opportunities:
        db_ids[opp.opportunity_number] = opp.opportunity_id

    # Verify that all opportunities from first run have the same IDs in the database
    for opp_number, opp_id in first_run_ids.items():
        assert opp_number in db_ids, f"Opportunity {opp_number} not found in database"
        assert db_ids[opp_number] == opp_id, (
            f"Opportunity ID mismatch for {opp_number}: "
            f"expected {opp_id}, got {db_ids[opp_number]}"
        )

    # Verify specific hard-coded UUIDs for the named scenarios
    expected_ids = {
        "SGG-org-only-test": uuid.UUID("10000000-0000-0000-0000-000000000001"),
        "SGG-indv-only-test": uuid.UUID("10000000-0000-0000-0000-000000000002"),
        "MOCK-R25AS00293-Dec102025": uuid.UUID("10000000-0000-0000-0000-000000000003"),
        "MOCK-O-OVW-2025-172425-Dec102025": uuid.UUID("10000000-0000-0000-0000-000000000004"),
        "E2E-ATT-ORG-IND-01": uuid.UUID("97ee34df-fd89-400d-b4d4-ac9c5c7f61c1"),
        "E2E-BNA-ORG-IND-01": uuid.UUID("caea0f33-b356-4fcd-aae3-c0244e11da1e"),
        "E2E-CD511-ORG-IND-01": uuid.UUID("5b890089-2bb2-4123-82cd-3d321ca62efe"),
        "E2E-EPA4700-ORG-IND-01": uuid.UUID("95f80b3b-c119-4a89-a50f-1b47b95a9191"),
        "E2E-EPAKC-ORG-IND-01": uuid.UUID("1cc0cbb3-cc2a-4c09-a001-ad1f2d9aa631"),
        "E2E-GGLOB-ORG-IND-01": uuid.UUID("552d5866-501a-40b6-b1ce-2efc7a2d3aa5"),
        "E2E-ONA-ORG-IND-01": uuid.UUID("717b7f78-52f2-49f9-b1b8-5d7118313d2a"),
        "E2E-PABS-ORG-IND-01": uuid.UUID("d3081452-2cf8-4817-9abf-812e5d794485"),
        "E2E-PABSS-ORG-IND-01": uuid.UUID("e3bfbd7b-2205-46a8-9aa3-714f7e130958"),
        "E2E-PNA-ORG-IND-01": uuid.UUID("6bdc2df3-6e51-4aea-89af-bade326feba1"),
        "E2E-SF424-ORG-IND-01": uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
        "E2E-SF424A-ORG-IND-01": uuid.UUID("6c25cd41-660e-473f-abff-654083b7795d"),
        "E2E-SF424B-ORG-IND-01": uuid.UUID("dbd8b2c4-0d6b-48b6-9427-32ee7795f4d6"),
        "E2E-SF424D-ORG-IND-01": uuid.UUID("abd9bce9-2b9b-46b8-b814-2c5cb7c5e88b"),
        "E2E-SFLLL-ORG-IND-01": uuid.UUID("f3e438ee-ff4c-475b-a058-8049aee9abda"),
        "E2E-NEHCS-ORG-IND-01": uuid.UUID("b88287e2-7e2a-4c99-8ffe-30ab50c388ef"),
    }

    for opp_number, expected_id in expected_ids.items():
        assert opp_number in db_ids, f"Expected opportunity {opp_number} not found"
        assert db_ids[opp_number] == expected_id, (
            f"Opportunity {opp_number} has incorrect ID: "
            f"expected {expected_id}, got {db_ids[opp_number]}"
        )

    # The opportunity number is dynamic (includes date), so find it by prefix
    all_forms_opp_numbers = [num for num in db_ids.keys() if num.startswith("SGG-ALL-Forms-")]
    # With freeze_time testing different dates, we should have at least 2 ALL forms opportunities
    assert (
        len(all_forms_opp_numbers) >= 2
    ), f"Expected at least 2 ALL forms opportunities, found {len(all_forms_opp_numbers)}"


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="This task is not meant to be run in production"):
        BuildAutomaticOpportunitiesTask(db_session).run()
