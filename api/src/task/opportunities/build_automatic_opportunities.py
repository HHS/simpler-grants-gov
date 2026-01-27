import dataclasses
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
from src.form_schema.forms import (
    BudgetNarrativeAttachment_v1_2,
    ProjectAbstractSummary_v2_0,
    ProjectNarrativeAttachment_v1_2,
    SF424_v4_0,
    SF424a_v1_0,
    SF424b_v1_1,
    SFLLL_v2_0,
)
from src.services.opportunity_attachments.attachment_util import get_s3_attachment_path
from src.task.ecs_background_task import ecs_background_task
from src.task.task import Task
from src.task.task_blueprint import task_blueprint
from src.util import datetime_util, file_util

logger = logging.getLogger(__name__)


@dataclasses.dataclass
class OpportunityContainer:
    """Container class for helping create an opportunity
    and all the parts of it for testing. Most fields
    have default values that we'll use unless overriden.
    """

    ### Opportunity
    opportunity_title: str
    opportunity_number: str
    opportunity_id: uuid.UUID = dataclasses.field(default_factory=uuid.uuid4)
    agency_code: str = "SGG"
    category: OpportunityCategory = OpportunityCategory.DISCRETIONARY

    ### Assistance listing number
    # Note - only 1 is supported at the moment
    assistance_listing_number: str = "10.960"
    program_title: str = "Technical Agricultural Assistance"

    ### Opportunity summary
    summary_description: str = (
        "This opportunity exists for us to test our apply process for a given set of forms."
    )
    is_cost_sharing: bool = True
    is_forecast: bool = False
    post_date: date | None = None  # If None will default to current date
    close_date: date | None = date(2050, 1, 1)
    close_date_description: str | None = "Submissions accepted only until 5:00pm EST"
    archive_date: date | None = date(2051, 1, 1)
    expected_number_of_awards: int | None = dataclasses.field(
        default_factory=lambda: random.randint(1, 10)
    )
    estimated_total_program_funding: int | None = dataclasses.field(
        default_factory=lambda: random.randint(100_000, 999_999)
    )
    award_floor: int | None = dataclasses.field(
        default_factory=lambda: random.randint(10_000, 99_999)
    )
    award_ceiling: int | None = dataclasses.field(
        default_factory=lambda: random.randint(100_000, 999_999)
    )
    additional_info_url: str | None = "https://simpler.grants.gov"
    additional_info_url_description: str | None = "Click me for more info"
    funding_category_description: str | None = "These categories were chosen at random."
    applicant_eligibility_description: str | None = "These applicant types were chosen at random."
    agency_phone_number: str | None = "123-456-7890"
    agency_contact_description: str | None = "Bob Smith"
    agency_email_address: str | None = "fake@example.com"
    agency_email_address_description: str | None = "This is not a real email address."

    funding_instruments: list[FundingInstrument] = dataclasses.field(
        default_factory=lambda: random.sample(list(FundingInstrument), k=1)
    )
    funding_categories: list[FundingCategory] = dataclasses.field(
        default_factory=lambda: random.sample(list(FundingCategory), k=3)
    )
    applicant_types: list[ApplicantType] = dataclasses.field(
        default_factory=lambda: random.sample(list(ApplicantType), k=6)
    )

    # Note that opportunity status is recalculated hourly, so
    # setting this to something that doesn't align with our calculation
    # will be changed automatically.
    opportunity_status: OpportunityStatus = OpportunityStatus.POSTED

    ### Opportunity attachment
    # just one supported at the moment
    # If null file name, won't add.
    opportunity_attachment_file_name: str | None = "fake-NOFO.txt"
    opportunity_attachment_contents: str = "This is a fake NOFO"


@dataclasses.dataclass
class CompetitionContainer:
    ### Competition
    competition_title: str | None = "Competition for testing purposes"
    opening_date: date | None = dataclasses.field(
        default_factory=lambda: datetime_util.get_now_us_eastern_date()
    )
    closing_date: date | None = date(2050, 1, 1)
    grace_period: int | None = 1
    contact_info: str | None = "Example Person\n123-456-7890"
    # Application is open to everyone by default
    open_to_applicants: list[CompetitionOpenToApplicant] = dataclasses.field(
        default_factory=lambda: [
            CompetitionOpenToApplicant.INDIVIDUAL,
            CompetitionOpenToApplicant.ORGANIZATION,
        ]
    )
    is_simpler_grants_enabled: bool = True

    # If you set the opportunity to have no assistance listing,
    # make sure you set this to False as the logic assumes
    # one was created otherwise.
    # This can be False even if the opportunity has one, competitions
    # don't always have an assistance listing associated.
    has_assistance_listing: bool = True

    ### Forms
    required_form_ids: list[uuid.UUID] = dataclasses.field(default_factory=list)
    optional_form_ids: list[uuid.UUID] = dataclasses.field(default_factory=list)

    ### Competition Instructions
    # note that the instructions file will be a text file due to complexities in generating PDFs
    # if no file name, won't make instructions
    competition_instructions_file_name: str | None = "competition-instructions.txt"
    competition_instructions_file_contents: str = "These are fake competition instructions"


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

        # For each form, create an opportunity with just that form
        # Use uuid5 to create deterministic UUIDs based on form ID
        for form in forms:
            # Create a deterministic UUID based on the form ID
            form_opportunity_id = uuid.uuid5(
                uuid.NAMESPACE_DNS, f"simpler-grants-gov.form.{form.form_id}"
            )
            self.create_opportunity(
                OpportunityContainer(
                    opportunity_title=f"Opportunity for form {form.short_form_name}",
                    opportunity_number=f"SGG-{form.short_form_name}",
                    opportunity_id=form_opportunity_id,
                ),
                competitions=[CompetitionContainer(optional_form_ids=[form.form_id])],
            )

        # Always create an opportunity with all forms
        # that way if we add new forms, they're added
        # and we don't have to adjust something existing
        self.create_opportunity(
            OpportunityContainer(
                opportunity_title=f"Opportunity with ALL forms - {datetime_util.get_now_us_eastern_date().isoformat()}",
                opportunity_number=f"SGG-ALL-Forms-{datetime_util.get_now_us_eastern_date().isoformat()}",
            ),
            competitions=[CompetitionContainer(optional_form_ids=[form.form_id for form in forms])],
            force_create=True,
        )

        # Create various other specific scenarios
        self._create_opportunity_scenarios()

    def _create_opportunity_scenarios(self) -> None:
        """Define opportunity scenarios for various specific
        cases we want to build for testing or demoing"""

        ### Only open to organizations
        self.create_opportunity(
            OpportunityContainer(
                opportunity_title="Opportunity open to only organizations",
                opportunity_number="SGG-org-only-test",
                opportunity_id=uuid.UUID("10000000-0000-0000-0000-000000000001"),
            ),
            competitions=[
                CompetitionContainer(
                    required_form_ids=[ProjectAbstractSummary_v2_0.form_id],
                    optional_form_ids=[BudgetNarrativeAttachment_v1_2.form_id],
                    open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
                )
            ],
        )

        ### Only open to individuals
        self.create_opportunity(
            OpportunityContainer(
                opportunity_title="Opportunity open to only individuals",
                opportunity_number="SGG-indv-only-test",
                opportunity_id=uuid.UUID("10000000-0000-0000-0000-000000000002"),
            ),
            competitions=[
                CompetitionContainer(
                    required_form_ids=[ProjectAbstractSummary_v2_0.form_id],
                    optional_form_ids=[BudgetNarrativeAttachment_v1_2.form_id],
                    open_to_applicants=[CompetitionOpenToApplicant.INDIVIDUAL],
                )
            ],
        )

        ### Mock BOR Opportunity
        self.create_opportunity(
            OpportunityContainer(
                opportunity_title="MOCK PILOT - Native American Affairs: Technical Assistance to Tribes for Fiscal Year 2025",
                opportunity_number="MOCK-R25AS00293-Dec102025",
                opportunity_id=uuid.UUID("10000000-0000-0000-0000-000000000003"),
                agency_code="DOI-BOR",
                category=OpportunityCategory.DISCRETIONARY,
                assistance_listing_number="15.519",
                program_title="Indian Tribal Water Resources Development, Management, and Protection",
                summary_description="THIS IS NOT A REAL OPPORTUNITY - This is a copy of one from our production environment. The Bureau of Reclamation (Reclamation) through the Native American Affairs Technical Assistance Program (NAA/TAP), provides financial and technical assistance to federally recognized Tribes.The objective of this NOFO is to invite federally recognized Tribes to submit proposals for financial assistance for projects and activities that develop, manage, and protect their water and water related resources. Reclamation plans to make Fiscal Year 2025 funds available for proposals selected from this NOFO through Reclamation's five Regional Offices.Maximum award per applicant: $2,000,000; $1,000,000 per proposal.No cost share requirement; however, partnering and collaboration is encouraged. For further information on the NAA/TAP please visit: www.usbr.gov/native/programs/TAPprogram.html",
                is_cost_sharing=False,
                close_date=date(2026, 12, 31),
                close_date_description=None,
                expected_number_of_awards=None,
                estimated_total_program_funding=7_000_000,
                award_floor=50_000,
                award_ceiling=1_000_000,
                additional_info_url=None,
                additional_info_url_description=None,
                applicant_eligibility_description="To be considered for this program, applicants will meet all the following eligibility requirements:The Tribe must be a federally recognized Indian Tribe, as defined in 25 U.S.C. Section 5304, andThe Tribe must be located in one or more of the 17 western states identified in the Reclamation Act of June 17, 1902, as amended and supplemented: Arizona, California, Colorado, Idaho, Kansas, Montana, Nebraska, Nevada, New Mexico, North Dakota, Oklahoma, Oregon, South Dakota, Texas, Utah, Washington, and Wyoming.Any applicant with an enacted Indian Water Rights Settlement, should identify the settlement in their application and might not be eligible for an award under this NOFO due to the uniqueness of each settlement.Eligible activities may include, but are not limited to:Water need and water infrastructure assessments.Water management plans and studies.Short-term water quality or water measurement data collection and assessment to inform new management approaches.Training for Tribal staff and managers in areas of water resources' development, management and protection.Drilling domestic or stock watering wells.On-the-ground activities related to riparian and aquatic habitat with the goal to maintain or improve water quantity or water quality:Restoring wetlands.Controlling erosion.Stabilizing streambanks.Constructing ponds.Developing water basin plans.Distinct, stand-alone water related activities that are part of a larger project. Please note, if the work for which you are requesting funding is a phase of a larger project, please only describe the work that is reflected in the budget and exclude description of other activities or components of the overall projectProject activities not eligible for funding under this NOFO include, but are not limited to:Feasibility studies (as defined under Reclamation law, which require express congressional authorization).Activities that lack definable products or deliverables.Specific employment positions within an Indian Tribe.Activities with a duration of more than 2 years from date of execution of a grant/cooperative agreement.Activities that generate data or analyses that have the potential to compromise any study or activities of a U.S. Department of the Interior (Department) Indian water rights negotiation or the Department of Justice in its pursuit of related Indian water rights claims.Activities related to non-Federal or non-tribal dams and associated structures.Activities providing funding for the administration of contracts or agreements under P.L. 93-638 that are unrelated to the NAA/TAP.Purchase of equipment as the sole purpose of the activity.Water purchases including the purchase or leasing of water rights or water shares.Activities in direct support of litigation of any kind.Activities that will obligate Reclamation to provide, or are not sustainable unless Reclamation does provide, on-going funding, such as an obligation to provide future funding for operation, maintenance, or replacement.Biological activities such as:fisheries work (including collection, analysis and evaluation of background data);habitat restoration unless directly related to water quality and quantity; andecosystem based activities such as biological surveys, air quality monitoring, and watershed-scale management.",
                funding_category_description=None,
                funding_instruments=[
                    FundingInstrument.COOPERATIVE_AGREEMENT,
                    FundingInstrument.GRANT,
                ],
                funding_categories=[FundingCategory.NATURAL_RESOURCES],
                applicant_types=[
                    ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS
                ],
                opportunity_attachment_file_name=None,  # We'll manually upload files
            ),
            competitions=[
                CompetitionContainer(
                    competition_title="Native American Affairs: Technical Assistance to Tribes for Fiscal Year 2025",
                    required_form_ids=[
                        SF424_v4_0.form_id,
                        SF424a_v1_0.form_id,
                        BudgetNarrativeAttachment_v1_2.form_id,
                        ProjectAbstractSummary_v2_0.form_id,
                        ProjectNarrativeAttachment_v1_2.form_id,
                    ],
                    optional_form_ids=[SF424b_v1_1.form_id, SFLLL_v2_0.form_id],
                    open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
                    closing_date=date(2026, 12, 31),
                    grace_period=None,
                    competition_instructions_file_name=None,  # We'll manually upload files
                )
            ],
        )

        ### Mock DOJ Opportunity
        self.create_opportunity(
            OpportunityContainer(
                opportunity_title="DOJ Mock Opportunity",
                opportunity_number="MOCK-O-OVW-2025-172425-Dec102025",
                opportunity_id=uuid.UUID("10000000-0000-0000-0000-000000000004"),
                agency_code="USDOJ-OJP-OVW",
                category=OpportunityCategory.MANDATORY,
                assistance_listing_number="16.557",
                program_title="Tribal Domestic Violence and Sexual Assault Coalitions Grant Program",
                summary_description="THIS IS NOT A REAL OPPORTUNITY - This is a copy of one from our production environment. The OVW Grants to Tribal Domestic Violence and Sexual Assault Coalitions Program supports the development and operation of nonprofit, nongovernmental Tribal domestic violence and sexual assault coalitions. Eligible applicants will be invited by OVW to apply. Each recognized coalition will receive the same amount of base funding. Sexual assault coalitions and dual domestic violence/sexual assault coalitions will receive an additional amount for sexual assault-focused project activities.",
                is_cost_sharing=False,
                close_date=date(2026, 12, 31),
                close_date_description=None,
                expected_number_of_awards=21,
                estimated_total_program_funding=7_809_648,
                award_floor=337_640,
                award_ceiling=371_888,
                additional_info_url="https://www.justice.gov/ovw/media/1408381/dl?inline",
                additional_info_url_description="Full announcement",
                applicant_eligibility_description="Eligible applicants are limited to: recognized tribal domestic violence and sexual assault coalitions.",
                funding_category_description=None,
                funding_instruments=[FundingInstrument.GRANT],
                funding_categories=[FundingCategory.LAW_JUSTICE_AND_LEGAL_SERVICES],
                applicant_types=[
                    ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
                    ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
                    ApplicantType.OTHER,
                ],
                opportunity_attachment_file_name=None,  # We'll manually upload files
            ),
            competitions=[
                CompetitionContainer(
                    competition_title=None,
                    required_form_ids=[SF424_v4_0.form_id],
                    open_to_applicants=[CompetitionOpenToApplicant.ORGANIZATION],
                    closing_date=date(2026, 12, 31),
                    grace_period=None,
                    competition_instructions_file_name=None,  # We'll manually upload files
                )
            ],
        )

    def create_opportunity(
        self,
        data: OpportunityContainer,
        competitions: list[CompetitionContainer],
        force_create: bool = False,
    ) -> None:
        # We won't always remake the opportunities every time
        # unless the flag passed in says to do so
        if not force_create:
            existing_opportunity = (
                self.db_session.execute(
                    select(Opportunity).where(
                        Opportunity.opportunity_number == data.opportunity_number
                    )
                )
                .scalars()
                .first()
            )
            if existing_opportunity is not None:
                logger.info(
                    f"Skipping creating opportunity '{data.opportunity_number}' as it already exists",
                    extra={
                        "opportunity_id": existing_opportunity.opportunity_id,
                        "opportunity_number": data.opportunity_number,
                    },
                )
                self.increment(self.Metrics.OPPORTUNITY_ALREADY_EXIST_COUNT)
                return

        logger.info(f"Creating opportunity for scenario '{data.opportunity_number}'")
        current_date = datetime_util.get_now_us_eastern_date()

        ### Opportunity
        opportunity = Opportunity(
            opportunity_id=data.opportunity_id,
            legacy_opportunity_id=random.randint(100_000_000, 999_999_999),
            opportunity_number=data.opportunity_number,
            opportunity_title=data.opportunity_title,
            agency_code=data.agency_code,
            category=data.category,
            is_draft=False,
        )
        self.db_session.add(opportunity)
        self.opportunities.append(opportunity)

        ### Opportunity Assistance Listing
        opportunity_assistance_listing = OpportunityAssistanceListing(
            opportunity=opportunity,
            legacy_opportunity_assistance_listing_id=random.randint(100_000_000, 999_999_999),
            assistance_listing_number=data.assistance_listing_number,
            program_title=data.program_title,
        )
        self.db_session.add(opportunity_assistance_listing)

        ### Opportunity Summary
        opportunity_summary = OpportunitySummary(
            opportunity=opportunity,
            legacy_opportunity_id=opportunity.legacy_opportunity_id,
            summary_description=data.summary_description,
            is_cost_sharing=data.is_cost_sharing,
            is_forecast=data.is_forecast,
            post_date=data.post_date if data.post_date else current_date,
            close_date=data.close_date,
            close_date_description=data.close_date_description,
            archive_date=data.archive_date,
            expected_number_of_awards=data.expected_number_of_awards,
            estimated_total_program_funding=data.estimated_total_program_funding,
            award_floor=data.award_floor,
            award_ceiling=data.award_ceiling,
            additional_info_url=data.additional_info_url,
            additional_info_url_description=data.additional_info_url_description,
            funding_category_description=data.funding_category_description,
            applicant_eligibility_description=data.applicant_eligibility_description,
            agency_contact_description=data.agency_contact_description,
            agency_email_address=data.agency_email_address,
            agency_email_address_description=data.agency_email_address_description,
            funding_instruments=data.funding_instruments,
            funding_categories=data.funding_categories,
            applicant_types=data.applicant_types,
        )
        self.db_session.add(opportunity_summary)

        ### Current Opportunity Summary
        current_opportunity_summary = CurrentOpportunitySummary(
            opportunity=opportunity,
            opportunity_summary=opportunity_summary,
            opportunity_status=data.opportunity_status,
        )
        self.db_session.add(current_opportunity_summary)

        ### Competition(s)
        for comp_data in competitions:
            self.create_competition(comp_data, opportunity, opportunity_assistance_listing)

        ### Opportunity attachment
        file_name = data.opportunity_attachment_file_name
        if file_name:
            opportunity_attachment_id = uuid.uuid4()
            opp_attachment_s3_path = get_s3_attachment_path(
                file_name, opportunity_attachment_id, opportunity, self.s3_config
            )
            file_util.write_to_file(
                opp_attachment_s3_path, content=data.opportunity_attachment_contents
            )

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

        logger.info(
            f"Created opportunity '{data.opportunity_title}'",
            extra={"opportunity_id": opportunity.opportunity_id},
        )
        self.increment(self.Metrics.OPPORTUNITY_CREATED_COUNT)

    def create_competition(
        self,
        comp_data: CompetitionContainer,
        opportunity: Opportunity,
        opportunity_assistance_listing: OpportunityAssistanceListing | None,
    ) -> None:
        """Create a competition with provided info"""

        competition = Competition(
            competition_id=uuid.uuid4(),
            opportunity=opportunity,
            competition_title=comp_data.competition_title,
            opening_date=comp_data.opening_date,
            closing_date=comp_data.closing_date,
            grace_period=comp_data.grace_period,
            contact_info=comp_data.contact_info,
            opportunity_assistance_listing=(
                opportunity_assistance_listing if comp_data.has_assistance_listing else None
            ),
            open_to_applicants=comp_data.open_to_applicants,
            is_simpler_grants_enabled=comp_data.is_simpler_grants_enabled,
        )
        self.db_session.add(competition)

        ### Competition Forms
        for form_id in comp_data.required_form_ids:
            competition_form = CompetitionForm(
                competition=competition, form_id=form_id, is_required=True
            )
            self.db_session.add(competition_form)

        for form_id in comp_data.optional_form_ids:
            competition_form = CompetitionForm(
                competition=competition, form_id=form_id, is_required=False
            )
            self.db_session.add(competition_form)

        ### Competition instructions
        file_name = comp_data.competition_instructions_file_name
        if file_name:
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
                competition_instructions_s3_path,
                content=comp_data.competition_instructions_file_contents,
            )

            competition_instructions = CompetitionInstruction(
                competition_instruction_id=instruction_id,
                competition=competition,
                file_location=competition_instructions_s3_path,
                file_name=file_name,
            )
            self.db_session.add(competition_instructions)


@task_blueprint.cli.command(
    "build-automatic-opportunities", help="Utility to automatically create opportunities for forms"
)
@flask_db.with_db_session()
@ecs_background_task(task_name="build-automatic-opportunities")
def generate_opportunity_sql(db_session: db.Session) -> None:
    BuildAutomaticOpportunitiesTask(db_session).run()
