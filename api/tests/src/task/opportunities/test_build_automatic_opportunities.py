import uuid
from copy import deepcopy

import pytest
from sqlalchemy import select, update

from src.db.models.competition_models import Form
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
def forms(db_session):
    # To avoid picking up a bunch of forms from other tests
    # set every existing form to be deprecated
    # so that the logic here doesn't see them
    # This is simpler than trying to delete all the forms.
    db_session.execute(update(Form).values(is_deprecated=True))
    db_session.commit()

    # However, we do need some forms setup for these tests
    # Add any forms we reference here. We don't just add ALL
    # forms to avoid this test iterating over 20+ forms in the future.
    forms = []
    for form in FORMS_USED:
        # deep copy to not change the global form definition
        # when we null-out the instruction ID to avoid setting up
        # things we won't need in this test
        f = deepcopy(form)
        f.form_instruction_id = None
        db_session.merge(f)
        forms.append(f)
    db_session.commit()

    return forms


def test_build_automatic_opportunities(enable_factory_create, db_session, forms):
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    # Grab the opportunities created from the task itself
    opportunities = task.opportunities
    assert len(opportunities) == 12

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

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 12
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 0

    # If we rerun the task, all opportunities should be skipped (including ALL-forms)
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert len(task.opportunities) == 0

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 0
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 12


def test_opportunity_ids_are_consistent_across_runs(enable_factory_create, db_session, forms):
    """Test that opportunities with hard-coded IDs maintain the same IDs across runs"""
    # First run - create all opportunities
    task1 = BuildAutomaticOpportunitiesTask(db_session)
    task1.run()

    # Collect opportunity IDs from first run
    first_run_ids = {}
    for opp in task1.opportunities:
        first_run_ids[opp.opportunity_number] = opp.opportunity_id

    # Second run - should skip existing opportunities
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
    }

    for opp_number, expected_id in expected_ids.items():
        assert opp_number in db_ids, f"Expected opportunity {opp_number} not found"
        assert db_ids[opp_number] == expected_id, (
            f"Opportunity {opp_number} has incorrect ID: "
            f"expected {expected_id}, got {db_ids[opp_number]}"
        )

    # Verify the ALL forms opportunity has the expected UUID5
    # The opportunity number is dynamic (includes date), so find it by prefix
    all_forms_opp_number = next(
        (num for num in db_ids.keys() if num.startswith("SGG-ALL-Forms-")), None
    )
    assert all_forms_opp_number is not None, "ALL forms opportunity not found"
    expected_all_forms_id = uuid.uuid5(uuid.NAMESPACE_DNS, "simpler-grants-gov.all-forms")
    assert db_ids[all_forms_opp_number] == expected_all_forms_id, (
        f"ALL forms opportunity has incorrect ID: "
        f"expected {expected_all_forms_id}, got {db_ids[all_forms_opp_number]}"
    )


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="This task is not meant to be run in production"):
        BuildAutomaticOpportunitiesTask(db_session).run()
