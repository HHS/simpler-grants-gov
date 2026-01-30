import logging
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

    # If we rerun the task, only the all-form opportunity will be created
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert len(task.opportunities) == 1
    assert all_form_ids == {
        c.form_id for c in task.opportunities[0].competitions[0].competition_forms
    }

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 1
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 11


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
        "SGG-ALL-Forms": uuid.uuid5(uuid.NAMESPACE_DNS, "simpler-grants-gov.all-forms"),
    }

    for opp_number, expected_id in expected_ids.items():
        assert opp_number in db_ids, f"Expected opportunity {opp_number} not found"
        assert db_ids[opp_number] == expected_id, (
            f"Opportunity {opp_number} has incorrect ID: "
            f"expected {expected_id}, got {db_ids[opp_number]}"
        )


def test_does_not_work_in_prod(db_session, monkeypatch):
    monkeypatch.setenv("ENVIRONMENT", "prod")
    with pytest.raises(Exception, match="This task is not meant to be run in production"):
        BuildAutomaticOpportunitiesTask(db_session).run()


def test_force_recreate_flag_recreates_opportunities(enable_factory_create, db_session, forms):
    """Test that force_recreate=True only recreates opportunities that allow it (hardcoded test scenarios)"""
    # 1. Run initially to create opportunities
    task1 = BuildAutomaticOpportunitiesTask(db_session)
    task1.run()

    # Store original IDs
    original_ids = {}
    for opp in task1.opportunities:
        original_ids[opp.opportunity_number] = opp.opportunity_id

    # 2. Run again with force_recreate=True
    task2 = BuildAutomaticOpportunitiesTask(db_session, force_recreate=True)
    task2.run()

    # The 4 hardcoded test scenarios should be recreated (allow_force_recreate=True)
    # The 7 form-based opportunities + ALL-forms should be skipped (allow_force_recreate=False)
    assert task2.metrics[task2.Metrics.OPPORTUNITY_CREATED_COUNT] == 4  # 4 test scenarios
    assert (
        task2.metrics[task2.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 8
    )  # 7 form-based + 1 ALL-forms


def test_id_mismatch_does_not_trigger_recreation_without_flag(
    enable_factory_create, db_session, forms, caplog
):
    """Test that a mismatch in existing opportunity ID triggers a warning but NOT a recreation without the flag"""
    # 1. Run initially
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    # Pick a scenario opportunity (e.g. SGG-org-only-test) which has a fixed ID
    target_opp_num = "SGG-org-only-test"
    target_opp_id = uuid.UUID("10000000-0000-0000-0000-000000000001")

    # Verify it exists with correct ID
    opp = (
        db_session.execute(
            select(Opportunity).where(Opportunity.opportunity_number == target_opp_num)
        )
        .scalars()
        .one()
    )
    assert opp.opportunity_id == target_opp_id

    # 2. Hack the DB to change the ID
    db_session.delete(opp)
    db_session.flush()

    fake_id = uuid.uuid4()
    fake_opp = Opportunity(
        opportunity_id=fake_id,
        legacy_opportunity_id=999999999,
        opportunity_number=target_opp_num,
        opportunity_title="Fake Opp",
        agency_code="FAKE",
        is_draft=False,
    )
    db_session.add(fake_opp)
    db_session.commit()

    # 3. Run task again (WITHOUT force_recreate)
    # We expect a warning
    with caplog.at_level(logging.WARNING):
        task2 = BuildAutomaticOpportunitiesTask(db_session)
        task2.run()

    # 4. Verify the opportunity STILL has the WRONG ID (not recreated)
    opp_refreshed = (
        db_session.execute(
            select(Opportunity).where(Opportunity.opportunity_number == target_opp_num)
        )
        .scalars()
        .one()
    )

    assert opp_refreshed.opportunity_id == fake_id
    assert opp_refreshed.opportunity_id != target_opp_id

    # Verify warning was logged
    assert "Skipping creating opportunity" in caplog.text
    assert "Run with --force-recreate" in caplog.text


def test_id_mismatch_triggers_recreation_with_flag(enable_factory_create, db_session, forms):
    """Test that a mismatch in existing opportunity ID triggers recreation WITH the flag"""
    # 1. Run initially
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    # Pick a scenario opportunity
    target_opp_num = "SGG-org-only-test"
    target_opp_id = uuid.UUID("10000000-0000-0000-0000-000000000001")

    # 2. Hack the DB to change the ID
    opp = (
        db_session.execute(
            select(Opportunity).where(Opportunity.opportunity_number == target_opp_num)
        )
        .scalars()
        .one()
    )
    db_session.delete(opp)
    db_session.flush()

    fake_id = uuid.uuid4()
    fake_opp = Opportunity(
        opportunity_id=fake_id,
        legacy_opportunity_id=999999999,
        opportunity_number=target_opp_num,
        opportunity_title="Fake Opp",
        agency_code="FAKE",
        is_draft=False,
    )
    db_session.add(fake_opp)
    db_session.commit()

    # 3. Run task again (WITH force_recreate)
    task2 = BuildAutomaticOpportunitiesTask(db_session, force_recreate=True)
    task2.run()

    # 4. Verify the opportunity back to the CORRECT ID
    opp_refreshed = (
        db_session.execute(
            select(Opportunity).where(Opportunity.opportunity_number == target_opp_num)
        )
        .scalars()
        .one()
    )

    assert opp_refreshed.opportunity_id == target_opp_id
    assert opp_refreshed.opportunity_id != fake_id
