import dataclasses
import logging
import uuid
from datetime import timedelta

import click
import grants_shared.adapters.db as db
import grants_shared.logs
import grants_shared.util.datetime_util as datetime_util
from grants_shared.adapters.db import PostgresDBClient
from grants_shared.util.local import error_if_not_local
from sqlalchemy import select

import tests.src.db.models.factories as factories
from src.constants.lookup_constants import CompetitionOpenToApplicant
from src.db.models.agency_models import Agency
from src.db.models.competition_models import Competition, CompetitionForm, Form, FormInstruction
from src.db.models.opportunity_models import Opportunity
from src.form_schema.forms import get_active_forms, init_form_registry
from tests.lib.seed_agencies import _build_agencies
from tests.lib.seed_agencies_and_users import _build_agencies_and_users
from tests.lib.seed_award_recommendations import _build_award_recommendations
from tests.lib.seed_data_utils import CompetitionContainer
from tests.lib.seed_e2e import _build_users_and_tokens
from tests.lib.seed_orgs_and_users import _build_organizations_and_users, create_internal_users


def fetch_competition(db_session, competition_id):
    return db_session.scalar(
        select(Competition).where(Competition.competition_id == competition_id)
    )


logger = logging.getLogger(__name__)


@dataclasses.dataclass
class SeedConfig:
    iterations: int
    cover_all_agencies: bool

    seed_agencies: bool
    seed_opportunities: bool
    seed_forms: bool
    seed_users: bool
    seed_e2e: bool
    seed_award_recommendations: bool


def _build_opportunities(
    db_session: db.Session, iterations: int, cover_all_agencies: bool = True
) -> None:
    # Just create a variety of opportunities for local testing
    # we can eventually look into creating more specific scenarios
    for i in range(iterations):
        logger.info(f"Creating opportunity batch number {i}")
        # Create a few opportunities in various scenarios
        factories.OpportunityFactory.create_batch(size=5, is_forecasted_summary=True)
        factories.OpportunityFactory.create_batch(
            size=5, is_posted_summary=True, has_attachments=True
        )
        factories.OpportunityFactory.create_batch(
            size=2, is_posted_summary=True, has_attachment_with_duplicate_filename=True
        )
        factories.OpportunityFactory.create_batch(size=5, is_closed_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_archived_non_forecast_summary=True)
        factories.OpportunityFactory.create_batch(size=5, is_archived_forecast_summary=True)
        factories.OpportunityFactory.create_batch(size=5, no_current_summary=True)
        factories.OpportunityFactory.create_batch(
            size=2, is_posted_summary=True, has_long_descriptions=True
        )
        factories.OpportunityFactory.create_batch(
            size=2, is_posted_summary=True, has_long_descriptions=True, has_attachments=True
        )
        factories.OpportunityFactory.create_batch(
            size=2, agency_code="CLOSED", is_closed_summary=True
        )
        factories.OpportunityFactory.create_batch(
            size=2, agency_code="ARCHIVED", is_archived_non_forecast_summary=True
        )

        # hardcoded id for e2e usage
        # Check if it already exists before creating to allow running seed multiple times
        e2e_opportunity_id = uuid.UUID("6a483cd8-9169-418a-8dfb-60fa6e6f51e5")
        existing_e2e_opportunity = db_session.get(Opportunity, e2e_opportunity_id)

        if not existing_e2e_opportunity:
            factories.OpportunityFactory.create(
                has_long_descriptions=True, opportunity_id=e2e_opportunity_id
            )

        # generate a few opportunities with mostly null values
        all_null_opportunities = factories.OpportunityFactory.create_batch(
            size=5, all_fields_null=True
        )
        for all_null_opportunity in all_null_opportunities:
            summary = factories.OpportunitySummaryFactory.create(
                # We  set post_date to something so that running the set-current-opportunities logic
                # won't get rid of it for having a null post date
                all_fields_null=True,
                opportunity=all_null_opportunity,
                post_date=datetime_util.get_now_us_eastern_date(),
            )
            factories.CurrentOpportunitySummaryFactory.create(
                opportunity=all_null_opportunity, opportunity_summary=summary
            )
    if cover_all_agencies:
        agencies = factories.CustomProvider.AGENCIES
        agencies_with_opp = (
            db_session.execute(
                select(Opportunity.agency_code).where(Opportunity.agency_code.in_(agencies))
            )
            .scalars()
            .all()
        )

        for agency in agencies:
            if agency not in agencies_with_opp:
                factories.OpportunityFactory.create(agency_code=agency)

    # create a few Assistance Listing records
    factories.AssistanceListingFactory.create_batch(size=5)

    logger.info("Finished creating opportunities")


def _build_forms(db_session: db.Session) -> dict[str, Form]:
    """Seed form instructions and return in-memory form objects from the registry.

    The form table has been dropped — forms live in the in-memory registry only.
    We still need to seed FormInstruction rows for forms that have instructions
    so that S3 files exist for local dev.
    """
    logger.info("Rebuilding forms")

    active_forms = get_active_forms()
    forms = {}

    existing_form_instruction_ids = set(
        db_session.execute(select(FormInstruction.form_instruction_id)).scalars()
    )
    for form in active_forms:
        # We can't use our merge approach here because
        # we want the factory to create a file on s3
        # and that requires we run create and not build
        form_instruction_id = form.form_instruction_id
        if (
            form_instruction_id is not None
            and form_instruction_id not in existing_form_instruction_ids
        ):
            # Note that we make these text files as generating valid PDFs is surprisingly complex.
            factories.FormInstructionFactory.create(
                form_instruction_id=form.form_instruction_id,
                file_name=f"{form.short_form_name}.txt",
            )

        forms[form.short_form_name] = form

    return forms


def _build_pilot_competition(forms: dict[str, Form]) -> None:
    logger.info("Creating an opportunity setup like our pilot")
    pilot_competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Local Pilot-equivalent Opportunity",
        competition_forms=[],
        with_instruction=True,
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["SF424_4_0"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["SF424A"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["Project_AbstractSummary_2_0"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition,
        form=forms["ProjectNarrativeAttachments_1_2"],
        is_required=True,
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition,
        form=forms["BudgetNarrativeAttachments_1_2"],
        is_required=True,
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["SF424B"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["SFLLL_2_0"], is_required=False
    )

    logger.info(
        f"Created a pilot-like opportunity - http://localhost:3000/opportunity/{pilot_competition.opportunity_id}"
    )


def _build_individual_only_competition(forms: dict[str, Form]) -> None:
    logger.info("Creating an individual only opportunity")
    individual_only_competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Local Individual Only Opportunity",
        competition_forms=[],
        open_to_applicants=[CompetitionOpenToApplicant.INDIVIDUAL],
        with_instruction=True,
    )

    factories.CompetitionFormFactory.create(
        competition=individual_only_competition, form=forms["CD511"], is_required=True
    )

    logger.info(
        f"Created an individual only opportunity - http://localhost:3000/opportunity/{individual_only_competition.opportunity_id}"
    )


def _build_organization_only_competition(forms: dict[str, Form]) -> None:
    logger.info("Creating an organization only opportunity")
    organization_only_competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Local Organization Only Opportunity",
        competition_forms=[],
        open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
        with_instruction=True,
    )

    factories.CompetitionFormFactory.create(
        competition=organization_only_competition, form=forms["CD511"], is_required=True
    )

    logger.info(
        f"Created an organization only opportunity - http://localhost:3000/opportunity/{organization_only_competition.opportunity_id}"
    )


def _build_competition_for_form(form: Form) -> Competition:
    competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title=f"Test Opportunity for {form.short_form_name} {form.form_version}",
        competition_forms=[],
        with_instruction=True,
    )
    factories.CompetitionFormFactory.create(competition=competition, form=form, is_required=False)

    logger.info(
        f"Created a competition for form '{form.short_form_name} {form.form_version}' - http://localhost:3000/opportunity/{competition.opportunity_id}"
    )

    return competition


def _build_static_competition_with_all_forms(
    db_session: db.Session,
    forms: list[Form],
    static_opportunity_id: uuid.UUID,
    static_competition_id: uuid.UUID,
) -> Competition:
    competition = db_session.execute(
        select(Competition).where(Competition.competition_id == static_competition_id)
    ).scalar_one_or_none()

    # If the static competition doesn't yet exist, create it.
    if competition is None:
        competition = factories.CompetitionFactory.create(
            competition_id=static_competition_id,
            opportunity__opportunity_id=static_opportunity_id,
            opportunity__opportunity_title="STATIC Opportunity with ALL forms",
            competition_forms=[],
            with_instruction=True,
            # Set the close date way in the future
            closing_date=datetime_util.get_now_us_eastern_date() + timedelta(days=365),
        )
        forms_to_add = forms
    else:
        # If the static competition already exists
        # we want whatever forms might have been
        # created since the competition was setup initially
        forms_to_add = []

        existing_form_ids = [c.form_id for c in competition.competition_forms]

        for form in forms:
            if form.form_id not in existing_form_ids:
                forms_to_add.append(form)

    for form in forms_to_add:
        logger.info(f"Adding form {form.form_name} to static competition")
        factories.CompetitionFormFactory.create(
            competition=competition, form=form, is_required=False
        )

    logger.info(
        f"Created/updated a static competition with ALL forms' - http://localhost:3000/opportunity/{competition.opportunity_id}"
    )
    # Refresh the competition so any forms we just added
    # get added to the object
    db_session.refresh(competition)
    return competition


def _build_competition_with_all_forms(forms: list[Form]) -> Competition:
    competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Test Opportunity with ALL forms",
        competition_forms=[],
        with_instruction=True,
    )

    for form in forms:
        factories.CompetitionFormFactory.create(
            competition=competition, form=form, is_required=False
        )

    logger.info(
        f"Created a competition with ALL forms' - http://localhost:3000/opportunity/{competition.opportunity_id}"
    )

    return competition


def _build_seeded_competition_for_form(
    db_session: db.Session,
    form: Form,
    *,
    opportunity_id: uuid.UUID,
    opportunity_number: str,
    opportunity_title: str,
    competition_id: uuid.UUID,
    competition_title: str,
    is_required: bool = False,
    open_to_applicants: list[CompetitionOpenToApplicant] | None = None,
) -> Competition:

    if open_to_applicants is None:
        open_to_applicants = [
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        ]

    competition = fetch_competition(db_session, competition_id)

    if not competition:
        competition = factories.CompetitionFactory.create(
            competition_id=competition_id,
            opportunity__opportunity_id=opportunity_id,
            opportunity__opportunity_number=opportunity_number,
            opportunity__opportunity_title=opportunity_title,
            competition_title=competition_title,
            competition_forms=[],
            open_to_applicants=open_to_applicants,
            with_instruction=True,
        )

    if not does_competition_form_exist(
        db_session,
        competition.competition_id,
        form.form_id,
    ):
        factories.CompetitionFormFactory.create(
            competition=competition,
            form=form,
            is_required=is_required,
        )

    logger.info(
        f"Created seeded competition '{competition_title}' "
        f"for opportunity '{opportunity_number}'"
    )

    return competition


# Build custom competitions 8037 for testing 7953
def does_competition_form_exist(db_session, competition_id, form_id):
    return (
        db_session.scalar(
            select(CompetitionForm).where(
                CompetitionForm.competition_id == competition_id,
                CompetitionForm.form_id == form_id,
            )
        )
        is not None
    )


def does_opportunity_exist(db_session: db.Session, opportunity_id: uuid.UUID) -> bool:
    opportunity = db_session.get(Opportunity, opportunity_id)
    return opportunity is not None


def _build_custom_test_competitions(forms: dict[str, Form]) -> None:
    logger.info(
        "Creating custom test opportunities and competitions for Apply Happy Path scenarios"
    )
    # Static UUIDs for each opportunity and competition
    uuid_map = {
        "TEST-APPLY-ORG-IND-ON01": uuid.UUID("f7a1c2b3-4d5e-6789-8abc-1234567890ab"),
        "TEST-APPLY-ORG-IND-CT01": uuid.UUID("a2b3c4d5-6e7f-8901-9bcd-2345678901bc"),
        "TEST-APPLY-ORG-ON01": uuid.UUID("b3c4d5e6-7f80-9012-abcd-3456789012cd"),
        "TEST-APPLY-ORG-CT01": uuid.UUID("c4d5e6f7-8091-0123-bcde-4567890123de"),
        "TEST-APPLY-IND-ON01": uuid.UUID("d5e6f7a8-0912-1234-cdef-5678901234ef"),
        "TEST-APPLY-IND-CT01": uuid.UUID("e6f7a8b9-1023-2345-def0-6789012345f0"),
    }

    db_session = factories._db_session

    both_competition = fetch_competition(db_session, uuid_map["TEST-APPLY-ORG-IND-CT01"])
    if not both_competition:
        both_competition = factories.CompetitionFactory.create(
            competition_id=uuid_map["TEST-APPLY-ORG-IND-CT01"],
            opportunity__opportunity_id=uuid_map["TEST-APPLY-ORG-IND-ON01"],
            opportunity__opportunity_title="TEST-APPLY-ORG-IND-OT01",
            opportunity__opportunity_number="TEST-APPLY-ORG-IND-ON01",
            competition_title="TEST-APPLY-ORG-IND-CT01",
            competition_forms=[],
            open_to_applicants=[
                CompetitionOpenToApplicant.ORGANIZATION,
                CompetitionOpenToApplicant.INDIVIDUAL,
            ],
            with_instruction=True,
        )

    org_competition = fetch_competition(db_session, uuid_map["TEST-APPLY-ORG-CT01"])
    if not org_competition:
        org_competition = factories.CompetitionFactory.create(
            competition_id=uuid_map["TEST-APPLY-ORG-CT01"],
            opportunity__opportunity_id=uuid_map["TEST-APPLY-ORG-ON01"],
            opportunity__opportunity_title="TEST-APPLY-ORG-OT01",
            opportunity__opportunity_number="TEST-APPLY-ORG-ON01",
            competition_title="TEST-APPLY-ORG-CT01",
            competition_forms=[],
            open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
            with_instruction=True,
        )

    ind_competition = fetch_competition(db_session, uuid_map["TEST-APPLY-IND-CT01"])
    if not ind_competition:
        ind_competition = factories.CompetitionFactory.create(
            competition_id=uuid_map["TEST-APPLY-IND-CT01"],
            opportunity__opportunity_id=uuid_map["TEST-APPLY-IND-ON01"],
            opportunity__opportunity_title="TEST-APPLY-IND-OT01",
            opportunity__opportunity_number="TEST-APPLY-IND-ON01",
            competition_title="TEST-APPLY-IND-CT01",
            competition_forms=[],
            open_to_applicants=[CompetitionOpenToApplicant.INDIVIDUAL],
            with_instruction=True,
        )

    # Add forms to each competition
    for competition, opp_num, comp_title in [
        (both_competition, "TEST-APPLY-ORG-IND-ON01", "TEST-APPLY-ORG-IND-CT01"),
        (org_competition, "TEST-APPLY-ORG-ON01", "TEST-APPLY-ORG-CT01"),
        (ind_competition, "TEST-APPLY-IND-ON01", "TEST-APPLY-IND-CT01"),
    ]:
        # SF424B
        sf424b_form = forms["SF424B"]
        if not does_competition_form_exist(
            db_session, competition.competition_id, sf424b_form.form_id
        ):
            factories.CompetitionFormFactory.create(
                competition=competition, form=sf424b_form, is_required=True
            )
        # SFLLL_2_0
        sflll_form = forms["SFLLL_2_0"]
        if not does_competition_form_exist(
            db_session, competition.competition_id, sflll_form.form_id
        ):
            factories.CompetitionFormFactory.create(
                competition=competition, form=sflll_form, is_required=False
            )

        logger.info(
            f"Created Apply Happy Path competition '{comp_title}' for opportunity '{opp_num}' - http://localhost:3000/opportunity/{competition.opportunity_id}"
        )

    # Isolated scenario for testing Print Form
    _build_seeded_competition_for_form(
        db_session,
        forms["Project_AbstractSummary_2_0"],
        opportunity_id=uuid.UUID("f21dc67e-84d8-4e2b-ae3e-2d68f83957db"),
        opportunity_number="TEST-PRINT-ORG-IND-ON01",
        opportunity_title="TEST-PRINT-ORG-IND-OT01",
        competition_id=uuid.UUID("9e3b6fb9-85a7-4b71-9f8f-2ecb31d9e7f4"),
        competition_title="TEST-PRINT-ORG-IND-CT01",
        is_required=True,
        open_to_applicants=[
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        ],
    )

    # Isolated Forms testing competitions: one per form
    sgg_agency = db_session.scalar(select(Agency).where(Agency.agency_code == "SGG"))

    isolated_form_competitions = [
        # form names are abbreviated in opportunity number to be under the 40 char limit
        (
            "AttachmentForm_1_2",
            "E2E-ATT",
            "ATTACHMENTFORM",
            "97ee34df-fd89-400d-b4d4-ac9c5c7f61c1",
            "10048c4d-a23d-418e-b807-6f545d7a7bd2",
        ),
        (
            "BudgetNarrativeAttachments_1_2",
            "E2E-BNA",
            "Budget Narrative Attachment Form",
            "caea0f33-b356-4fcd-aae3-c0244e11da1e",
            "83adc230-32da-4dee-9dd6-beb1dffac459",
        ),
        (
            "CD511",
            "E2E-CD511",
            "CD511",
            "5b890089-2bb2-4123-82cd-3d321ca62efe",
            "ca184e83-baf2-4212-af4e-d355cf144bf5",
        ),
        (
            "EPA4700_4",
            "E2E-EPA4700",
            "EPA Form 4700-4",
            "95f80b3b-c119-4a89-a50f-1b47b95a9191",
            "bd893d81-b8da-4f9b-ba18-f3c7b2fa9686",
        ),
        (
            "EPA_KeyContacts",
            "E2E-EPAKC",
            "EPA Key Contacts Form",
            "1cc0cbb3-cc2a-4c09-a001-ad1f2d9aa631",
            "165fad29-80d2-4c2d-b86b-1906fd68cf3f",
        ),
        (
            "GG_LobbyingForm",
            "E2E-GGLOB",
            "Grants.gov Lobbying Form",
            "552d5866-501a-40b6-b1ce-2efc7a2d3aa5",
            "bae608bd-56cf-4038-8436-02da6af72df8",
        ),
        (
            "OtherNarrativeAttachments",
            "E2E-ONA",
            "Other Narrative Attachments",
            "717b7f78-52f2-49f9-b1b8-5d7118313d2a",
            "6098d8b0-8025-448e-a407-a0ac56d27d3e",
        ),
        (
            "Project_Abstract",
            "E2E-PABS",
            "Project Abstract",
            "d3081452-2cf8-4817-9abf-812e5d794485",
            "70238095-fbae-48c3-9007-83446416b18d",
        ),
        (
            "Project_AbstractSummary_2_0",
            "E2E-PABSS",
            "Project Abstract Summary",
            "e3bfbd7b-2205-46a8-9aa3-714f7e130958",
            "c6e468de-2911-494e-aa14-91b527a1f53e",
        ),
        (
            "ProjectNarrativeAttachments_1_2",
            "E2E-PNA",
            "Project Narrative Attachment Form",
            "6bdc2df3-6e51-4aea-89af-bade326feba1",
            "3219b68b-c3c5-41d8-b889-d75eafd014d5",
        ),
        (
            "PerformanceSite",
            "E2E-PPSL",
            "Project Performance Site Location(s)",
            "8a30cbe2-f297-49b7-b996-fc22982a3eb5",
            "7fc52d4e-6efb-421d-8b0a-8c9e982f1e0f",
        ),
        (
            "SF424_4_0",
            "E2E-SF424",
            "Application for Federal Assistance (SF-424)",
            "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
            "f0a1b2c3-d4e5-6789-0abc-def123456789",
        ),
        (
            "SF424A",
            "E2E-SF424A",
            "Budget Information for Non-Construction Programs (SF-424A)",
            "6c25cd41-660e-473f-abff-654083b7795d",
            "57bc877e-60b5-4ae0-bd5c-3e97248e57f2",
        ),
        (
            "SF424B",
            "E2E-SF424B",
            "Assurances for Non-Construction Programs (SF-424B)",
            "dbd8b2c4-0d6b-48b6-9427-32ee7795f4d6",
            "15d10405-d81b-4b8e-ae56-8ac1bd4c5560",
        ),
        (
            "SF424D",
            "E2E-SF424D",
            "Assurances for Construction Programs (SF-424D)",
            "abd9bce9-2b9b-46b8-b814-2c5cb7c5e88b",
            "2946ff6a-c2ce-4f05-8358-4dea1e2e7c51",
        ),
        (
            "SFLLL_2_0",
            "E2E-SFLLL",
            "Disclosure of Lobbying Activities (SF-LLL)",
            "f3e438ee-ff4c-475b-a058-8049aee9abda",
            "4924f35b-7941-4d50-889c-3afaa726b671",
        ),
        (
            "SupplementaryCoverSheetforNEHGrantPrograms",
            "E2E-NEHCS",
            "Supplementary Cover Sheet for NEH Grant Programs",
            "b88287e2-7e2a-4c99-8ffe-30ab50c388ef",
            "5ba6e068-8f9e-4cbc-89bf-56bbb142b842",
        ),
    ]

    for (
        form_name,
        prefix,
        form_label,
        opportunity_id,
        competition_id,
    ) in isolated_form_competitions:
        opportunity_number = f"{prefix}-ORG-IND-01"
        opportunity_title = f"E2E {form_label} ORG IND OT01"
        competition_title = f"E2E {form_label} ORG IND CT01"

        competition = _build_seeded_competition_for_form(
            db_session,
            forms[form_name],
            opportunity_id=uuid.UUID(opportunity_id),
            opportunity_number=opportunity_number,
            opportunity_title=opportunity_title,
            competition_id=uuid.UUID(competition_id),
            competition_title=competition_title,
            is_required=True,
            open_to_applicants=[
                CompetitionOpenToApplicant.INDIVIDUAL,
                CompetitionOpenToApplicant.ORGANIZATION,
            ],
        )

        if sgg_agency:
            competition.opportunity.agency_code = "SGG"
            competition.opportunity.agency_id = sgg_agency.agency_id

        for aln in competition.opportunity.opportunity_assistance_listings:
            aln.assistance_listing_number = "10.960"
            aln.program_title = "Technical Agricultural Assistance"

        db_session.flush()


def _build_competitions(db_session: db.Session, forms_map: dict[str, Form]) -> CompetitionContainer:
    logger.info("Creating competitions")
    _build_pilot_competition(forms_map)
    _build_individual_only_competition(forms_map)
    _build_organization_only_competition(forms_map)
    _build_custom_test_competitions(forms_map)

    forms = list(forms_map.values())

    static_all_form_competition = _build_static_competition_with_all_forms(
        db_session,
        forms,
        static_opportunity_id=uuid.UUID("c3c59562-a54f-4203-b0f6-98f2f0383481"),
        static_competition_id=uuid.UUID("859ab4a4-a6c3-46c5-b63e-6d1396ae9c86"),
    )
    all_form_competition = _build_competition_with_all_forms(forms)
    competition_container = CompetitionContainer(
        static_competition_with_all_forms=static_all_form_competition,
        competition_with_all_forms=all_form_competition,
    )

    for form in forms:
        competition = _build_competition_for_form(form)
        competition_container.add_form_competition(form, competition)

    return competition_container


def _build_user_organizations(db_session: db.Session) -> None:
    logger.info("Creating user organizations")

    batch_size = 2

    users = factories.UserFactory.create_batch(size=batch_size)
    organizations = factories.OrganizationFactory.create_batch(size=batch_size)
    for index in range(batch_size):
        user = users[index - 1]
        organization = organizations[index - 1]
        factories.OrganizationUserFactory.create(user=user, organization=organization)


@click.command()
@click.option(
    "--iterations",
    default=1,
    help="Number of sets of opportunities to create, note that several are created per iteration",
)
@click.option(
    "--cover_all_agencies",
    default=True,
    help="Should the seed include an opportunity assigned to each agency?",
)
@click.option(
    "--steps",
    "-s",
    default=["ALL"],
    type=click.Choice(
        ["ALL", "agencies", "opps", "forms", "users", "api", "award_recommendations"],
    ),
    multiple=True,
    help="Which steps of the process should be run",
)
def seed_local_db(iterations: int, cover_all_agencies: bool, steps: list[str]) -> None:
    seed_config = SeedConfig(
        iterations=iterations,
        cover_all_agencies=cover_all_agencies,
        seed_agencies="ALL" in steps or "agencies" in steps,
        seed_opportunities="ALL" in steps or "opps" in steps,
        seed_forms="ALL" in steps or "forms" in steps,
        seed_users="ALL" in steps or "users" in steps,
        seed_e2e="ALL" in steps or "e2e" in steps,
        seed_award_recommendations="ALL" in steps or "award_recommendations" in steps,
    )

    with grants_shared.logs.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session
            run_seed_logic(db_session, seed_config)


def run_seed_logic(db_session: db.Session, seed_config: SeedConfig) -> None:

    if seed_config.seed_agencies:
        _build_agencies(db_session)
    if seed_config.seed_opportunities:
        _build_opportunities(db_session, seed_config.iterations, seed_config.cover_all_agencies)
        # Need to commit to force any updates made
        # after factories created objects
        db_session.commit()

    competition_container: CompetitionContainer | None = None
    if seed_config.seed_forms:
        init_form_registry()
        forms_map = _build_forms(db_session)
        competition_container = _build_competitions(db_session, forms_map)
    if seed_config.seed_users:
        create_internal_users(db_session)
        _build_organizations_and_users(db_session, competition_container)
        _build_agencies_and_users(db_session)
    if seed_config.seed_e2e:
        _build_users_and_tokens(db_session)
    if seed_config.seed_award_recommendations:
        _build_award_recommendations(db_session)
    db_session.commit()
