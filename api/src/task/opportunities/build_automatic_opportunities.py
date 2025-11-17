import logging
import os
import random
import uuid
from datetime import date
from enum import StrEnum

from sqlalchemy import select

from src.adapters import db
from src.adapters.aws import S3Config
from src.adapters.db import flask_db
from src.constants.lookup_constants import (
    ApplicantType,
    CompetitionOpenToApplicant,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
    OpportunityStatus,
)
from src.db.models.competition_models import (
    Competition,
    CompetitionForm,
    CompetitionInstruction,
    Form,
)
from src.db.models.opportunity_models import (
    CurrentOpportunitySummary,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunityAttachment,
    OpportunitySummary,
)
from src.services.opportunity_attachments.attachment_util import get_s3_attachment_path
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util, file_util

logger = logging.getLogger(__name__)


class BuildAutomaticOpportunitiesTask(Task):

    class Metrics(StrEnum):
        OPPORTUNITY_CREATED_COUNT = "opportunity_created_count"
        OPPORTUNITY_ALREADY_EXIST_COUNT = "opportunity_already_exist_count"

    def __init__(self, db_session: db.Session, s3_config: S3Config | None = None) -> None:
        super().__init__(db_session)

        if s3_config is None:
            s3_config = S3Config()

        self.s3_config = s3_config
        # This just exists to make tests easier to find the opportunities created
        self.opportunities: list[Opportunity] = []

    def run_task(self) -> None:
        if os.getenv("ENVIRONMENT", None) not in ["local", "dev", "staging", "training"]:
            raise Exception("This task is not meant to be run in production")

        with self.db_session.begin():
            self.create_opportunities()

    def create_opportunities(self) -> None:
        # Fetch all non-deprecated forms
        forms = self.db_session.scalars(select(Form).where(Form.is_deprecated.isnot(True))).all()

        for form in forms:
            self.create_opportunity([form], f"Opportunity for form {form.short_form_name}")

        # Always create an opportunity with all forms
        # that way if we add new forms, they're added
        # and we don't have to adjust something existing
        self.create_opportunity(
            list(forms),
            f"Opportunity with ALL forms - {datetime_util.get_now_us_eastern_date().isoformat()}",
            force_create=True,
        )

    def create_opportunity(
        self, forms: list[Form], opportunity_title: str, force_create: bool = False
    ) -> None:
        # We won't always remake the opportunities every time
        # unless the flag passed in says to do so
        if not force_create:
            existing_opportunity = (
                self.db_session.execute(
                    select(Opportunity).where(Opportunity.opportunity_title == opportunity_title)
                )
                .scalars()
                .first()
            )
            if existing_opportunity is not None:
                logger.info(
                    f"Skipping creating opportunity '{opportunity_title}' as it already exists",
                    extra={"opportunity_id": existing_opportunity.opportunity_id},
                )
                self.increment(self.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT)
                return

        logger.info(f"Creating opportunity for scenario '{opportunity_title}'")
        current_date = datetime_util.get_now_us_eastern_date()

        ### Opportunity
        opportunity = Opportunity(
            opportunity_id=uuid.uuid4(),
            legacy_opportunity_id=random.randint(100_000_000, 999_999_999),
            opportunity_number=f"SGG-{random.randint(100_000_000, 999_999_999)}-{current_date.isoformat()}",
            opportunity_title=opportunity_title,
            agency_code="SGG",
            category=OpportunityCategory.DISCRETIONARY,
            is_draft=False,
        )
        self.db_session.add(opportunity)
        self.opportunities.append(opportunity)

        ### Opportunity Assistance Listing
        opportunity_assistance_listing = OpportunityAssistanceListing(
            opportunity=opportunity,
            legacy_opportunity_assistance_listing_id=random.randint(100_000_000, 999_999_999),
            assistance_listing_number="10.960",
            program_title="Technical Agricultural Assistance",
        )
        self.db_session.add(opportunity_assistance_listing)

        ### Opportunity Summary
        opportunity_summary = OpportunitySummary(
            opportunity=opportunity,
            legacy_opportunity_id=opportunity.legacy_opportunity_id,
            summary_description="This opportunity exists for us to test our apply process for a given set of forms.",
            is_cost_sharing=True,
            is_forecast=False,
            post_date=current_date,
            close_date=date(2050, 1, 1),
            close_date_description="Submissions accepted only until 5:00pm EST",
            archive_date=date(2051, 1, 1),
            expected_number_of_awards=random.randint(1, 10),
            estimated_total_program_funding=random.randint(100_000, 999_999),
            award_floor=random.randint(10_000, 99_999),
            award_ceiling=random.randint(100_000, 999_999),
            additional_info_url="https://simpler.grants.gov",
            additional_info_url_description="Click me for more info",
            funding_category_description="These categories were chosen at random.",
            applicant_eligibility_description="These applicant types were chosen at random.",
            agency_phone_number="123-456-7890",
            agency_contact_description="Bob Smith",
            agency_email_address="fake@example.com",
            agency_email_address_description="This is not a real email address.",
            # Add a random assortment of funding instruments/categories and applicant types
            funding_instruments=random.sample(list(FundingInstrument), k=1),
            funding_categories=random.sample(list(FundingCategory), k=3),
            applicant_types=random.sample(list(ApplicantType), k=6),
        )
        self.db_session.add(opportunity_summary)

        ### Current Opportunity Summary
        current_opportunity_summary = CurrentOpportunitySummary(
            opportunity=opportunity,
            opportunity_summary=opportunity_summary,
            opportunity_status=OpportunityStatus.POSTED,
        )
        self.db_session.add(current_opportunity_summary)

        ### Competition
        competition = Competition(
            competition_id=uuid.uuid4(),
            opportunity=opportunity,
            competition_title=f"Competition for {opportunity_title}",
            opening_date=datetime_util.get_now_us_eastern_date(),
            closing_date=date(2050, 1, 1),
            grace_period=1,
            contact_info="Example Person\n123-456-7890",
            opportunity_assistance_listing=opportunity_assistance_listing,
            # Make the application open to everyone
            open_to_applicants=[
                CompetitionOpenToApplicant.INDIVIDUAL,
                CompetitionOpenToApplicant.ORGANIZATION,
            ],
            is_simpler_grants_enabled=True,
        )
        self.db_session.add(competition)

        ### Competition Forms
        for form in forms:
            competition_form = CompetitionForm(
                competition=competition, form=form, is_required=False
            )
            self.db_session.add(competition_form)

        ### Opportunity attachment
        file_name = f"{opportunity.opportunity_number}-fake-NOFO.txt"
        opportunity_attachment_id = uuid.uuid4()
        opp_attachment_s3_path = get_s3_attachment_path(
            file_name, opportunity_attachment_id, opportunity, self.s3_config
        )
        file_util.write_to_file(opp_attachment_s3_path, content="This is a fake NOFO")

        opportunity_attachment = OpportunityAttachment(
            attachment_id=opportunity_attachment_id,
            legacy_attachment_id=random.randint(100_000_000, 999_999_999),
            opportunity=opportunity,
            file_location=opp_attachment_s3_path,
            mime_type="text/plain",
            file_name=file_name,
            file_description="Fake NOFO file - automatically generated",
            file_size_bytes=1000,
        )
        self.db_session.add(opportunity_attachment)

        ### Competition instructions
        file_name = f"{opportunity.opportunity_number}-instructions.txt"
        instruction_id = uuid.uuid4()
        competition_instructions_s3_path = file_util.join(
            self.s3_config.public_files_bucket_path,
            "competitions",
            str(competition.competition_id),
            "instructions",
            str(instruction_id),
            file_name,
        )
        file_util.write_to_file(
            competition_instructions_s3_path, content="These are fake competition instructions"
        )

        competition_instructions = CompetitionInstruction(
            competition_instruction_id=instruction_id,
            competition=competition,
            file_location=competition_instructions_s3_path,
            file_name=file_name,
        )
        self.db_session.add(competition_instructions)

        logger.info(
            f"Created opportunity '{opportunity_title}'",
            extra={"opportunity_id": opportunity.opportunity_id},
        )
        self.increment(self.Metrics.OPPORTUNITY_CREATED_COUNT)


@task_blueprint.cli.command(
    "build-automatic-opportunities", help="Utility to automatically create opportunities for forms"
)
@flask_db.with_db_session()
@ecs_background_task(task_name="build-automatic-opportunities")
def generate_opportunity_sql(db_session: db.Session) -> None:
    BuildAutomaticOpportunitiesTask(db_session).run()
