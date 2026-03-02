from enum import StrEnum
from typing import TypeVar

from src.db.models.base import ApiSchemaTable
from src.db.models.staging.forecast import (
    TapplicanttypesForecast,
    TapplicanttypesForecastHist,
    Tforecast,
    TfundactcatForecast,
    TfundactcatForecastHist,
    TfundinstrForecast,
    TfundinstrForecastHist,
)
from src.db.models.staging.staging_base import StagingParamMixin
from src.db.models.staging.synopsis import (
    TapplicanttypesSynopsis,
    TapplicanttypesSynopsisHist,
    TfundactcatSynopsis,
    TfundactcatSynopsisHist,
    TfundinstrSynopsis,
    TfundinstrSynopsisHist,
    Tsynopsis,
)

ORPHANED_CFDA = "orphaned_cfda"
ORPHANED_HISTORICAL_RECORD = "orphaned_historical_record"
ORPHANED_DELETE_RECORD = "orphaned_delete_record"
ORPHANED_COMPETITION = "orphaned_competition"

OPPORTUNITY = "opportunity"
ASSISTANCE_LISTING = "assistance_listing"
OPPORTUNITY_SUMMARY = "opportunity_summary"
APPLICANT_TYPE = "applicant_type"
FUNDING_CATEGORY = "funding_category"
FUNDING_INSTRUMENT = "funding_instrument"
AGENCY = "agency"
OPPORTUNITY_ATTACHMENT = "opportunity_attachment"
COMPETITION = "competition"
COMPETITION_INSTRUCTION = "competition_instruction"


class Metrics(StrEnum):
    TOTAL_RECORDS_PROCESSED = "total_records_processed"
    TOTAL_RECORDS_DELETED = "total_records_deleted"
    TOTAL_RECORDS_INSERTED = "total_records_inserted"
    TOTAL_RECORDS_UPDATED = "total_records_updated"
    TOTAL_RECORDS_SKIPPED = "total_records_skipped"
    TOTAL_RECORDS_ORPHANED = "total_records_orphaned"
    TOTAL_DUPLICATE_RECORDS_SKIPPED = "total_duplicate_records_skipped"
    TOTAL_DELETE_ORPHANS_SKIPPED = "total_delete_orphans_skipped"

    TOTAL_ERROR_COUNT = "total_error_count"

    TOTAL_INVALID_RECORD_SKIPPED = "total_invalid_record_skipped"


S = TypeVar("S", bound=StagingParamMixin)
D = TypeVar("D", bound=ApiSchemaTable)

type SourceSummary = Tforecast | Tsynopsis

type SourceApplicantType = (
    TapplicanttypesForecast
    | TapplicanttypesForecastHist
    | TapplicanttypesSynopsis
    | TapplicanttypesSynopsisHist
)

type SourceFundingCategory = (
    TfundactcatForecast | TfundactcatForecastHist | TfundactcatSynopsis | TfundactcatSynopsisHist
)

type SourceFundingInstrument = (
    TfundinstrForecastHist | TfundinstrForecast | TfundinstrSynopsisHist | TfundinstrSynopsis
)

type SourceAny = SourceApplicantType | SourceFundingCategory | SourceFundingInstrument
