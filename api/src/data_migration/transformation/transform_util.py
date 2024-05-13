import logging
from datetime import datetime

from src.constants.lookup_constants import (
    ApplicantType,
    FundingCategory,
    FundingInstrument,
    OpportunityCategory,
)
from src.db.models.base import TimestampMixin
from src.db.models.opportunity_models import (
    LinkOpportunitySummaryApplicantType,
    LinkOpportunitySummaryFundingCategory,
    LinkOpportunitySummaryFundingInstrument,
    Opportunity,
    OpportunityAssistanceListing,
    OpportunitySummary,
)
from src.db.models.staging.forecast import TforecastHist
from src.db.models.staging.opportunity import Topportunity, TopportunityCfda
from src.db.models.staging.staging_base import StagingBase
from src.db.models.staging.synopsis import Tsynopsis, TsynopsisHist
from src.util import datetime_util

from . import SourceApplicantType, SourceFundingCategory, SourceFundingInstrument, SourceSummary

logger = logging.getLogger(__name__)

OPPORTUNITY_CATEGORY_MAP = {
    "D": OpportunityCategory.DISCRETIONARY,
    "M": OpportunityCategory.MANDATORY,
    "C": OpportunityCategory.CONTINUATION,
    "E": OpportunityCategory.EARMARK,
    "O": OpportunityCategory.OTHER,
}

APPLICANT_TYPE_MAP = {
    "00": ApplicantType.STATE_GOVERNMENTS,
    "01": ApplicantType.COUNTY_GOVERNMENTS,
    "02": ApplicantType.CITY_OR_TOWNSHIP_GOVERNMENTS,
    "04": ApplicantType.SPECIAL_DISTRICT_GOVERNMENTS,
    "05": ApplicantType.INDEPENDENT_SCHOOL_DISTRICTS,
    "06": ApplicantType.PUBLIC_AND_STATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
    "07": ApplicantType.FEDERALLY_RECOGNIZED_NATIVE_AMERICAN_TRIBAL_GOVERNMENTS,
    "08": ApplicantType.PUBLIC_AND_INDIAN_HOUSING_AUTHORITIES,
    "11": ApplicantType.OTHER_NATIVE_AMERICAN_TRIBAL_ORGANIZATIONS,
    "12": ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITH_501C3,
    "13": ApplicantType.NONPROFITS_NON_HIGHER_EDUCATION_WITHOUT_501C3,
    "20": ApplicantType.PRIVATE_INSTITUTIONS_OF_HIGHER_EDUCATION,
    "21": ApplicantType.INDIVIDUALS,
    "22": ApplicantType.FOR_PROFIT_ORGANIZATIONS_OTHER_THAN_SMALL_BUSINESSES,
    "23": ApplicantType.SMALL_BUSINESSES,
    "25": ApplicantType.OTHER,
    "99": ApplicantType.UNRESTRICTED,
}

FUNDING_CATEGORY_MAP = {
    "RA": FundingCategory.RECOVERY_ACT,
    "AG": FundingCategory.AGRICULTURE,
    "AR": FundingCategory.ARTS,
    "BC": FundingCategory.BUSINESS_AND_COMMERCE,
    "CD": FundingCategory.COMMUNITY_DEVELOPMENT,
    "CP": FundingCategory.CONSUMER_PROTECTION,
    "DPR": FundingCategory.DISASTER_PREVENTION_AND_RELIEF,
    "ED": FundingCategory.EDUCATION,
    "ELT": FundingCategory.EMPLOYMENT_LABOR_AND_TRAINING,
    "EN": FundingCategory.ENERGY,
    "ENV": FundingCategory.ENVIRONMENT,
    "FN": FundingCategory.FOOD_AND_NUTRITION,
    "HL": FundingCategory.HEALTH,
    "HO": FundingCategory.HOUSING,
    "HU": FundingCategory.HUMANITIES,
    "IIJ": FundingCategory.INFRASTRUCTURE_INVESTMENT_AND_JOBS_ACT,
    "IS": FundingCategory.INFORMATION_AND_STATISTICS,
    "ISS": FundingCategory.INCOME_SECURITY_AND_SOCIAL_SERVICES,
    "LJL": FundingCategory.LAW_JUSTICE_AND_LEGAL_SERVICES,
    "NR": FundingCategory.NATURAL_RESOURCES,
    "OZ": FundingCategory.OPPORTUNITY_ZONE_BENEFITS,
    "RD": FundingCategory.REGIONAL_DEVELOPMENT,
    "ST": FundingCategory.SCIENCE_TECHNOLOGY_AND_OTHER_RESEARCH_AND_DEVELOPMENT,
    "T": FundingCategory.TRANSPORTATION,
    "ACA": FundingCategory.AFFORDABLE_CARE_ACT,
    "O": FundingCategory.OTHER,
}

FUNDING_INSTRUMENT_MAP = {
    "CA": FundingInstrument.COOPERATIVE_AGREEMENT,
    "G": FundingInstrument.GRANT,
    "PC": FundingInstrument.PROCUREMENT_CONTRACT,
    "O": FundingInstrument.OTHER,
}


def transform_opportunity(
    source_opportunity: Topportunity, existing_opportunity: Opportunity | None
) -> Opportunity:
    log_extra = {"opportunity_id": source_opportunity.opportunity_id}

    if existing_opportunity is None:
        logger.info("Creating new opportunity record", extra=log_extra)

    # We always create a new opportunity record here and merge it in the calling function
    # this way if there is any error doing the transformation, we don't modify the existing one.
    target_opportunity = Opportunity(opportunity_id=source_opportunity.opportunity_id)

    target_opportunity.opportunity_number = source_opportunity.oppnumber
    target_opportunity.opportunity_title = source_opportunity.opptitle
    target_opportunity.agency = source_opportunity.owningagency
    target_opportunity.category = transform_opportunity_category(source_opportunity.oppcategory)
    target_opportunity.category_explanation = source_opportunity.category_explanation
    target_opportunity.revision_number = source_opportunity.revision_number
    target_opportunity.modified_comments = source_opportunity.modified_comments
    target_opportunity.publisher_user_id = source_opportunity.publisheruid
    target_opportunity.publisher_profile_id = source_opportunity.publisher_profile_id

    # The legacy system doesn't actually have this value as a boolean. There are several
    # different letter codes. However, their API implementation also does this for their draft flag.
    target_opportunity.is_draft = source_opportunity.is_draft != "N"
    transform_update_create_timestamp(source_opportunity, target_opportunity, log_extra=log_extra)

    return target_opportunity


def transform_opportunity_category(value: str | None) -> OpportunityCategory | None:
    if value is None or value == "":
        return None

    if value not in OPPORTUNITY_CATEGORY_MAP:
        raise ValueError("Unrecognized opportunity category: %s" % value)

    return OPPORTUNITY_CATEGORY_MAP[value]


def transform_applicant_type(value: str | None) -> ApplicantType | None:
    if value is None or value == "":
        return None

    if value not in APPLICANT_TYPE_MAP:
        raise ValueError("Unrecognized applicant type: %s" % value)

    return APPLICANT_TYPE_MAP[value]


def transform_funding_category(value: str | None) -> FundingCategory | None:
    if value is None or value == "":
        return None

    if value not in FUNDING_CATEGORY_MAP:
        raise ValueError("Unrecognized funding category: %s" % value)

    return FUNDING_CATEGORY_MAP[value]


def transform_funding_instrument(value: str | None) -> FundingInstrument | None:
    if value is None or value == "":
        return None

    if value not in FUNDING_INSTRUMENT_MAP:
        raise ValueError("Unrecognized funding instrument: %s" % value)

    return FUNDING_INSTRUMENT_MAP[value]


def transform_assistance_listing(
    source_assistance_listing: TopportunityCfda,
    existing_assistance_listing: OpportunityAssistanceListing | None,
) -> OpportunityAssistanceListing:
    log_extra = {"opportunity_assistance_listing_id": source_assistance_listing.opp_cfda_id}

    if existing_assistance_listing is None:
        logger.info("Creating new assistance listing record", extra=log_extra)

    # We always create a new assistance listing record here and merge it in the calling function
    # this way if there is any error doing the transformation, we don't modify the existing one.
    target_assistance_listing = OpportunityAssistanceListing(
        opportunity_assistance_listing_id=source_assistance_listing.opp_cfda_id,
        opportunity_id=source_assistance_listing.opportunity_id,
    )

    target_assistance_listing.assistance_listing_number = source_assistance_listing.cfdanumber
    target_assistance_listing.program_title = source_assistance_listing.programtitle

    transform_update_create_timestamp(
        source_assistance_listing, target_assistance_listing, log_extra=log_extra
    )

    return target_assistance_listing


def transform_opportunity_summary(
    source_summary: SourceSummary, incoming_summary: OpportunitySummary | None
) -> OpportunitySummary:
    log_extra = get_log_extra_summary(source_summary)

    if incoming_summary is None:
        logger.info("Creating new opportunity summary record", extra=log_extra)
        target_summary = OpportunitySummary(
            opportunity_id=source_summary.opportunity_id,
            is_forecast=source_summary.is_forecast,
            revision_number=None,
        )

        # Revision number is only found in the historical table
        if isinstance(source_summary, (TsynopsisHist, TforecastHist)):
            target_summary.revision_number = source_summary.revision_number
    else:
        # We create a new summary object and merge it outside this function
        # that way if any modifications occur on the object and then it errors
        # they aren't actually applied
        target_summary = OpportunitySummary(
            opportunity_summary_id=incoming_summary.opportunity_summary_id
        )

    # Fields in all 4 source tables
    target_summary.version_number = source_summary.version_nbr
    target_summary.is_cost_sharing = convert_yn_bool(source_summary.cost_sharing)
    target_summary.post_date = source_summary.posting_date
    target_summary.archive_date = source_summary.archive_date
    target_summary.expected_number_of_awards = convert_numeric_str_to_int(
        source_summary.number_of_awards
    )
    target_summary.estimated_total_program_funding = convert_numeric_str_to_int(
        source_summary.est_funding
    )
    target_summary.award_floor = convert_numeric_str_to_int(source_summary.award_floor)
    target_summary.award_ceiling = convert_numeric_str_to_int(source_summary.award_ceiling)
    target_summary.additional_info_url = source_summary.fd_link_url
    target_summary.additional_info_url_description = source_summary.fd_link_desc
    target_summary.modification_comments = source_summary.modification_comments
    target_summary.funding_category_description = source_summary.oth_cat_fa_desc
    target_summary.applicant_eligibility_description = source_summary.applicant_elig_desc
    target_summary.agency_name = source_summary.ac_name
    target_summary.agency_email_address = source_summary.ac_email_addr
    target_summary.agency_email_address_description = source_summary.ac_email_desc
    target_summary.can_send_mail = convert_yn_bool(source_summary.sendmail)
    target_summary.publisher_profile_id = source_summary.publisher_profile_id
    target_summary.publisher_user_id = source_summary.publisheruid
    target_summary.updated_by = source_summary.last_upd_id
    target_summary.created_by = source_summary.creator_id

    # Some fields either are named different in synopsis/forecast
    # or only come from one of those tables, so handle those here
    if isinstance(source_summary, (Tsynopsis, TsynopsisHist)):
        target_summary.summary_description = source_summary.syn_desc
        target_summary.agency_code = source_summary.a_sa_code
        target_summary.agency_phone_number = source_summary.ac_phone_number

        # Synopsis only fields
        target_summary.agency_contact_description = source_summary.agency_contact_desc
        target_summary.close_date = source_summary.response_date
        target_summary.close_date_description = source_summary.response_date_desc
        target_summary.unarchive_date = source_summary.unarchive_date

    else:  # TForecast & TForecastHist
        target_summary.summary_description = source_summary.forecast_desc
        target_summary.agency_code = source_summary.agency_code
        target_summary.agency_phone_number = source_summary.ac_phone

        # Forecast only fields
        target_summary.forecasted_post_date = source_summary.est_synopsis_posting_date
        target_summary.forecasted_close_date = source_summary.est_appl_response_date
        target_summary.forecasted_close_date_description = (
            source_summary.est_appl_response_date_desc
        )
        target_summary.forecasted_award_date = source_summary.est_award_date
        target_summary.forecasted_project_start_date = source_summary.est_project_start_date
        target_summary.fiscal_year = source_summary.fiscal_year

    # Historical only
    if isinstance(source_summary, (TsynopsisHist, TforecastHist)):
        target_summary.is_deleted = convert_action_type_to_is_deleted(source_summary.action_type)
    else:
        target_summary.is_deleted = False

    transform_update_create_timestamp(source_summary, target_summary, log_extra=log_extra)

    return target_summary


def convert_opportunity_summary_applicant_type(
    source_applicant_type: SourceApplicantType,
    existing_applicant_type: LinkOpportunitySummaryApplicantType | None,
    opportunity_summary: OpportunitySummary,
) -> LinkOpportunitySummaryApplicantType:
    log_extra = get_log_extra_applicant_type(source_applicant_type)

    # NOTE: The columns we're working with here are mostly the primary keys
    #       While we do support updates, that's really only going to affect
    #       the last update user + timestamps. From checking the prod data
    #       there are basically zero updates to this data (~5 occurred 10+ years ago)
    if existing_applicant_type is None:
        logger.info("Creating new applicant type record", extra=log_extra)

    applicant_type = transform_applicant_type(source_applicant_type.at_id)

    target_applicant_type = LinkOpportunitySummaryApplicantType(
        opportunity_summary_id=opportunity_summary.opportunity_summary_id,
        legacy_applicant_type_id=source_applicant_type.legacy_applicant_type_id,
        applicant_type=applicant_type,
        updated_by=source_applicant_type.last_upd_id,
        created_by=source_applicant_type.creator_id,
    )
    transform_update_create_timestamp(
        source_applicant_type, target_applicant_type, log_extra=log_extra
    )

    return target_applicant_type


def convert_opportunity_summary_funding_instrument(
    source_funding_instrument: SourceFundingInstrument,
    existing_funding_instrument: LinkOpportunitySummaryFundingInstrument | None,
    opportunity_summary: OpportunitySummary,
) -> LinkOpportunitySummaryFundingInstrument:
    log_extra = get_log_extra_funding_instrument(source_funding_instrument)

    # NOTE: The columns we're working with here are mostly the primary keys
    #       While we do support updates, that's really only going to affect
    #       the last update user + timestamps. From checking the prod data
    #       there are basically zero updates to this data (~5 occurred 10+ years ago)
    if existing_funding_instrument is None:
        logger.info("Creating new funding instrument record", extra=log_extra)

    funding_instrument = transform_funding_instrument(source_funding_instrument.fi_id)

    target_funding_instrument = LinkOpportunitySummaryFundingInstrument(
        opportunity_summary_id=opportunity_summary.opportunity_summary_id,
        legacy_funding_instrument_id=source_funding_instrument.legacy_funding_instrument_id,
        funding_instrument=funding_instrument,
        updated_by=source_funding_instrument.last_upd_id,
        created_by=source_funding_instrument.creator_id,
    )

    transform_update_create_timestamp(
        source_funding_instrument, target_funding_instrument, log_extra=log_extra
    )

    return target_funding_instrument


def convert_opportunity_summary_funding_category(
    source_funding_category: SourceFundingCategory,
    existing_funding_category: LinkOpportunitySummaryFundingCategory | None,
    opportunity_summary: OpportunitySummary,
) -> LinkOpportunitySummaryFundingCategory:
    log_extra = get_log_extra_funding_category(source_funding_category)

    # NOTE: The columns we're working with here are mostly the primary keys
    #       While we do support updates, that's really only going to affect
    #       the last update user + timestamps. From checking the prod data
    #       there are basically zero updates to this data (~5 occurred 10+ years ago)
    if existing_funding_category is None:
        logger.info("Creating new funding category record", extra=log_extra)

    funding_category = transform_funding_category(source_funding_category.fac_id)

    target_funding_category = LinkOpportunitySummaryFundingCategory(
        opportunity_summary_id=opportunity_summary.opportunity_summary_id,
        legacy_funding_category_id=source_funding_category.legacy_funding_category_id,
        funding_category=funding_category,
        updated_by=source_funding_category.last_upd_id,
        created_by=source_funding_category.creator_id,
    )

    transform_update_create_timestamp(
        source_funding_category, target_funding_category, log_extra=log_extra
    )

    return target_funding_category


def convert_est_timestamp_to_utc(timestamp: datetime | None) -> datetime | None:
    if timestamp is None:
        return None

    # The timestamps we get from the legacy system have no timezone info
    # but we know the database uses US Eastern timezone by default
    #
    # First add the America/New_York timezone without any other modification
    aware_timestamp = datetime_util.make_timezone_aware(timestamp, "US/Eastern")
    # Then adjust the timezone to UTC this will handle any DST or other conversion complexities
    return datetime_util.adjust_timezone(aware_timestamp, "UTC")


def transform_update_create_timestamp(
    source: StagingBase, target: TimestampMixin, log_extra: dict | None = None
) -> None:
    # Convert the source timestamps to UTC
    # Note: the type ignores are because created_date/last_upd_date are added
    #       on the individual class definitions, not the base class - due to how
    #       we need to maintain the column order of the legacy system.
    #       Every legacy table does have these columns.
    created_timestamp = convert_est_timestamp_to_utc(source.created_date)  # type: ignore[attr-defined]
    updated_timestamp = convert_est_timestamp_to_utc(source.last_upd_date)  # type: ignore[attr-defined]

    if created_timestamp is not None:
        target.created_at = created_timestamp
    else:
        # This is incredibly rare, but possible - because our system requires
        # we set something, we'll default to the current time and log a warning.
        if log_extra is None:
            log_extra = {}

        logger.warning(
            f"{source.__class__} does not have a created_date timestamp set, setting value to now.",
            extra=log_extra,
        )
        target.created_at = datetime_util.utcnow()

    if updated_timestamp is not None:
        target.updated_at = updated_timestamp
    else:
        # In the legacy system, they don't set whether something was updated
        # until it receives an update. We always set the value, and on initial insert
        # want it to be the same as the created_at.
        target.updated_at = target.created_at


TRUTHY = {"Y", "Yes"}
FALSEY = {"N", "No"}


def convert_yn_bool(value: str | None) -> bool | None:
    # Booleans in the Oracle database are stored as varchar/char
    # columns with the values as Y/N (very rarely Yes/No)
    if value is None or value == "":
        return None

    if value in TRUTHY:
        return True

    if value in FALSEY:
        return False

    # Just in case the column isn't actually a boolean
    raise ValueError("Unexpected Y/N bool value: %s" % value)


def convert_action_type_to_is_deleted(value: str | None) -> bool | None:
    if value is None or value == "":
        return None

    if value == "D":  # D = Delete
        return True

    if value == "U":  # U = Update
        return False

    raise ValueError("Unexpected action type value: %s" % value)


def convert_numeric_str_to_int(value: str | None) -> int | None:
    if value is None or value == "":
        return None

    try:
        return int(value)
    except ValueError:
        # From what we've found in the legacy data, some of these numeric strings
        # are written out as "none", "not available", "n/a" or similar. All of these
        # we're fine with collectively treating as null-equivalent
        return None


def get_log_extra_summary(source_summary: SourceSummary) -> dict:
    return {
        "opportunity_id": source_summary.opportunity_id,
        "is_forecast": source_summary.is_forecast,
        # This value only exists on non-historical records
        # use getattr instead of an isinstance if/else for simplicity
        "revision_number": getattr(source_summary, "revision_number", None),
        "table_name": source_summary.__tablename__,
    }


def get_log_extra_applicant_type(source_applicant_type: SourceApplicantType) -> dict:
    return {
        "opportunity_id": source_applicant_type.opportunity_id,
        "at_frcst_id": getattr(source_applicant_type, "at_frcst_id", None),
        "at_syn_id": getattr(source_applicant_type, "at_syn_id", None),
        "revision_number": getattr(source_applicant_type, "revision_number", None),
        "table_name": source_applicant_type.__tablename__,
    }


def get_log_extra_funding_category(source_funding_category: SourceFundingCategory) -> dict:
    return {
        "opportunity_id": source_funding_category.opportunity_id,
        "fac_frcst_id": getattr(source_funding_category, "fac_frcst_id", None),
        "fac_syn_id": getattr(source_funding_category, "fac_syn_id", None),
        "revision_number": getattr(source_funding_category, "revision_number", None),
        "table_name": source_funding_category.__tablename__,
    }


def get_log_extra_funding_instrument(source_funding_instrument: SourceFundingInstrument) -> dict:
    return {
        "opportunity_id": source_funding_instrument.opportunity_id,
        "fi_frcst_id": getattr(source_funding_instrument, "fi_frcst_id", None),
        "fi_syn_id": getattr(source_funding_instrument, "fi_syn_id", None),
        "revision_number": getattr(source_funding_instrument, "revision_number", None),
        "table_name": source_funding_instrument.__tablename__,
    }
