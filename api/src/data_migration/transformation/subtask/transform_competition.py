import logging

from sqlalchemy import select

import src.data_migration.transformation.transform_constants as transform_constants
import src.data_migration.transformation.transform_util as transform_util
from src.constants.lookup_constants import CompetitionOpenToApplicant, FormFamily
from src.data_migration.transformation.subtask.abstract_transform_subtask import (
    AbstractTransformSubTask,
)
from src.db.models.competition_models import Competition
from src.db.models.opportunity_models import Opportunity
from src.db.models.staging.competition import Tcompetition
from src.db.models.staging.opportunity import TopportunityCfda

logger = logging.getLogger(__name__)


class TransformCompetition(AbstractTransformSubTask):
    def transform_records(self) -> None:
        logger.info("Processing competitions")

        # Fetch all competitions that need to be processed
        # Alongside that, grab the existing competition record
        competitions: list[tuple[Tcompetition, Competition | None]] = self.fetch(
            Tcompetition,
            Competition,
            [Tcompetition.comp_id == Competition.legacy_competition_id],
        )

        for source_competition, target_competition in competitions:
            try:
                self.process_competition(source_competition, target_competition)
            except ValueError:
                self.increment(
                    transform_constants.Metrics.TOTAL_ERROR_COUNT,
                    prefix=transform_constants.COMPETITION,
                )
                logger.exception(
                    "Failed to process competition",
                    extra={"competition_id": source_competition.comp_id},
                )

    def process_competition(
        self, source_competition: Tcompetition, target_competition: Competition | None
    ) -> None:
        self.increment(
            transform_constants.Metrics.TOTAL_RECORDS_PROCESSED,
            prefix=transform_constants.COMPETITION,
        )

        extra = {"competition_id": source_competition.comp_id}
        logger.info("Processing competition", extra=extra)

        if source_competition.is_deleted:
            self._handle_delete(
                source=source_competition,
                target=target_competition,
                record_type=transform_constants.COMPETITION,
                extra=extra,
            )
            # Update transformed_at timestamp to mark it as processed
            source_competition.transformed_at = self.transform_time
            return

        # Find the related opportunity and opportunity_assistance_listing
        opportunity_id = None
        opportunity_assistance_listing_id = None

        # One major thing to call out is how a competition connects to an opportunity in the old system.
        # These always needed to go via opportunity_cfda (now opportunity assistance listing).
        if source_competition.opp_cfda_id is not None:
            # Look up the assistance listing to find the opportunity ID
            opportunity_cfda = self.db_session.execute(
                select(TopportunityCfda).where(
                    TopportunityCfda.opp_cfda_id == source_competition.opp_cfda_id
                )
            ).scalar_one_or_none()

            if opportunity_cfda:
                opportunity_id = opportunity_cfda.opportunity_id
                opportunity_assistance_listing_id = opportunity_cfda.opp_cfda_id

                # Make sure the opportunity exists in our target table
                opportunity = self.db_session.execute(
                    select(Opportunity).where(Opportunity.opportunity_id == opportunity_id)
                ).scalar_one_or_none()

                if not opportunity:
                    logger.warning(
                        "Competition references opportunity that doesn't exist in target schema",
                        extra={**extra, "opportunity_id": opportunity_id},
                    )
                    opportunity_id = None
                    opportunity_assistance_listing_id = None

        # To avoid incrementing metrics for records we fail to transform, record
        # here whether it's an insert/update and we'll increment after transforming
        is_insert = target_competition is None

        if opportunity_id is None:
            logger.warning(
                "Competition references opportunity that doesn't exist",
                extra={**extra, "opportunity_id": opportunity_id},
            )
            return

        transformed_competition = transform_competition(
            source_competition,
            target_competition,
            opportunity_id,
            opportunity_assistance_listing_id,
        )

        if is_insert:
            self.increment(
                transform_constants.Metrics.TOTAL_RECORDS_INSERTED,
                prefix=transform_constants.COMPETITION,
            )
            self.db_session.add(transformed_competition)
        else:
            self.increment(
                transform_constants.Metrics.TOTAL_RECORDS_UPDATED,
                prefix=transform_constants.COMPETITION,
            )
            self.db_session.merge(transformed_competition)

        logger.info("Processed competition", extra=extra)
        source_competition.transformed_at = self.transform_time


def transform_competition(
    source_competition: Tcompetition,
    existing_competition: Competition | None,
    opportunity_id: int,
    opportunity_assistance_listing_id: int | None = None,
) -> Competition:
    """Transform a legacy competition record into the new format."""
    log_extra = {"competition_id": source_competition.comp_id}

    if existing_competition is None:
        logger.info("Creating new competition record", extra=log_extra)
        target_competition = Competition(
            competition_id=None,  # UUID will be auto-generated
            legacy_competition_id=source_competition.comp_id,
        )
    else:
        # We always create a new competition record here and merge it in the calling function
        # this way if there is any error doing the transformation, we don't modify the existing one.
        target_competition = Competition(
            competition_id=existing_competition.competition_id,
            legacy_competition_id=source_competition.comp_id,
        )

    # Map fields according to the defined mappings
    target_competition.opportunity_id = opportunity_id
    target_competition.public_competition_id = source_competition.competitionid
    target_competition.legacy_package_id = source_competition.package_id
    target_competition.competition_title = source_competition.competitiontitle
    target_competition.opening_date = source_competition.openingdate
    target_competition.closing_date = source_competition.closingdate
    target_competition.grace_period = source_competition.graceperiod
    target_competition.contact_info = source_competition.contactinfo

    # Transform form family ID to enum value
    target_competition.form_family = transform_form_family(source_competition.familyid)

    # Handle one-to-many relationship for open_to_applicants
    # Get the enum values for the applicant types
    open_to_applicants = transform_open_to_applicants(source_competition.opentoapplicanttype)

    # Directly set the open_to_applicants association proxy
    # The proxy's creator function will handle creating the link objects
    target_competition.open_to_applicants = open_to_applicants

    # Boolean conversions using Y/N values
    target_competition.is_electronic_required = transform_util.convert_yn_bool(
        source_competition.electronic_required
    )
    target_competition.expected_application_count = source_competition.expected_appl_num
    target_competition.expected_application_size_mb = source_competition.expected_appl_size
    target_competition.is_multi_package = transform_util.convert_yn_bool(source_competition.ismulti)
    target_competition.agency_download_url = source_competition.agency_dwnld_url

    # is_wrkspc_compatible is a required field in the source table but optional in the target
    # This value should always exist in the source table
    target_competition.is_legacy_workspace_compatible = transform_util.convert_yn_bool(
        source_competition.is_wrkspc_compatible
    )

    target_competition.can_send_mail = transform_util.convert_yn_bool(source_competition.sendmail)
    target_competition.opportunity_assistance_listing_id = opportunity_assistance_listing_id

    # Handle timestamps
    transform_util.transform_update_create_timestamp(
        source_competition, target_competition, log_extra=log_extra
    )

    return target_competition


def transform_form_family(form_family_id: int | None) -> FormFamily | None:
    """Transform a legacy form family ID to the FormFamily enum value."""
    if form_family_id is None:
        return None

    form_family_map = {
        12: FormFamily.SF_424_INDIVIDUAL,
        14: FormFamily.RR,
        15: FormFamily.SF_424,
        16: FormFamily.SF_424_MANDATORY,
        17: FormFamily.SF_424_SHORT_ORGANIZATION,
    }

    if form_family_id not in form_family_map:
        raise ValueError(f"Unknown form family ID: {form_family_id}")

    return form_family_map[form_family_id]


def transform_open_to_applicants(applicant_type: int | None) -> set[CompetitionOpenToApplicant]:
    """Transform the legacy open to applicant type to the new set of enum values."""
    if applicant_type is None:
        return set()

    # Map the single values
    if applicant_type == 1:
        return {CompetitionOpenToApplicant.ORGANIZATION}
    elif applicant_type == 2:
        return {CompetitionOpenToApplicant.INDIVIDUAL}
    # Special case for both
    elif applicant_type == 3:
        return {CompetitionOpenToApplicant.INDIVIDUAL, CompetitionOpenToApplicant.ORGANIZATION}
    else:
        raise ValueError(f"Unknown open to applicant type: {applicant_type}")
