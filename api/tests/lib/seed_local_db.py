import logging
import random

import click

import src.adapters.db as db
import src.logging
import src.util.datetime_util as datetime_util
import tests.src.db.models.factories as factories
from src.adapters.db import PostgresDBClient
from src.db.models.opportunity_models import Opportunity
from src.form_schema.forms.sf424 import SF424_v4_0
from src.form_schema.forms.sf424a import SF424a_v1_0
from src.util.local import error_if_not_local
from tests.lib.seed_agencies import _build_agencies
from tests.lib.seed_form import FORM_NAME, JSON_SCHEMA_FORM, UI_SCHEMA

logger = logging.getLogger(__name__)


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
        for agency in factories.CustomProvider.AGENCIES:
            factories.OpportunityFactory.create(agency_code=agency)
    logger.info("Finished creating opportunities")


def _build_pilot_competition(db_session: db.Session) -> None:
    logger.info("Creating an opportunity setup like our pilot")
    pilot_competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Local Pilot-equivalent Opportunity",
        competition_forms=[],
        with_instruction=True,
    )

    # Create/update the forms if they don't already exist
    sf424 = db_session.merge(SF424_v4_0, load=True)
    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=sf424, is_required=True
    )

    sf424a = db_session.merge(SF424a_v1_0, load=True)
    factories.CompetitionFormFactory.create(
        competition=pilot_competition, form=sf424a, is_required=True
    )

    logger.info(
        f"Created a pilot-like opportunity - http://localhost:3000/opportunity/{pilot_competition.opportunity_id}"
    )


def _build_user_saved_opportunities_and_searches(db_session: db.Session) -> None:
    logger.info("Creating users with saved opportunities and searches")
    saved_opportunities_count = 5
    saved_searched_count = 5

    # Retrieve list of possible opportunities
    opportunity_ids: list = db_session.execute(select(Opportunity.opportunity_id)).scalars().all()

    # Create users
    users = factories.UserFactory.create_batch(size=5)

    for user in users:
        # Create saved opportunities from randomly selected opportunities
        selected_opportunities = random.sample(opportunity_ids, saved_opportunities_count)
        for opportunity_id in selected_opportunities:
            factories.UserSavedOpportunityFactory.create(user=user, opportunity_id=opportunity_id)

        # Create saved searches from randomly selected opportunities
        for i in range(saved_searched_count):
            saved_search_opportunities_count = random.randint(1, 10)
            selected_opportunities = random.sample(
                opportunity_ids, saved_search_opportunities_count
            )
            factories.UserSavedSearchFactory.create(
                user=user,
                name=f"Save Search {i + 1}",
                search_query={"keywords": f"keyword {i + 1}"},
                searched_opportunity_ids=selected_opportunities,
            )


def _build_simple_competition():
    logger.info("Creating a very simple competition for local development")

    simple_competition = factories.CompetitionFactory.create(
        opportunity__opportunity_title="Local Very Simple Opportunity",
        competition_forms=[],
        with_instruction=True,
    )

    factories.CompetitionFormFactory.create(
        competition=simple_competition, is_required=True, form__with_instruction=True
    )
    factories.CompetitionFormFactory.create(
        competition=simple_competition,
        is_required=False,
        form__form_name=FORM_NAME,
        form__form_json_schema=JSON_SCHEMA_FORM,
        form__form_ui_schema=UI_SCHEMA,
    )

    logger.info(
        f"Created a very simple local opportunity - http://localhost:3000/opportunity/{simple_competition.opportunity_id}"
    )


def _build_competitions(db_session: db.Session) -> None:
    logger.info("Creating competitions")
    _build_simple_competition()
    _build_pilot_competition(db_session)


@click.command()
@click.option(
    "--iterations",
    default=1,
    help="Number of sets of opportunities to create, note that several are created per iteration",
)
@click.option(
    "--cover_all_agencies",
    default="false",
    help="Should the seed include an opportunity assigned to each agency?",
)
def seed_local_db(iterations: int, cover_all_agencies: bool) -> None:
    with src.logging.init("seed_local_db"):
        logger.info("Running seed script for local DB")
        error_if_not_local()

        db_client = PostgresDBClient()

        with db_client.get_session() as db_session:
            factories._db_session = db_session

            _build_opportunities(db_session, iterations, cover_all_agencies)
            # Need to commit to force any updates made
            # after factories created objects
            db_session.commit()

            _build_agencies(db_session)
            _build_competitions(db_session)
            _build_user_saved_opportunities_and_searches(db_session)
            db_session.commit()
