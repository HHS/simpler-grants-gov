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
    get_active_forms,
)
from src.task.opportunities.build_automatic_opportunities import (
    DEFAULT_COMPETITION_TITLE,
    PUBLIC_COMPETITION_ID_MAX_LENGTH,
    BuildAutomaticOpportunitiesTask,
    build_competition_title,
    build_public_competition_id,
)

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
    assert len(opportunities) == 53

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

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 53
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 0
    assert task.metrics[task.Metrics.COMPETITION_BACKFILLED_COUNT] == 0

    # Every competition gets a public competition ID and a title
    competitions = [c for opportunity in opportunities for c in opportunity.competitions]
    public_competition_ids = [c.public_competition_id for c in competitions]
    for competition in competitions:
        assert competition.public_competition_id == build_public_competition_id(
            competition.opportunity.opportunity_number, 1
        )
        assert competition.public_competition_id != str(competition.competition_id)
        assert len(competition.public_competition_id) <= PUBLIC_COMPETITION_ID_MAX_LENGTH
        assert competition.public_competition_id.isupper()
        assert competition.competition_title
    assert len(set(public_competition_ids)) == len(public_competition_ids)

    # Default titles include the form name so the competitions are easy to tell apart
    titles_by_opp_number = {
        c.opportunity.opportunity_number: c.competition_title for c in competitions
    }
    assert titles_by_opp_number["SGG-SF424_4_0"] == f"SF424_4_0 {DEFAULT_COMPETITION_TITLE}"

    # If we rerun the task, all opportunities should be skipped (including ALL-forms)
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert len(task.opportunities) == 0

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 0
    assert task.metrics[task.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT] == 53
    # Nothing is missing, so nothing is backfilled or changed
    assert task.metrics[task.Metrics.COMPETITION_BACKFILLED_COUNT] == 0
    assert [c.public_competition_id for c in competitions] == public_competition_ids


def test_backfills_missing_competition_data(enable_factory_create, db_session, forms):
    # The opportunities may already exist from an earlier test, so look them up
    BuildAutomaticOpportunitiesTask(db_session).run()

    competitions_by_opp_number = {
        opportunity.opportunity_number: opportunity.competitions[0]
        for opportunity in db_session.scalars(select(Opportunity))
        if opportunity.competitions
    }

    # Simulate competitions created before the fix
    sflll_competition = competitions_by_opp_number["E2E-SFLLL-ORG-IND-01"]
    sflll_competition.public_competition_id = None
    doj_competition = competitions_by_opp_number["MOCK-O-OVW-2025-172425-Dec102025"]
    doj_competition.public_competition_id = None
    doj_competition.competition_title = None
    # Values that are already set shouldn't be changed
    sf424_competition = competitions_by_opp_number["E2E-SF424-ORG-IND-01"]
    sf424_competition.public_competition_id = "EXISTING-ID"
    sf424_competition.competition_title = None
    db_session.commit()

    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()

    assert task.metrics[task.Metrics.OPPORTUNITY_CREATED_COUNT] == 0
    assert task.metrics[task.Metrics.COMPETITION_BACKFILLED_COUNT] == 3

    db_session.expire_all()
    assert sflll_competition.public_competition_id == "E2E-SFLLL-ORG-IND-01-C01"
    assert (
        sflll_competition.competition_title
        == "E2E Disclosure of Lobbying Activities (SF-LLL) ORG IND CT01"
    )
    assert doj_competition.public_competition_id == "MOCK-O-OVW-2025-172425-DEC102025-C01"
    assert (
        doj_competition.competition_title
        == "Tribal Domestic Violence and Sexual Assault Coalitions Grant Program"
    )
    assert sf424_competition.public_competition_id == "EXISTING-ID"
    assert (
        sf424_competition.competition_title
        == "E2E Application for Federal Assistance (SF-424) ORG IND CT01"
    )

    # Once backfilled, another run has nothing left to do
    task = BuildAutomaticOpportunitiesTask(db_session)
    task.run()
    assert task.metrics[task.Metrics.COMPETITION_BACKFILLED_COUNT] == 0


def test_backfills_previous_all_forms_opportunities(enable_factory_create, db_session, forms):
    # A new ALL-forms opportunity is created each day
    all_forms_numbers = ["SGG-ALL-Forms-2026-03-01", "SGG-ALL-Forms-2026-03-02"]
    for day in ["2026-03-01", "2026-03-02"]:
        with freeze_time(f"{day} 12:00:00"):
            BuildAutomaticOpportunitiesTask(db_session).run()

    competitions_by_opp_number = {
        opportunity.opportunity_number: opportunity.competitions[0]
        for opportunity in db_session.scalars(
            select(Opportunity).where(Opportunity.opportunity_number.in_(all_forms_numbers))
        )
    }
    assert set(competitions_by_opp_number) == set(all_forms_numbers)

    # Simulate ALL-forms competitions created before the fix
    for competition in competitions_by_opp_number.values():
        competition.public_competition_id = None
        competition.competition_title = None
    db_session.commit()

    # A later day's run never looks these opportunities up by number, but still backfills them
    with freeze_time("2026-03-03 12:00:00"):
        task = BuildAutomaticOpportunitiesTask(db_session)
        task.run()

    assert task.metrics[task.Metrics.COMPETITION_BACKFILLED_COUNT] == 2

    db_session.expire_all()
    for opp_number, competition in competitions_by_opp_number.items():
        assert competition.public_competition_id == f"{opp_number}-C01".upper()
        assert competition.competition_title == f"ALL-Forms {DEFAULT_COMPETITION_TITLE}"

    # Once backfilled, another run has nothing left to do
    with freeze_time("2026-03-03 12:00:00"):
        task = BuildAutomaticOpportunitiesTask(db_session)
        task.run()
    assert task.metrics[task.Metrics.COMPETITION_BACKFILLED_COUNT] == 0


def test_build_public_competition_id():
    assert build_public_competition_id("E2E-SFLLL-ORG-IND-01", 1) == "E2E-SFLLL-ORG-IND-01-C01"
    assert build_public_competition_id("E2E-SFLLL-ORG-IND-01", 12) == "E2E-SFLLL-ORG-IND-01-C12"
    # IDs are always uppercase
    assert (
        build_public_competition_id("SGG-ALL-Forms-2026-11-16", 1) == "SGG-ALL-FORMS-2026-11-16-C01"
    )

    # Long opportunity numbers are cut to stay within the limit
    long_id = build_public_competition_id("SGG-SupplementaryCoverSheetforNEHGrantPrograms", 1)
    assert long_id == "SGG-SUPPLEMENTARYCOVERSHEETFORNEHGRA-C01"
    assert len(long_id) == PUBLIC_COMPETITION_ID_MAX_LENGTH


def test_build_competition_title():
    assert (
        build_competition_title("SGG-SF424_4_0", DEFAULT_COMPETITION_TITLE)
        == f"SF424_4_0 {DEFAULT_COMPETITION_TITLE}"
    )
    # The date is left out for ALL-forms opportunities
    assert (
        build_competition_title("SGG-ALL-Forms-2026-11-16", DEFAULT_COMPETITION_TITLE)
        == f"ALL-Forms {DEFAULT_COMPETITION_TITLE}"
    )
    # Custom titles are kept as-is
    assert build_competition_title("E2E-SFLLL-ORG-IND-01", "Custom title") == "Custom title"


def test_public_competition_ids_are_unique_for_all_form_opportunities():
    # Opportunity numbers for long form names get cut, so make sure that
    # doesn't make two of the per-form opportunities share an ID.
    # The form registry can hold the same form more than once, so use a set.
    opportunity_numbers = {
        f"SGG-{form.short_form_name}" for form in get_active_forms() if not form.is_deprecated
    }
    public_competition_ids = {
        build_public_competition_id(opportunity_number, 1)
        for opportunity_number in opportunity_numbers
    }
    assert len(public_competition_ids) == len(opportunity_numbers)
    assert all(len(i) <= PUBLIC_COMPETITION_ID_MAX_LENGTH for i in public_competition_ids)


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
        "E2E-EPAKCG-ORG-IND-01": uuid.UUID("b677779b-2081-4212-8f38-7781f43af676"),
        "E2E-GGLOB-ORG-IND-01": uuid.UUID("552d5866-501a-40b6-b1ce-2efc7a2d3aa5"),
        "E2E-KC-ORG-IND-01": uuid.UUID("3f6a8c2e-9d41-4b7a-8e15-6a2f9c4d7b31"),
        "E2E-KCG-ORG-IND-01": uuid.UUID("1954f7d4-9d41-4d52-b7fc-c97d28815a9b"),
        "E2E-ONA-ORG-IND-01": uuid.UUID("717b7f78-52f2-49f9-b1b8-5d7118313d2a"),
        "E2E-NASAPIAORG-ORG-IND-01": uuid.UUID("17281277-7149-4a77-b13e-89fe7e2f344a"),
        "E2E-NSFKPEG-ORG-IND-01": uuid.UUID("7b0b7e69-0943-429e-b380-ebaf69985400"),
        "E2E-BNAG-ORG-IND-01": uuid.UUID("c45674bf-a5e8-4f90-b098-ff5158f08c5e"),
        "E2E-ONAG-ORG-IND-01": uuid.UUID("3675dfde-0c28-44aa-a733-b3ce88b29b3a"),
        "E2E-PABSG-ORG-IND-01": uuid.UUID("2e5d8bcd-bf18-449e-809c-15d21de7a22f"),
        "E2E-EDAG-ORG-IND-01": uuid.UUID("ea981400-e64a-4d17-a337-5b26b15f43cd"),
        "E2E-PABS-ORG-IND-01": uuid.UUID("d3081452-2cf8-4817-9abf-812e5d794485"),
        "E2E-PABSS-ORG-IND-01": uuid.UUID("e3bfbd7b-2205-46a8-9aa3-714f7e130958"),
        "E2E-PNA-ORG-IND-01": uuid.UUID("6bdc2df3-6e51-4aea-89af-bade326feba1"),
        "E2E-PNAG-ORG-IND-01": uuid.UUID("3b41ad38-a4eb-43e2-b124-7ebf56b05b1a"),
        "E2E-PPSL-ORG-IND-01": uuid.UUID("8a30cbe2-f297-49b7-b996-fc22982a3eb5"),
        "E2E-PPSLG-ORG-IND-01": uuid.UUID("4b585a14-ab56-42c1-a01f-78eba5b93d97"),
        "E2E-RRKPEG-ORG-IND-01": uuid.UUID("60993a94-d03a-4fcd-a97d-59608282c1c4"),
        "E2E-RRKPG-ORG-IND-01": uuid.UUID("17a8581a-779f-4199-a3f6-a2ffe7293dec"),
        "E2E-SF424-ORG-IND-01": uuid.UUID("a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
        "E2E-SF424SHORT-ORG-IND-01": uuid.UUID("425c2ffe-6fbd-4852-ab72-b64467fe3df0"),
        "E2E-SF424A-ORG-IND-01": uuid.UUID("6c25cd41-660e-473f-abff-654083b7795d"),
        "E2E-SF424B-ORG-IND-01": uuid.UUID("dbd8b2c4-0d6b-48b6-9427-32ee7795f4d6"),
        "E2E-SF424C-ORG-IND-01": uuid.UUID("a4c8e1f2-3b6d-4e91-8a2c-7f5b9d3e6a18"),
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
