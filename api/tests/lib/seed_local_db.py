import dataclasses
import logging

import click
from sqlalchemy import select

import src.adapters.db as db
import src.logging
import src.util.datetime_util as datetime_util
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.db.models.competition_models import Competition, Form, FormInstruction
from src.db.models.opportunity_models import Opportunity
from src.form_schema.forms.budget_narrative_attachment import BudgetNarrativeAttachment_v1_2
from src.form_schema.forms.project_abstract_summary import ProjectAbstractSummary_v2_0
from src.form_schema.forms.project_narrative_attachment import ProjectNarrativeAttachment_v1_2
from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.forms.sf424a import SF424a_v1_0
from src.form_schema.forms.sf424b import SF424b_v1_1
from src.form_schema.forms.sflll import SFLLL_v2_0
from src.util.local import error_if_not_local
from tests.lib.seed_agencies import _build_agencies
from tests.lib.seed_data_utils import CompetitionContainer
from tests.lib.seed_e2e import _build_users_and_tokens
from tests.lib.seed_orgs_and_users import _build_organizations_and_users

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

    forms_raw = {
        "sf424": SF424_v4_0,
        "sf424a": SF424a_v1_0,
        "project_abstract_summary": ProjectAbstractSummary_v2_0,
        "project_narrative_attachment": ProjectNarrativeAttachment_v1_2,
        "budget_narrative_attachment": BudgetNarrativeAttachment_v1_2,
        "sf424b": SF424b_v1_1,
        "sflll": SFLLL_v2_0,
    }

    # For each form we need to sync the form record into
    # the database. If the form has form instructions
    # we'll create that if it doesn't already exist.
    forms = {}

    existing_form_instruction_ids = set(
        db_session.execute(select(FormInstruction.form_instruction_id)).scalars()
    )
    for form_name, form in forms_raw.items():

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
                form_instruction_id=form.form_instruction_id, file_name=f"{form_name}.txt"
            )

        forms[form_name] = db_session.merge(form, load=True)

    return forms


def _build_pilot_competition(forms: dict[str, Form]) -> None:
    logger.info("Creating an opportunity setup like our pilot")
    pilot_competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Local Pilot-equivalent Opportunity",
        competition_forms=[],
        with_instruction=True,
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["sf424"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["sf424a"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["project_abstract_summary"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["project_narrative_attachment"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["budget_narrative_attachment"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["sf424b"], is_required=True
    )

    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=forms["sflll"], is_required=False
    )

    logger.info(
        f"Created a pilot-like opportunity - http://localhost:3000/opportunity/{pilot_competition.opportunity_id}"
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


def _build_competitions(forms_map: dict[str, Form]) -> CompetitionContainer:
    logger.info("Creating competitions")
    _build_pilot_competition(forms_map)

    all_form_competition = _build_competition_with_all_forms(list(forms_map.values()))
    competition_container = CompetitionContainer(competition_with_all_forms=all_form_competition)

    for form in forms_map.values():
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
        competition_container = _build_competitions(forms_map)
    if seed_config.seed_users:
        _build_organizations_and_users(db_session, competition_container)
    if seed_config.seed_e2e:
        _build_users_and_tokens(db_session)
    db_session.commit()
