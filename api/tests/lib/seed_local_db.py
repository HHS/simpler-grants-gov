import dataclasses
import logging
import uuid
from datetime import timedelta

import click
from sqlalchemy import select

import src.adapters.db as db
import src.logging
import src.util.datetime_util as datetime_util
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.constants.lookup_constants import CompetitionOpenToApplicant
from src.db.models.competition_models import Competition, Form, FormInstruction
from src.db.models.opportunity_models import Opportunity
from src.form_schema.forms import get_active_forms
from src.form_schema.jsonschema_resolver import resolve_jsonschema
from src.util.local import error_if_not_local
from tests.lib.seed_agencies import _build_agencies
from tests.lib.seed_data_utils import CompetitionContainer
from tests.lib.seed_e2e import _build_users_and_tokens
from tests.lib.seed_orgs_and_users import _build_organizations_and_users, seed_internal_admin

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

    logger.info("Finished creating opportunities")


def _build_forms(db_session: db.Session) -> dict[str, Form]:
    """Load all of our forms into the DB"""
    logger.info("Rebuilding forms")

    active_forms = get_active_forms()
    forms = {}

    # For each form we need to sync the form record into
    # the database. If the form has form instructions
    # we'll create that if it doesn't already exist.
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

        form.form_json_schema = resolve_jsonschema(form.form_json_schema)
        forms[form.short_form_name] = db_session.merge(form, load=True)

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


def _build_competitions(db_session: db.Session, forms_map: dict[str, Form]) -> CompetitionContainer:
    logger.info("Creating competitions")
    _build_pilot_competition(forms_map)
    _build_individual_only_competition(forms_map)
    _build_organization_only_competition(forms_map)

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
        ["ALL", "agencies", "opps", "forms", "users", "api"],
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
    )

    with src.logging.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session
            run_seed_logic(db_session, seed_config)


def run_seed_logic(db_session: db.Session, seed_config: SeedConfig) -> None:

    if seed_config.seed_opportunities:
        _build_opportunities(db_session, seed_config.iterations, seed_config.cover_all_agencies)
        # Need to commit to force any updates made
        # after factories created objects
        db_session.commit()

    competition_container: CompetitionContainer | None = None
    if seed_config.seed_agencies:
        _build_agencies(db_session)
    if seed_config.seed_forms:
        forms_map = _build_forms(db_session)
        competition_container = _build_competitions(db_session, forms_map)
    if seed_config.seed_users:
        seed_internal_admin(db_session)
        _build_organizations_and_users(db_session, competition_container)
    if seed_config.seed_e2e:
        _build_users_and_tokens(db_session)
    db_session.commit()
